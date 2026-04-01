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

        const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || Deno.env.get('RAZORPAY_KEY_SECRET') || process.env.RAZORPAY_KEY_SECRET;

        // Verify webhook signature
        if (signature) {
            const encoder = new TextEncoder();
            const data = encoder.encode(rawBody);
            const keyData = encoder.encode(WEBHOOK_SECRET);

            const cryptoKey = await crypto.subtle.importKey(
                'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
            );

            const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
            const signatureBytes = new Uint8Array(signatureBuffer);
            const expectedSignature = Array.from(signatureBytes).map((b) => b.toString(16).padStart(2, '0')).join('');

            if (expectedSignature !== signature) {
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
                    .select('payment_status, reference_image_url, template_type')
                    .eq('id', orderId)
                    .single();

                if (!checkErr && currentOrder && currentOrder.payment_status === 'pending') {
                     // Proceed to confirm payment internally natively
                    const hasRefImage = !!currentOrder?.reference_image_url;
                    const isImageOnly = currentOrder?.template_type === 'image';
                    const startStatus = (hasRefImage || isImageOnly) ? 'generating_image' : 'generating';

                    await client.database
                        .from('orders')
                        .update({ 
                            payment_status: 'paid', 
                            generation_status: startStatus, 
                            updated_at: new Date().toISOString() 
                        })
                        .eq('id', orderId);

                    // Trigger the asynchronous generation natively
                    try {
                        if (hasRefImage || isImageOnly) {
                            await client.functions.invoke('generate-image', {
                                body: { orderId, action: 'submit' },
                            });
                        } else {
                            await client.functions.invoke('generate-video', {
                                body: { orderId, action: 'submit' },
                            });
                        }
                    } catch (genErr) {}
                }
            }
        }

        return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: corsHeaders });

    } catch (err) {
        console.error('Webhook error:', err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
    }
}
