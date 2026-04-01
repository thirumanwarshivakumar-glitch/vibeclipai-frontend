import Stripe from 'npm:stripe';
import { createClient } from 'npm:@insforge/sdk';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || Deno.env.get('STRIPE_SECRET_KEY');
const FRONTEND_URL = process.env.FRONTEND_URL || Deno.env.get('FRONTEND_URL') || 'https://4w8g54a3.insforge.site';

export default async function (req: Request): Promise<Response> {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const client = createClient({
        baseUrl: Deno.env.get('INSFORGE_BASE_URL')!,
        anonKey: Deno.env.get('ANON_KEY')!,
    });

    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return new Response(JSON.stringify({ error: 'orderId is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Fetch order with template info
        const { data: order, error: orderErr } = await client.database
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderErr || !order) {
            return new Response(JSON.stringify({ error: 'Order not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Fetch template name
        const { data: tmpl } = await client.database
            .from('templates')
            .select('name')
            .eq('id', order.template_id)
            .single();

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: tmpl?.name || 'AI Video Invitation',
                        description: 'AI-generated personalized video invitation',
                    },
                    unit_amount: Math.round(Number(order.amount) * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${FRONTEND_URL}/success?orderId=${orderId}`,
            cancel_url: `${FRONTEND_URL}/checkout?canceled=true`,
            customer_email: order.email,
            metadata: { orderId },
        });

        // Save session ID
        await client.database
            .from('orders')
            .update({ stripe_session_id: session.id })
            .eq('id', orderId);

        return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err: unknown) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}
