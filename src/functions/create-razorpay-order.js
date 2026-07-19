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
        const { orderId, amount, currency, mode } = body;

        if (!orderId) {
            return new Response(JSON.stringify({ error: 'Order ID required' }), { status: 400, headers: corsHeaders });
        }

        const isLive = mode === 'live';
        const KEY_ID = isLive ? Deno.env.get('RAZORPAY_KEY_ID_LIVE') : Deno.env.get('RAZORPAY_KEY_ID');
        const KEY_SECRET = isLive ? Deno.env.get('RAZORPAY_KEY_SECRET_LIVE') : Deno.env.get('RAZORPAY_KEY_SECRET');

        const orderAmount = amount ? Math.round(amount * 84 * 100) : 50000;
        const orderCurrency = currency || 'INR';

        const payload = {
            amount: orderAmount,
            currency: orderCurrency,
            receipt: `rcpt_${orderId.replace(/-/g, '').substring(0, 15)}`,
            notes: {
                platform: "AI Template Website",
                orderId: orderId
            }
        };

        const authHeader = 'Basic ' + btoa(`${KEY_ID}:${KEY_SECRET}`);

        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const rzpOrder = await response.json();

        if (rzpOrder.error) {
            return new Response(JSON.stringify({ error: rzpOrder.error.description }), { status: 400, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
    }
}
