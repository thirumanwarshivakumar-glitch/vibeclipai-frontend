// @ts-nocheck
import { createClient } from 'npm:@insforge/sdk';

const KIE_BASE_URL = 'https://api.kie.ai/api/v1';

export default async function (req: Request): Promise<Response> {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
    if (!KIE_API_KEY) {
        console.error('CRITICAL ERROR: KIE_API_KEY is null or missing in environment variables');
        return new Response(JSON.stringify({ error: 'KIE_API_KEY environment variable is not configured on the server.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const client = createClient({
        baseUrl: Deno.env.get('INSFORGE_BASE_URL')!,
        anonKey: Deno.env.get('ANON_KEY')!,
    });

    let orderId;
    try {
        const body = await req.json();
        orderId = body.orderId;
        const action = body.action || 'submit'; // 'submit' or 'poll'

        if (!orderId) {
            return new Response(JSON.stringify({ error: 'orderId is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Fetch order
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

        // ============ ACTION: SUBMIT — Start video generation ============
        if (action === 'submit') {
            // Idempotency: skip if already submitted or processing (unless forced)
            const { force } = body;
            if (order.video_url && !force) {
                console.log('Video already submitted or processing for order:', orderId);
                return new Response(JSON.stringify({ success: true, message: 'Already processing' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Update status to generating and lock submission
            await client.database
                .from('orders')
                .update({
                    generation_status: 'generating',
                    video_url: 'Submitting...',
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            console.log('Submitting to kie.ai Veo 3.1 Fast for order:', orderId);
            // Use generating image if available, else original reference
            const referenceImageUrl = order.generated_image_url || order.reference_image_url;
            if (referenceImageUrl) {
                console.log('Final reference image detected for video:', referenceImageUrl);
            }

            // Sanitize prompt: remove all quotes to avoid JSON escape slashes (\")
            // so the AI model reads the name correctly, and compress newlines
            let cleanPrompt = (order.constructed_video_prompt || order.constructed_prompt || 'Create a beautiful invitation video with colorful animations')
                .replace(/[\u201C\u201D]/g, '')    // remove curly double quotes
                .replace(/[\u2018\u2019]/g, '')    // remove curly single quotes
                .replace(/["']/g, '')               // remove straight quotes
                .replace(/\n+/g, ' ')               // remove multiple newlines
                .replace(/\s{2,}/g, ' ')            // compress multiple spaces
                .trim();

            const ratioRaw = order.form_values?.aspect_ratio || '9:16';
            const requestedAspectRatio = ratioRaw.split(' ')[0];

            // Build kie.ai request body
            const kieBody: Record<string, unknown> = {
                prompt: cleanPrompt,
                model: 'veo3_fast',
                aspect_ratio: requestedAspectRatio,
                enableFallback: false,
                enableTranslation: false, // MUST be false to preserve names exactly
            };

            // If template has a reference image, use IMAGE_2_VIDEO mode as it works better
            if (referenceImageUrl) {
                kieBody.imageUrls = [referenceImageUrl];
                kieBody.generationType = 'IMAGE_2_VIDEO';
                console.log('Using IMAGE_2_VIDEO mode with imageUrls');
            }

            // Submit video generation to kie.ai using Veo 3.1 Fast
            const generateResponse = await fetch(`${KIE_BASE_URL}/veo/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${KIE_API_KEY}`,
                },
                body: JSON.stringify(kieBody),
            });

            if (!generateResponse.ok) {
                const errText = await generateResponse.text();
                throw new Error(`kie.ai generate failed (${generateResponse.status}): ${errText}`);
            }

            const generateResult = await generateResponse.json();
            console.log('kie.ai response:', JSON.stringify(generateResult));

            const taskId = generateResult.data?.taskId || generateResult.taskId;
            if (!taskId) {
                throw new Error('No taskId returned from kie.ai: ' + JSON.stringify(generateResult));
            }

            // Store taskId in video_url field with prefix
            await client.database
                .from('orders')
                .update({
                    generation_status: 'generating',
                    video_url: `kie:${taskId}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            console.log('kie.ai taskId saved:', taskId);

            return new Response(JSON.stringify({
                success: true,
                taskId,
                status: 'generating',
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ============ ACTION: POLL — Check kie.ai status ============
        if (action === 'poll') {
            const videoUrlField = order.video_url || '';
            if (videoUrlField === 'Submitting...') {
                return new Response(JSON.stringify({ status: 'generating' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (!videoUrlField.startsWith('kie:')) {
                // If the field is NULL or EMPTY, it means it never submitted successfully! Resubmit it locally!
                if (!videoUrlField) {
                    console.log(`Self-healing: order ${orderId} has no video_url. Resubmitting inline!`);
                    
                    await client.database.from('orders').update({ video_url: 'Submitting...', updated_at: new Date().toISOString() }).eq('id', orderId);

                    const referenceImageUrl = order.generated_image_url || order.reference_image_url;
                    let cleanPrompt = (order.constructed_video_prompt || order.constructed_prompt || 'Create a beautiful invitation video')
                        .replace(/[\u201C\u201D]/g, '').replace(/[\u2018\u2019]/g, '').replace(/["']/g, '').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
                    const ratioRaw = order.form_values?.aspect_ratio || '9:16';
                    
                    const kieBody = { prompt: cleanPrompt, model: 'veo3_fast', aspect_ratio: ratioRaw.split(' ')[0], enableFallback: false, enableTranslation: false };
                    if (referenceImageUrl) {
                        kieBody.imageUrls = [referenceImageUrl];
                        kieBody.generationType = 'IMAGE_2_VIDEO';
                    }

                    const generateResponse = await fetch(`${KIE_BASE_URL}/veo/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
                        body: JSON.stringify(kieBody),
                    });

                    if (!generateResponse.ok) {
                        throw new Error(`Self-heal API fail: ${await generateResponse.text()}`);
                    }
                    const generateResult = await generateResponse.json();
                    const newTaskId = generateResult.data?.taskId || generateResult.taskId;

                    if (newTaskId) {
                        await client.database.from('orders').update({ video_url: `kie:${newTaskId}`, updated_at: new Date().toISOString() }).eq('id', orderId);
                        return new Response(JSON.stringify({ status: 'generating' }), { status: 200, headers: corsHeaders });
                    } else {
                        throw new Error('Self-heal failed to get newTaskId');
                    }
                }

                return new Response(JSON.stringify({
                    status: order.generation_status,
                    videoUrl: order.video_url,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const taskId = videoUrlField.replace('kie:', '');
            console.log('Polling kie.ai Veo for taskId:', taskId);

            const statusResponse = await fetch(
                `${KIE_BASE_URL}/veo/record-info?taskId=${taskId}`,
                {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${KIE_API_KEY}` },
                }
            );

            if (!statusResponse.ok) {
                return new Response(JSON.stringify({ status: 'generating' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const statusResult = await statusResponse.json();
            const successFlag = statusResult.data?.successFlag;
            const errorCode = statusResult.data?.errorCode;

            console.log(`kie.ai successFlag: ${successFlag}, errorCode: ${errorCode}`);

            if (successFlag === 1) {
                const resultUrl = statusResult.data?.response?.resultUrls?.[0];

                if (resultUrl) {
                    console.log('Video ready! URL:', resultUrl);

                    // Mark as uploading
                    await client.database
                        .from('orders')
                        .update({ generation_status: 'uploading', updated_at: new Date().toISOString() })
                        .eq('id', orderId);

                    // Download and update to InsForge Storage for longevity
                    try {
                        console.log('Transferring video to InsForge storage...');
                        const videoResp = await fetch(resultUrl);
                        const blob = await videoResp.blob();
                        const { data: uploadData } = await client.storage
                            .from('template-previews')
                            .upload(`generated/${orderId}/video.mp4`, blob);

                        const finalUrl = uploadData?.url || resultUrl;

                        await client.database
                            .from('orders')
                            .update({
                                generation_status: 'completed',
                                video_url: finalUrl,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', orderId);

                        // Send email
                        try {
                            const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
                            if (RESEND_API_KEY) {
                                await fetch('https://api.resend.com/emails', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
                                    body: JSON.stringify({
                                        from: 'VibeClipAI <onboarding@resend.dev>',
                                        to: [order.email],
                                        subject: '🎬 Your AI Invitation Video is Ready!',
                                        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2>Your video is Ready! 🎉</h2><p>Your AI-generated creation has been successfully processed and is ready to download.</p><div style="margin: 30px 0;"><a href="${finalUrl}" style="background: #6c5ce7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">📥 Download Your Generation</a></div></div>`
                                    }),
                                });
                            }
                        } catch (e) {
                            console.error('Failed to send email:', e);
                        }

                        return new Response(JSON.stringify({ status: 'completed', videoUrl: finalUrl }), {
                            status: 200,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        });
                    } catch (transferErr) {
                        console.error('Transfer failed, fallback to direct URL:', transferErr);
                        await client.database
                            .from('orders')
                            .update({
                                generation_status: 'completed',
                                video_url: resultUrl,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', orderId);

                        try {
                            const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
                            if (RESEND_API_KEY) {
                                await fetch('https://api.resend.com/emails', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
                                    body: JSON.stringify({
                                        from: 'VibeClipAI <onboarding@resend.dev>',
                                        to: [order.email],
                                        subject: '🎬 Your AI Invitation Video is Ready!',
                                        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2>Your video is Ready! 🎉</h2><p>Your AI-generated creation has been successfully processed and is ready to download.</p><div style="margin: 30px 0;"><a href="${resultUrl}" style="background: #6c5ce7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">📥 Download Your Generation</a></div></div>`
                                    }),
                                });
                            }
                        } catch (e) {
                            console.error('Failed to send email:', e);
                        }

                        return new Response(JSON.stringify({ status: 'completed', videoUrl: resultUrl }), {
                            status: 200,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        });
                    }
                }
            } else if (errorCode !== null && errorCode !== undefined) {
                const reason = statusResult.data?.errorMessage || 'Unknown Error';
                await client.database
                    .from('orders')
                    .update({
                        generation_status: 'failed',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', orderId);

                return new Response(JSON.stringify({ status: 'failed', error: reason }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ status: 'generating' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Unknown action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        const errMsg = String(err?.message || err);
        console.error('generate-video error:', errMsg);
        if (orderId) {
            try {
                // Log error to video_url if not already completed
                const { data: current } = await client.database.from('orders').select('generation_status').eq('id', orderId).single();
                if (current?.generation_status !== 'completed') {
                    await client.database
                        .from('orders')
                        .update({
                            generation_status: 'failed',
                            video_url: 'ERROR: ' + errMsg.substring(0, 200),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', orderId);
                }
            } catch (_e) { }
        }
        return new Response(JSON.stringify({ error: errMsg }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}
