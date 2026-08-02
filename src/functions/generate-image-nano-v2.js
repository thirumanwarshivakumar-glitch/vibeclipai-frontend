import { createClient } from 'npm:@insforge/sdk';

export default async function (req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    try {
        const body = await req.json();
        const { orderId, action = 'poll' } = body;
        
        console.log(`[GEN-IMAGE-NANO-V2] >>> INVOKED orderId: ${orderId} | action: ${action}`);
        if (!orderId) return new Response(JSON.stringify({ error: 'Missing orderId' }), { status: 400, headers: corsHeaders });

        const client = createClient({
            baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
            anonKey: Deno.env.get('ANON_KEY'),
        });

        const { data: order, error: fetchErr } = await client.database
            .from('orders')
            .select('*, templates(*)')
            .eq('id', orderId)
            .single();

        if (fetchErr || !order) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: corsHeaders });

        const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
        if (!KIE_API_KEY) {
            return new Response(JSON.stringify({ error: 'KIE_API_KEY not configured' }), { status: 500, headers: corsHeaders });
        }
        const KIE_BASE_URL = 'https://api.kie.ai/api/v1';

        // Submit
        if (action === 'submit') {
            if (order.image_task_id === 'SUBMITTING') {
                console.log('[GEN-IMAGE-NANO-V2] Submission already in progress. Skipping duplicate submit.');
                return new Response(JSON.stringify({ success: true, message: 'Submission in progress' }), { status: 200, headers: corsHeaders });
            }
            if (order.image_task_id && order.image_task_id !== 'SUBMITTING') {
                console.log(`[GEN-IMAGE-NANO-V2] Task already exists (${order.image_task_id}). Skipping resubmit.`);
                return new Response(JSON.stringify({ success: true, taskId: order.image_task_id }), { status: 200, headers: corsHeaders });
            }

            console.log(`[GEN-IMAGE-NANO-V2] Submitting Nano Banana request...`);
            await client.database
                .from('orders')
                .update({ image_task_id: 'SUBMITTING' })
                .eq('id', orderId);
            
            const prompt = order.constructed_prompt || order.constructed_image_prompt || "Generation";
            const ratio = order.aspect_ratio || "1:1";
            let width = 1024, height = 1024;
            if (ratio === '16:9') { width = 1280; height = 768; }
            else if (ratio === '9:16') { width = 768; height = 1280; }
            else if (ratio === '4:3') { width = 1152; height = 896; }
            else if (ratio === '3:4') { width = 896; height = 1152; }

            const userImageUrl = order.user_image_url || order.user_video_url;

            const kieBody: any = {
                model: 'nano-banana-2',
                prompt: prompt,
                width: width,
                height: height,
            };

            if (userImageUrl) {
                kieBody.image_url = userImageUrl;
                kieBody.strength = 0.5; // Default strength for image-to-image
            }

            const response = await fetch(`${KIE_BASE_URL}/images/generations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
                body: JSON.stringify(kieBody)
            });

            const result = await response.json();
            console.log('[GEN-IMAGE-NANO-V2] API Submit Result:', JSON.stringify(result));

            const isSuccess = result.success || result.code === 200 || result.msg === 'success' || result.data;

            if (isSuccess && result.data && result.data[0]?.url) {
                // Synchronous return
                const imageUrl = result.data[0].url;
                await client.database
                    .from('orders')
                    .update({ 
                        generated_image_url: imageUrl, 
                        generation_status: 'review_image' 
                    })
                    .eq('id', orderId);

                return new Response(JSON.stringify({ success: true, status: 'review_image', url: imageUrl }), { status: 200, headers: corsHeaders });
            } else if (isSuccess && (result.data?.taskId || result.taskId)) {
                // Asynchronous task (if Nano supports it, just in case)
                const taskId = result.data?.taskId || result.taskId;
                await client.database
                    .from('orders')
                    .update({ image_task_id: taskId, generation_status: 'generating_image' })
                    .eq('id', orderId);
                return new Response(JSON.stringify({ success: true, taskId }), { status: 200, headers: corsHeaders });
            } else {
                const errorMsg = result.message || result.msg || 'Nano Banana submission failure';
                return new Response(JSON.stringify({ error: errorMsg, details: result }), { status: 500, headers: corsHeaders });
            }
        }

        // Poll (only if it was async and task_id is valid)
        if (action === 'poll' && order.image_task_id && order.image_task_id !== 'SUBMITTING') {
            console.log(`[GEN-IMAGE-NANO-V2] Polling status for taskId: ${order.image_task_id}`);
            const statusRes = await fetch(`${KIE_BASE_URL}/jobs/recordInfo?taskId=${order.image_task_id}`, {
                headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
            });
            const statusData = await statusRes.json();
            
            if ((statusData.success || statusData.code === 200 || statusData.msg === 'success') && statusData.data) {
                const task = statusData.data;
                const state = task.state || (task.successFlag === 1 ? 'success' : 'processing');
                
                if (state === 'success') {
                    let imageUrl = task.response?.resultUrls?.[0] || task.image_url;
                    if (!imageUrl && task.resultJson) {
                        try {
                            const resJson = JSON.parse(task.resultJson);
                            imageUrl = resJson.resultUrls?.[0] || resJson.image_url;
                        } catch (e) {}
                    }

                    if (imageUrl) {
                        await client.database
                            .from('orders')
                            .update({ generated_image_url: imageUrl, generation_status: 'review_image' })
                            .eq('id', orderId);

                        return new Response(JSON.stringify({ success: true, status: 'review_image', url: imageUrl }), { status: 200, headers: corsHeaders });
                    }
                } else if (state === 'fail' || state === 'failed') {
                    const failMsg = task.errorMessage || task.failMsg || 'Nano Banana generation failed';
                    await client.database
                        .from('orders')
                        .update({ generation_status: 'failed', video_url: `ERROR: ${failMsg}` })
                        .eq('id', orderId);
                    return new Response(JSON.stringify({ success: false, status: 'failed', error: failMsg }), { status: 200, headers: corsHeaders });
                }
            }
        }

        return new Response(JSON.stringify({ success: true, status: order.generation_status }), { status: 200, headers: corsHeaders });

    } catch (err) {
        console.error('[GEN-IMAGE-NANO-V2] Crash:', String(err));
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
    }
}
