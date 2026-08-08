import { createClient } from 'npm:@insforge/sdk';

export default async function (req: Request): Promise<Response> {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const client = createClient({
        baseUrl: Deno.env.get('INSFORGE_BASE_URL')!,
        anonKey: Deno.env.get('ANON_KEY')!,
    });

    try {
        const body = await req.json();

        // Stripe sends the event object directly
        // In production, verify signature with stripe.webhooks.constructEvent()
        const eventType = body.type;
        const session = body.data?.object;

        if (eventType === 'checkout.session.completed') {
            const orderId = session?.metadata?.orderId;

            if (!orderId) {
                return new Response(JSON.stringify({ error: 'No orderId in metadata' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const { data: order } = await client.database
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();
            
            let template = null;
            if (order?.template_id) {
                const { data: t } = await client.database.from('templates').select('*').eq('id', order.template_id).single();
                if (t) template = t;
            }

            let aiModel = (template?.ai_model || template?.aiModel || '').toLowerCase();
            if (!aiModel) {
                if (order?.form_values?.seedance_user_images) aiModel = 'seedance_2_5_v2';
                else if (order?.form_values?.kling_video_url) aiModel = 'kling_3_0_v2';
            }
            const isDirectVideoModel = aiModel.includes('seedance') || aiModel.includes('kling');

            const hasRefImage = !!order?.reference_image_url;
            const isImageOnly = (template?.template_type === 'image' || order?.template_type === 'image') && !isDirectVideoModel;
            
            // For Seedance and Kling, the uploaded images/videos are used directly for generation.
            // We do NOT want to pass them through Nano Banana first.
            const startStatus = (isImageOnly || (hasRefImage && !isDirectVideoModel)) ? 'generating_image' : 'generating';

            // Mark payment as completed, start generation
            await client.database
                .from('orders')
                .update({
                    payment_status: 'paid',
                    generation_status: startStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            const getTargetFunction = (type: string, currentModel: string) => {
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

            // Trigger video generation asynchronously
            try {
                if (startStatus === 'generating_image') {
                    const targetFunc = getTargetFunction('image', aiModel);
                    await client.functions.invoke(targetFunc, { body: { orderId, action: 'submit' } });
                } else {
                    const targetFunc = getTargetFunction('video', aiModel);
                    await client.functions.invoke(targetFunc, { body: { orderId, action: 'submit' } });
                }
            } catch (genErr: unknown) {
                console.error('Failed to trigger video generation:', String(genErr));
                // Don't fail the webhook — the order is still paid
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err: unknown) {
        console.error('Webhook error:', String(err));
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}
