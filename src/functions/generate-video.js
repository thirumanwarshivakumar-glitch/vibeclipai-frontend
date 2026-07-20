import { createClient } from 'npm:@insforge/sdk';

export default async function (req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { orderId, action = 'poll' } = body;
        
        console.log(`[GEN-VIDEO] >>> INVOKED (SDK-LATEST) orderId: ${orderId} | action: ${action}`);

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

        let template = order.templates;
        if (Array.isArray(template)) template = template[0];

        const aiModel = (template?.ai_model || '').toLowerCase();
        const isKling = aiModel.includes('kling') || (template?.name || '').toLowerCase().includes('kling') || (template?.template_type === 'video' && aiModel === '');
        const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
        if (!KIE_API_KEY) {
            return new Response(JSON.stringify({ error: 'KIE_API_KEY not configured' }), { status: 500, headers: corsHeaders });
        }
        const KIE_BASE_URL = 'https://api.kie.ai/api/v1';

        // Map Veo models properly for the Kie.ai API
        let mappedVeoModel = 'veo3_fast';
        if (aiModel.includes('veo')) {
             mappedVeoModel = 'veo3_fast'; // Using veo3_fast as requested
        }

        // Submit
        if (action === 'submit' || (action === 'poll' && order.generation_status === 'generating' && !order.video_task_id)) {
            console.log(`[GEN-VIDEO] Submitting ${isKling ? 'Kling' : 'Veo'} request...`);
            
            const motionVideoUrl = order.user_video_url || template?.reference_video_url;
            const referenceImageUrl = order.reference_image_url || order.generated_image_url;
            const fullPrompt = order.constructed_video_prompt || order.constructed_prompt || "Generation";

            const kieBody = isKling ? {
                model: 'kling-3.0/motion-control',
                input: {
                    mode: '720p',
                    background_source: 'input_video',
                    video_urls: motionVideoUrl ? [motionVideoUrl] : [],
                    prompt: fullPrompt,
                    input_urls: referenceImageUrl ? [referenceImageUrl] : []
                }
            } : {
                model: mappedVeoModel,
                prompt: fullPrompt,
                reference_image: referenceImageUrl,
                aspectRatio: (order.form_values?.aspect_ratio || template?.default_aspect_ratio || '9:16').split(' ')[0]
            };

            try {
                const response = await fetch(isKling ? `${KIE_BASE_URL}/jobs/createTask` : `${KIE_BASE_URL}/veo/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
                    body: JSON.stringify(kieBody)
                });

                const result = await response.json();
                console.log('[GEN-VIDEO] API Submit Result:', JSON.stringify(result));

                // Support both result.success and result.code === 200
                const taskId = result.data?.taskId || result.data?.recordId || result.taskId || result.recordId;
                const isSuccess = result.success || result.code === 200 || result.msg === 'success';

                if (isSuccess && taskId) {
                    await client.database
                        .from('orders')
                        .update({ video_task_id: taskId, generation_status: 'generating' })
                        .eq('id', orderId);
                    return new Response(JSON.stringify({ success: true, taskId }), { status: 200, headers: corsHeaders });
                } else {
                    const errorMsg = result.message || result.msg || 'Kie submission failure';
                    return new Response(JSON.stringify({ error: errorMsg, details: result }), { status: 500, headers: corsHeaders });
                }
            } catch (submitErr) {
                console.error('[GEN-VIDEO] Fetch Error during submit:', submitErr);
                return new Response(JSON.stringify({ error: 'Failed to connect to Kie API', details: (submitErr as Error).message }), { status: 500, headers: corsHeaders });
            }
        }

        // Poll
        if (action === 'poll' && order.video_task_id) {
            console.log(`[GEN-VIDEO] Polling status for taskId: ${order.video_task_id} (isKling: ${isKling})`);
            const endpoint = isKling ? `${KIE_BASE_URL}/jobs/recordInfo` : `${KIE_BASE_URL}/veo/record-info`;
            const statusRes = await fetch(`${endpoint}?taskId=${order.video_task_id}`, {
                headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
            });
            const statusData = await statusRes.json();
            console.log(`[GEN-VIDEO] Polling Data:`, JSON.stringify(statusData));

            if ((statusData.success || statusData.code === 200 || statusData.msg === 'success') && statusData.data) {
                const task = statusData.data;
                const state = task.state || (task.successFlag === 1 ? 'success' : 'processing');
                
                if (state === 'success') {
                    // Try to find the video URL in various common formats
                    let videoUrl = task.video_url || task.response?.resultUrls?.[0];
                    
                    if (!videoUrl && task.resultJson) {
                        try {
                            const resJson = JSON.parse(task.resultJson);
                            videoUrl = resJson.resultUrls?.[0] || resJson.video_url;
                        } catch (e) {
                            console.error('[GEN-VIDEO] Failed to parse resultJson:', e);
                        }
                    }

                    if (videoUrl) {
                        await client.database
                            .from('orders')
                            .update({ generation_status: 'completed', video_url: videoUrl })
                            .eq('id', orderId);
                        
                        // Optional: Trigger email notify here?
                        try {
                           const { data: emailData, error: emailErr } = await client.functions.invoke('send-email', { body: { orderId } });
                           if (emailErr) console.error('Email trigger rejected:', emailErr);
                           else console.log('Email trigger succeeded:', emailData);
                        } catch(e) { console.error('Email trigger crashed:', e); }

                        return new Response(JSON.stringify({ success: true, status: 'completed', url: videoUrl }), { status: 200, headers: corsHeaders });
                    } else if (state === 'success') {
                         console.error('[GEN-VIDEO] Task success but no URL found in:', JSON.stringify(task));
                    }
                } else if (state === 'fail' || state === 'failed') {
                    const failMsg = task.errorMessage || task.failMsg || 'Kie generation failed';
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
        console.error('[GEN-VIDEO] Crash:', String(err));
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
    }
}

