import { createClient } from 'npm:@insforge/sdk';

export default async function (req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    try {
        const url = new URL(req.url);
        const orderId = url.searchParams.get('orderId');
        const slot = url.searchParams.get('slot') || '1';

        if (!orderId) {
            return new Response(JSON.stringify({ error: 'Missing orderId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const client = createClient({
            baseUrl: Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_INTERNAL_URL') || 'https://4w8g54a3.ap-southeast.insforge.app',
            anonKey: Deno.env.get('ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTE5NzF9.ljwpcHftNUka7V5rYEOjmdEw9p2bUzIDRrPORQm56Os',
        });

        const { data: order, error: fetchErr } = await client.database
            .from('orders')
            .select('form_values, reference_image_url')
            .eq('id', orderId)
            .single();

        if (fetchErr || !order) {
            return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        let imageData = order.form_values?.seedance_user_images?.[slot] || 
                        order.form_values?.seedance_user_images?.[Number(slot)] || 
                        order.reference_image_url;

        if (!imageData) {
            return new Response(JSON.stringify({ error: 'No image found for this slot' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
            return Response.redirect(imageData, 302);
        }

        if (imageData.startsWith('data:image/')) {
            const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const mimeType = matches[1];
                const base64Data = matches[2];
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                return new Response(bytes, {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': mimeType,
                        'Content-Length': String(bytes.length),
                        'Cache-Control': 'public, max-age=86400',
                    }
                });
            }
        }

        return new Response(JSON.stringify({ error: 'Unsupported image format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
}
