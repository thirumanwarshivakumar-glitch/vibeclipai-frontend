import { createClient } from 'npm:@insforge/sdk';

export default async function (req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-razorpay-signature',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        const WEBHOOK_SECRET_LIVE = Deno.env.get('RAZORPAY_WEBHOOK_SECRET_LIVE') || Deno.env.get('RAZORPAY_KEY_SECRET_LIVE');
        const WEBHOOK_SECRET_TEST = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || Deno.env.get('RAZORPAY_KEY_SECRET');

        let isVerified = false;
        let isLiveMode = false;

        // Verify webhook signature
        if (signature) {
            const encoder = new TextEncoder();
            const data = encoder.encode(rawBody);

            // 1. Try verifying with Live Secret
            if (WEBHOOK_SECRET_LIVE) {
                const keyDataLive = encoder.encode(WEBHOOK_SECRET_LIVE);
                const cryptoKeyLive = await crypto.subtle.importKey(
                    'raw', keyDataLive, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
                );
                const signatureBufferLive = await crypto.subtle.sign('HMAC', cryptoKeyLive, data);
                const signatureBytesLive = new Uint8Array(signatureBufferLive);
                const expectedSignatureLive = Array.from(signatureBytesLive).map((b) => b.toString(16).padStart(2, '0')).join('');
                if (expectedSignatureLive === signature) {
                    isVerified = true;
                    isLiveMode = true;
                }
            }

            // 2. Try verifying with Test Secret if not already verified
            if (!isVerified && WEBHOOK_SECRET_TEST) {
                const keyDataTest = encoder.encode(WEBHOOK_SECRET_TEST);
                const cryptoKeyTest = await crypto.subtle.importKey(
                    'raw', keyDataTest, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
                );
                const signatureBufferTest = await crypto.subtle.sign('HMAC', cryptoKeyTest, data);
                const signatureBytesTest = new Uint8Array(signatureBufferTest);
                const expectedSignatureTest = Array.from(signatureBytesTest).map((b) => b.toString(16).padStart(2, '0')).join('');
                if (expectedSignatureTest === signature) {
                    isVerified = true;
                    isLiveMode = false;
                }
            }

            if (!isVerified) {
                return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { status: 400, headers: corsHeaders });
            }
        }

        const body = JSON.parse(rawBody);
        const eventType = body.event;

        // If order.paid or payment.captured
        if (eventType === 'order.paid' || eventType === 'payment.captured') {
            const paymentEntity = body.payload?.payment?.entity || body.payload?.order?.entity;
            const orderId = paymentEntity?.notes?.orderId;

            if (orderId) {
                const client = createClient({
                    baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
                    anonKey: Deno.env.get('ANON_KEY'),
                });

                // Check current status before updating to avoid duplicate runs
                const { data: currentOrder, error: checkErr } = await client.database
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();

                if (!checkErr && currentOrder && currentOrder.payment_status === 'pending') {
                    let template = null;
                    if (currentOrder?.template_id) {
                        const { data: t } = await client.database.from('templates').select('*').eq('id', currentOrder.template_id).single();
                        if (t) template = t;
                    }

                    let aiModel = (template?.ai_model || template?.aiModel || '').toLowerCase();
                    if (!aiModel) {
                        if (currentOrder?.form_values?.seedance_user_images) aiModel = 'seedance_2_5_v2';
                        else if (currentOrder?.form_values?.kling_video_url) aiModel = 'kling_3_0_v2';
                    }
                    const isDirectVideoModel = aiModel.includes('seedance') || aiModel.includes('kling');

                    const hasRefImage = !!currentOrder?.reference_image_url;
                    const isImageOnly = (template?.template_type === 'image' || currentOrder?.template_type === 'image') && !isDirectVideoModel;
                    
                    // For Seedance and Kling, the uploaded images/videos are used directly for generation.
                    // We do NOT want to pass them through Nano Banana first.
                    const startStatus = (isImageOnly || (hasRefImage && !isDirectVideoModel)) ? 'generating_image' : 'generating';

                    // ⚡ ATOMIC CONCURRENCY LOCK: Update ONLY if payment_status is still 'pending'
                    const { data: updatedOrders } = await client.database
                        .from('orders')
                        .update({ 
                            payment_status: 'paid', 
                            generation_status: startStatus, 
                            updated_at: new Date().toISOString() 
                        })
                        .eq('id', orderId)
                        .eq('payment_status', 'pending')
                        .select();

                    // If no rows updated, another concurrent thread (Frontend AJAX) already claimed the lock!
                    if (!updatedOrders || updatedOrders.length === 0) {
                        console.log(`[LOCK] Order ${orderId} already claimed by concurrent thread in webhook. Skipping duplicate execution.`);
                        return new Response(JSON.stringify({ success: true, message: 'Already claimed by concurrent thread' }), {
                            status: 200,
                            headers: corsHeaders
                        });
                    }

                    // Determine Router (matches verify-razorpay-payment.js and process-order.js)
                    const getTargetFunction = (type, currentModel) => {
                        if (type === 'image') {
                            if (currentModel === 'nano_banana_pro_v2') return 'generate-image-nano-v2';
                            return 'generate-image';
                        }
                        if (type === 'video') {
                            if (currentModel === 'veo_3_1_v2') return 'generate-video-veo-v2';
                            if (currentModel.includes('kling')) return 'generate-video-kling-v2';
                            if (currentModel.includes('seedance')) return 'generate-video-seedance-v2';
                            return 'generate-video';
                        }
                        return 'generate-video';
                    };

                    // Trigger the asynchronous generation natively
                    try {
                        if (startStatus === 'generating_image') {
                            const targetFunc = getTargetFunction('image', aiModel);
                            await client.functions.invoke(targetFunc, {
                                body: { orderId, action: 'submit' },
                            });
                        } else {
                            const targetFunc = getTargetFunction('video', aiModel);
                            await client.functions.invoke(targetFunc, {
                                body: { orderId, action: 'submit' },
                            });
                        }
                    } catch (genErr) {
                        console.error('Failed to trigger webhook generation pipeline:', genErr);
                    }
                }
            }
        }

        return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: corsHeaders });

    } catch (err) {
        console.error('Webhook error:', err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
    }
}
