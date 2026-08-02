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
        
        console.log(`[GEN-KLING-V2] >>> INVOKED orderId: ${orderId} | action: ${action}`);
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
        const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
        if (!KIE_API_KEY) {
            return new Response(JSON.stringify({ error: 'KIE_API_KEY not configured' }), { status: 500, headers: corsHeaders });
        }
        const KIE_BASE_URL = 'https://api.kie.ai/api/v1';

        // Submit
        if (action === 'submit') {
            // ⚡ ATOMIC DB LOCK: Claim lock ONLY IF video_task_id is currently NULL
            const { data: lockResult } = await client.database
                .from('orders')
                .update({ 
                    video_task_id: 'SUBMITTING',
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId)
                .is('video_task_id', null)
                .select();

            if (!lockResult || lockResult.length === 0) {
                console.log(`[GEN-KLING-V2] [LOCK] Order ${orderId} already locked/claimed by parallel thread. Skipping.`);
                return new Response(JSON.stringify({ success: true, message: 'Already claimed by concurrent thread' }), { status: 200, headers: corsHeaders });
            }

            console.log(`[GEN-KLING-V2] [LOCK ACQUIRED] Submitting Kling request...`);

            const motionVideoUrl = order.user_video_url || template?.reference_video_url;
            const referenceImageUrl = order.reference_image_url || order.generated_image_url;
            const fullPrompt = order.constructed_video_prompt || order.constructed_prompt || "Generation";

            const refImageUrls = referenceImageUrl ? referenceImageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];

            const kieBody = {
                model: 'kling-3.0/motion-control',
                input: {
                    mode: '720p',
                    background_source: 'input_video',
                    video_urls: motionVideoUrl ? [motionVideoUrl] : [],
                    prompt: fullPrompt,
                    input_urls: refImageUrls
                }
            };

            try {
                const response = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
                    body: JSON.stringify(kieBody)
                });

                const result = await response.json();
                console.log('[GEN-KLING-V2] API Submit Result:', JSON.stringify(result));

                const taskId = result.data?.taskId || result.data?.recordId || result.taskId || result.recordId;
                const isSuccess = result.success || result.code === 200 || result.msg === 'success';

                if (isSuccess && taskId) {
                    await client.database
                        .from('orders')
                        .update({ video_task_id: taskId, generation_status: 'generating' })
                        .eq('id', orderId);
                    return new Response(JSON.stringify({ success: true, taskId }), { status: 200, headers: corsHeaders });
                } else {
                    const errorMsg = result.message || result.msg || 'Kling submission failure';
                    return new Response(JSON.stringify({ error: errorMsg, details: result }), { status: 500, headers: corsHeaders });
                }
            } catch (submitErr) {
                console.error('[GEN-KLING-V2] Fetch Error during submit:', submitErr);
                return new Response(JSON.stringify({ error: 'Failed to connect to Kie API', details: (submitErr as Error).message }), { status: 500, headers: corsHeaders });
            }
        }

        // Poll
        if (action === 'poll' && order.video_task_id && order.video_task_id !== 'SUBMITTING') {
            console.log(`[GEN-KLING-V2] Polling status for taskId: ${order.video_task_id}`);
            const statusRes = await fetch(`${KIE_BASE_URL}/jobs/recordInfo?taskId=${order.video_task_id}`, {
                headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
            });
            const statusData = await statusRes.json();
            console.log(`[GEN-KLING-V2] Polling Data:`, JSON.stringify(statusData));

            if ((statusData.success || statusData.code === 200 || statusData.msg === 'success') && statusData.data) {
                const task = statusData.data;
                const state = task.state || (task.successFlag === 1 ? 'success' : 'processing');
                
                if (state === 'success') {
                    let videoUrl = task.video_url || task.response?.resultUrls?.[0];
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
                           const { data: emailData, error: emailErr } = await client.functions.invoke('send-email', { body: { orderId } });
                           if (emailErr) console.error('Email trigger rejected:', emailErr);
                           else console.log('Email trigger succeeded:', emailData);
                        } catch(e) { console.error('Email trigger crashed:', e); }

                        return new Response(JSON.stringify({ success: true, status: 'completed', url: videoUrl }), { status: 200, headers: corsHeaders });
                    }
                } else if (state === 'fail' || state === 'failed') {
                    const failMsg = task.errorMessage || task.failMsg || 'Kling generation failed';
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
        console.error('[GEN-KLING-V2] Crash:', String(err));
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
    }
}
