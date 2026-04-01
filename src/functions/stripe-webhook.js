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

            // Mark payment as completed, start generation
            await client.database
                .from('orders')
                .update({
                    payment_status: 'paid',
                    generation_status: 'generating',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            // Trigger video generation asynchronously
            try {
                await client.functions.invoke('generate-video', {
                    body: { orderId },
                });
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
