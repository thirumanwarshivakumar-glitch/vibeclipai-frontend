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
        
        console.log(`[GEN-SEEDANCE-V2] >>> INVOKED orderId: ${orderId} | action: ${action}`);
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

        const template = Array.isArray(order.templates) ? order.templates[0] : order.templates;
        const KIE_API_KEY = Deno.env.get('KIE_API_KEY') || '06cfa869354f6e2b85b8d5bbf140ca93';
        const KIE_BASE_URL = 'https://api.kie.ai/api/v1';

        // Submit
        if (action === 'submit' || (action === 'poll' && order.generation_status === 'generating' && !order.video_task_id)) {
            console.log(`[GEN-SEEDANCE-V2] Submitting Seedance request...`);
            
            const motionVideoUrl = order.user_video_url || template?.reference_video_url;
            const referenceImageUrl = order.reference_image_url || order.generated_image_url || template?.reference_image_url;
            const fullPrompt = order.constructed_video_prompt || order.constructed_prompt || "Generation";

            const aspectR = template?.default_aspect_ratio || "16:9";
            // Map 1:1, 16:9, etc. Seedance expects 16:9, 4:3, 1:1, 3:4, 9:16, 21:9
            
            const duration = parseInt(template?.video_duration) || 8; 

            const refImageUrls = referenceImageUrl ? referenceImageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];

            const kieBody = {
                model: 'bytedance/seedance-2-fast',
                input: {
                    prompt: fullPrompt,
                    reference_image_urls: refImageUrls,
                    reference_video_urls: motionVideoUrl ? [motionVideoUrl] : [],
                    generate_audio: true, // Requested native audio support
                    resolution: "480p", // Requested 480P explicitly
                    aspect_ratio: aspectR,
                    duration: duration,
                    web_search: false,
                    nsfw_checker: true
                }
            };

            try {
                const response = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
                    body: JSON.stringify(kieBody)
                });

                const result = await response.json();
                console.log('[GEN-SEEDANCE-V2] API Submit Result:', JSON.stringify(result));

                const taskId = result.data?.taskId || result.data?.recordId || result.taskId || result.recordId;
                const isSuccess = result.success || result.code === 200 || result.msg === 'success';

                if (isSuccess && taskId) {
                    await client.database
                        .from('orders')
                        .update({ video_task_id: taskId, generation_status: 'generating' })
                        .eq('id', orderId);
                    return new Response(JSON.stringify({ success: true, taskId }), { status: 200, headers: corsHeaders });
                } else {
                    const errorMsg = result.message || result.msg || 'Seedance submission failure';
                    return new Response(JSON.stringify({ error: errorMsg, details: result }), { status: 500, headers: corsHeaders });
                }
            } catch (submitErr) {
                console.error('[GEN-SEEDANCE-V2] Fetch Error during submit:', submitErr);
                return new Response(JSON.stringify({ error: 'Failed to connect to Kie API', details: (submitErr as Error).message }), { status: 500, headers: corsHeaders });
            }
        }

        // Poll
        if (action === 'poll' && order.video_task_id) {
            console.log(`[GEN-SEEDANCE-V2] Polling status for taskId: ${order.video_task_id}`);
            const statusRes = await fetch(`${KIE_BASE_URL}/jobs/recordInfo?taskId=${order.video_task_id}`, {
                headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
            });
            const statusData = await statusRes.json();
            console.log(`[GEN-SEEDANCE-V2] Polling Data:`, JSON.stringify(statusData));

            if ((statusData.success || statusData.code === 200 || statusData.msg === 'success') && statusData.data) {
                const task = statusData.data;
                const state = task.state || (task.successFlag === 1 ? 'success' : 'processing');
                
                if (state === 'success') {
                    let videoUrl = task.video_url || task.response?.resultUrls?.[0] || task.response?.video_url;
                    if (!videoUrl && task.resultJson) {
                        try {
                            const resJson = JSON.parse(task.resultJson);
                            videoUrl = resJson.resultUrls?.[0] || resJson.video_url;
                        } catch (e) {}
                    }

                    if (videoUrl) {
                        await client.database
                            .from('orders')
                            .update({ generation_status: 'completed', video_url: videoUrl })
                            .eq('id', orderId);
                        
                        try {
                           await client.functions.invoke('send-email', { body: { orderId } });
                        } catch(e) { console.error('Email trigger fail', e); }

                        return new Response(JSON.stringify({ success: true, status: 'completed', url: videoUrl }), { status: 200, headers: corsHeaders });
                    }
                } else if (state === 'fail' || state === 'failed') {
                    const failMsg = task.errorMessage || task.failMsg || 'Seedance generation failed';
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
        console.error('[GEN-SEEDANCE-V2] Crash:', String(err));
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
    }
}
