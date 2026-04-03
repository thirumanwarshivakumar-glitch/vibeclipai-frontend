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
        const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

        const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

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
            baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
            anonKey: Deno.env.get('ANON_KEY'),
        });

        // Confirm Payment Logic directly instead of calling process-order to avoid nested invocations
        const { data: order, error: fetchErr } = await client.database
            .from('orders')
            .select('reference_image_url, template_type, payment_status')
            .eq('id', orderId)
            .single();

        if (fetchErr) {
            throw new Error(`Failed to fetch order: ${fetchErr.message}`);
        }

        if (order?.payment_status === 'paid') {
            return new Response(JSON.stringify({ success: true, message: 'Already paid' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const hasRefImage = !!order?.reference_image_url;
        const isImageOnly = order?.template_type === 'image';
        const startStatus = (hasRefImage || isImageOnly) ? 'generating_image' : 'generating';

        const { error: updateErr } = await client.database
            .from('orders')
            .update({ 
                payment_status: 'paid', 
                generation_status: startStatus, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', orderId);

        if (updateErr) {
            throw new Error(`Failed to update order: ${updateErr.message}`);
        }

        // Trigger the asynchronous generation natively
        try {
            if (hasRefImage || isImageOnly) {
                const { data, error } = await client.functions.invoke('generate-image', {
                    body: { orderId, action: 'submit' },
                });
                if (error) throw new Error('Invoke generate-image failed: ' + error.message);
            } else {
                const { data, error } = await client.functions.invoke('generate-video', {
                    body: { orderId, action: 'submit' },
                });
                if (error) throw new Error('Invoke generate-video failed: ' + error.message);
            }
        } catch (genErr) {
            const err = genErr instanceof Error ? genErr : new Error(String(genErr));
            console.error('Failed to trigger generation:', err.message);
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
