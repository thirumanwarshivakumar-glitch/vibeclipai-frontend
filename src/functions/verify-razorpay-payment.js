import { createClient } from 'npm:@insforge/sdk';

export default async function (req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature, mode } = body;

        const isLive = mode === 'live';
        const KEY_SECRET = isLive ? Deno.env.get('RAZORPAY_KEY_SECRET_LIVE') : Deno.env.get('RAZORPAY_KEY_SECRET');

        // Verification logic
        const encoder = new TextEncoder();
        const data = encoder.encode(razorpay_order_id + "|" + razorpay_payment_id);
        const keyData = encoder.encode(KEY_SECRET);

        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
        const signatureBytes = new Uint8Array(signatureBuffer);
        const expectedSignature = Array.from(signatureBytes).map((b) => b.toString(16).padStart(2, '0')).join('');

        if (expectedSignature !== razorpay_signature) {
            console.error('Signature mismatch!');
            return new Response(JSON.stringify({ error: `Invalid signature. Secret length: ${KEY_SECRET ? KEY_SECRET.length : 0}` }), { status: 400, headers: corsHeaders });
        }

        const client = createClient({
            baseUrl: Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_INTERNAL_URL'),
            anonKey: Deno.env.get('ANON_KEY'),
        });

        // Confirm Payment Logic directly instead of calling process-order to avoid nested invocations
        const { data: order, error: fetchErr } = await client.database
            .from('orders')
            .select('*, templates(*)')
            .eq('id', orderId)
            .single();

        if (fetchErr) {
            console.error("DB Fetch Error Details:", JSON.stringify(fetchErr));
            throw new Error(`Failed to fetch order: ${fetchErr.message} (status: ${fetchErr.statusCode || fetchErr.status}, details: ${JSON.stringify(fetchErr)})`);
        }

        if (order?.payment_status === 'paid') {
            return new Response(JSON.stringify({ success: true, message: 'Already paid' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let template = order?.templates;
        if (Array.isArray(template)) template = template[0];
        
        if ((!template || !template.ai_model) && order?.template_id) {
           const { data: t } = await client.database.from('templates').select('*').eq('id', order.template_id).single();
           if (t) template = t;
        }

        const aiModel = (template?.ai_model || template?.aiModel || '').toLowerCase();
        const isDirectVideoModel = aiModel.includes('seedance') || aiModel.includes('kling');

        const hasRefImage = !!order?.reference_image_url;
        const isImageOnly = order?.template_type === 'image';
        
        // For Seedance and Kling, the uploaded images/videos are used directly for generation.
        // We do NOT want to pass them through Nano Banana first.
        const startStatus = (isImageOnly || (hasRefImage && !isDirectVideoModel)) ? 'generating_image' : 'generating';

        // ⚡ ATOMIC CONCURRENCY LOCK: Update ONLY if payment_status is still 'pending'
        const { data: updatedOrders, error: updateErr } = await client.database
            .from('orders')
            .update({ 
                payment_status: 'paid', 
                generation_status: startStatus, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', orderId)
            .eq('payment_status', 'pending')
            .select();

        if (updateErr) {
            throw new Error(`Failed to update order: ${updateErr.message}`);
        }

        // If no rows updated, another concurrent thread (Webhook/AJAX) already claimed the lock!
        if (!updatedOrders || updatedOrders.length === 0) {
            console.log(`[LOCK] Order ${orderId} already claimed by concurrent thread. Skipping duplicate execution.`);
            return new Response(JSON.stringify({ success: true, message: 'Already claimed by concurrent thread' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Determine Router (matches process-order.js)
        const getTargetFunction = (type, currentModel) => {
            if (type === 'image') {
                if (currentModel === 'nano_banana_pro_v2') return 'generate-image-nano-v2';
                return 'generate-image';
            }
            if (type === 'video') {
                if (currentModel === 'veo_3_1_v2') return 'generate-video-veo-v2';
                if (currentModel === 'kling_3_0_v2') return 'generate-video-kling-v2';
                if (currentModel.includes('seedance')) return 'generate-video-seedance-v2';
                return 'generate-video';
            }
            return 'generate-video';
        };

        // Trigger the asynchronous generation natively
        try {
            console.log(`[VERIFY-PAY] Order ${orderId} marked paid. startStatus: ${startStatus}. isKling: ${isKling}`);
            
            const invokeBody = { orderId, action: 'submit' };
            console.log(`[VERIFY-PAY] Invoking generation with body:`, JSON.stringify(invokeBody));

            if (startStatus === 'generating_image') {
                const targetFunc = getTargetFunction('image', aiModel);
                const { data, error } = await client.functions.invoke(targetFunc, {
                    body: invokeBody,
                });
                console.log(`[VERIFY-PAY] ${targetFunc} response:`, { data, error });
                if (error) throw new Error(`Invoke ${targetFunc} failed: ` + (error.message || JSON.stringify(error)));
            } else {
                const targetFunc = getTargetFunction('video', aiModel);
                const { data, error } = await client.functions.invoke(targetFunc, {
                    body: invokeBody,
                });
                console.log(`[VERIFY-PAY] ${targetFunc} response:`, { data, error });
                if (error) throw new Error(`Invoke ${targetFunc} failed: ` + (error.message || JSON.stringify(error)));
            }
        } catch (genErr) {
            const err = genErr instanceof Error ? genErr : new Error(String(genErr));
            console.error('[VERIFY-PAY] CRITICAL: Failed to trigger generation pipeline:', err.message);
            // Swallowing error - order is already paid, user should be redirected to success page
        }

        return new Response(JSON.stringify({ success: true, status: startStatus }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Exception caught in verify-razorpay-payment:', String(err));
        const errMsg = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: `Edge Exception: ${errMsg}` }), { status: 500, headers: corsHeaders });
    }
}
