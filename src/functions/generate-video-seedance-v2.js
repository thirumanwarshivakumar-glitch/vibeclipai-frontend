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
            baseUrl: Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_INTERNAL_URL') || 'https://4w8g54a3.ap-southeast.insforge.app',
            anonKey: Deno.env.get('ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTE5NzF9.ljwpcHftNUka7V5rYEOjmdEw9p2bUzIDRrPORQm56Os',
        });

        const { data: order, error: fetchErr } = await client.database
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (fetchErr || !order) {
            console.error('[GEN-SEEDANCE-V2] Order fetch error:', fetchErr);
            return new Response(JSON.stringify({ error: 'Order not found', details: fetchErr }), { status: 404, headers: corsHeaders });
        }

        let template = null;
        if (order.template_id) {
            const { data: t } = await client.database
                .from('templates')
                .select('*')
                .eq('id', order.template_id)
                .single();
            if (t) template = t;
        }

        const KIE_API_KEY = Deno.env.get('KIE_API_KEY') || '06cfa869354f6e2b85b8d5bbf140ca93';
        if (!KIE_API_KEY) {
            return new Response(JSON.stringify({ error: 'KIE_API_KEY not configured' }), { status: 500, headers: corsHeaders });
        }
        const KIE_BASE_URL = 'https://api.kie.ai/api/v1';

        // Submit (or Auto-Trigger if polling while video_task_id is null)
        if (action === 'submit' || (action === 'poll' && !order.video_task_id)) {
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
                console.log(`[GEN-SEEDANCE-V2] [LOCK] Order ${orderId} already locked/claimed by parallel thread. Skipping.`);
                return new Response(JSON.stringify({ success: true, message: 'Already claimed by concurrent thread' }), { status: 200, headers: corsHeaders });
            }

            console.log(`[GEN-SEEDANCE-V2] [LOCK ACQUIRED] Submitting Seedance request...`);
            
            let aiModel = (template?.ai_model || template?.aiModel || '').toLowerCase();
            if (!aiModel && order?.form_values?.seedance_user_images) aiModel = 'seedance_2_5_v2';
            const isSeedance25 = aiModel === 'seedance_2_5_v2' || aiModel.includes('2.5') || aiModel.includes('2_5') || (!aiModel.includes('fast'));
            const modelEndpoint = isSeedance25 ? 'bytedance/seedance-2-5' : 'bytedance/seedance-2-fast';

            console.log(`[GEN-SEEDANCE-V2] Model: ${modelEndpoint} | isSeedance25: ${isSeedance25}`);

            const motionVideoUrl = order.user_video_url || template?.reference_video_url;
            const fullPrompt = order.constructed_video_prompt || order.constructed_prompt || "Generation";
            const aspectR = template?.default_aspect_ratio || "16:9";
            
            // Seedance 2.5 supports up to 30s; 2.0 Fast supports up to 15s
            const rawDuration = parseInt(template?.video_duration) || 10;
            const maxAllowed = isSeedance25 ? 30 : 15;
            const duration = Math.min(maxAllowed, Math.max(3, rawDuration));

            // Assemble Image Slots for Seedance 2.5
            let refImageUrls = [];
            let defaultAudioUrl = '';
            let syncAudio = true;

            if (isSeedance25) {
                const refData = template?.reference_images || template?.seedance_slots;
                const slots = Array.isArray(refData) ? refData : (refData?.slots || []);
                const audioConfig = !Array.isArray(refData) && refData?.audio ? refData.audio : {};

                defaultAudioUrl = audioConfig.reference_audio_url || template?.reference_audio_url || '';
                syncAudio = audioConfig.generate_audio ?? (template?.generate_audio !== false);

                const userUploadedSlots = order.form_values?.seedance_user_images || {};

                if (Array.isArray(slots) && slots.length > 0) {
                    slots.forEach((s) => {
                        if (s && s.enabled) {
                            if (s.source === 'user') {
                                const userUrl = userUploadedSlots[s.slot] || userUploadedSlots[String(s.slot)];
                                if (userUrl) refImageUrls.push(userUrl);
                            } else if (s.source === 'admin' && s.url) {
                                refImageUrls.push(s.url);
                            }
                        }
                    });
                }
            }

            // Fallback to reference_image_url if slots were not used or empty
            if (refImageUrls.length === 0) {
                const referenceImageUrl = order.reference_image_url || order.generated_image_url || template?.reference_image_url;
                refImageUrls = referenceImageUrl ? referenceImageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
            }

            // Audio references
            const audioUrl = order.form_values?.user_audio_url || order.reference_audio_url || defaultAudioUrl;
            const refAudioUrls = audioUrl ? [audioUrl] : [];

            const kieBody = {
                model: modelEndpoint,
                input: {
                    prompt: fullPrompt,
                    reference_image_urls: refImageUrls,
                    reference_video_urls: motionVideoUrl ? [motionVideoUrl] : [],
                    reference_audio_urls: refAudioUrls,
                    generate_audio: syncAudio,
                    resolution: "480p", // 480P fixed
                    aspect_ratio: aspectR,
                    duration: duration,
                    output_format: "mp4",
                    web_search: false,
                    nsfw_checker: true
                }
            };

            console.log(`[GEN-SEEDANCE-V2] Payload:`, JSON.stringify(kieBody, null, 2));

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
                const msg = submitErr instanceof Error ? submitErr.message : String(submitErr);
                return new Response(JSON.stringify({ error: 'Failed to connect to Kie API', details: msg }), { status: 500, headers: corsHeaders });
            }
        }

        // Poll
        if (action === 'poll' && order.video_task_id && order.video_task_id !== 'SUBMITTING') {
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
                           const { data: emailData, error: emailErr } = await client.functions.invoke('send-email', { body: { orderId } });
                           if (emailErr) console.error('Email trigger rejected:', emailErr);
                           else console.log('Email trigger succeeded:', emailData);
                        } catch(e) { console.error('Email trigger crashed:', e); }

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
