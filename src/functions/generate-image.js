//@ts-nocheck
import { createClient } from 'npm:@insforge/sdk';

export default async function (req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const client = createClient({
        baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
        anonKey: Deno.env.get('ANON_KEY'),
    });

    const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
    const KIE_BASE_URL = 'https://api.kie.ai';

    let orderId;
    try {
        const body = await req.json();
        orderId = body.orderId;
        const { action } = body;

        if (!orderId || !action) {
            return new Response(JSON.stringify({ error: 'Missing parameters' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Fetch order details
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

        if (action === 'submit') {
            // Idempotency: skip if already submitted or processing (unless forced)
            const { force } = body;
            if (order.image_task_id && !force) {
                console.log('Image already submitted or processing for order:', orderId);
                return new Response(JSON.stringify({ success: true, message: 'Already processing' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Lock submission
            await client.database
                .from('orders')
                .update({
                    image_task_id: 'Submitting...',
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            console.log('Submitting image generation to Kie.ai Nano Banana for order:', orderId);
            const referenceImageUrl = order.reference_image_url;

            if (!referenceImageUrl) {
                return new Response(JSON.stringify({ error: 'No reference image found for image generation' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Sanitize prompt
            let cleanPrompt = (order.constructed_image_prompt || order.constructed_prompt || 'Enhance the image')
                .replace(/[\u201C\u201D]/g, '')
                .replace(/[\u2018\u2019]/g, '')
                .replace(/["']/g, '')
                .replace(/\n+/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim();

            const ratioRaw = order.form_values?.aspect_ratio || '9:16';
            const requestedAspectRatio = ratioRaw.split(' ')[0];

            const payload = {
                model: 'nano-banana-2',
                input: {
                    prompt: cleanPrompt,
                    image_input: [referenceImageUrl],
                    aspect_ratio: requestedAspectRatio,
                    resolution: '1K',
                    output_format: 'jpg',
                    google_search: false
                }
            };

            const submitResponse = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${KIE_API_KEY}`,
                },
                body: JSON.stringify(payload),
            });

            if (!submitResponse.ok) {
                const errText = await submitResponse.text();
                throw new Error(`Kie.ai image generation create failed (${submitResponse.status}): ${errText}`);
            }

            const data = await submitResponse.json();
            const taskId = data?.data?.recordId || data?.data?.taskId || data?.taskId || data?.recordId;

            if (!taskId) {
                throw new Error(`Kie.ai invalid response: ${JSON.stringify(data)}`);
            }

            // Update database with image_task_id
            await client.database
                .from('orders')
                .update({ image_task_id: taskId, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            return new Response(JSON.stringify({ success: true, taskId }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (action === 'poll') {
            const taskId = order.image_task_id;
            if (!taskId) {
                return new Response(JSON.stringify({ error: 'No image task ID found' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const pollResponse = await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${KIE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!pollResponse.ok) {
                const errText = await pollResponse.text();
                throw new Error(`Kie.ai pool failed (${pollResponse.status}): ${errText}`);
            }

            const data = await pollResponse.json();
            const state = data?.data?.state;

            if (state === 'success') {
                const resultJsonStr = data.data.resultJson;
                const resultObj = resultJsonStr ? JSON.parse(resultJsonStr) : null;
                const imageUrl = resultObj?.resultUrls?.[0];

                if (!imageUrl) {
                    throw new Error('Image URL not found in completed task result');
                }

                // Logic check: if image-only, go straight to completed.
                // If video, go to awaiting_image_confirmation for review.
                const isImageOnly = order.template_type === 'image';
                const nextStatus = isImageOnly ? 'completed' : 'awaiting_image_confirmation';

                // Update database
                const updatePayload = {
                    generated_image_url: imageUrl,
                    generation_status: nextStatus,
                    updated_at: new Date().toISOString()
                };
                
                // If image template, also set video_url to the result image for easy downloading
                if (isImageOnly) {
                    updatePayload.video_url = imageUrl;
                }

                await client.database
                    .from('orders')
                    .update(updatePayload)
                    .eq('id', orderId);

                // If image only, trigger email immediately
                if (isImageOnly) {
                    try {
                        await client.functions.invoke('send-email', {
                            body: { 
                                to: order.email, 
                                videoUrl: imageUrl, 
                                orderId, 
                                type: 'image' 
                            },
                        });
                    } catch (e) {
                        console.error('Failed to trigger send-email from generate-image:', e);
                    }
                }

                return new Response(JSON.stringify({ status: 'completed', imageUrl }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } else if (state === 'fail' || state === 'failed') {
                await client.database
                    .from('orders')
                    .update({
                        generation_status: 'failed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', orderId);

                return new Response(JSON.stringify({ status: 'failed', error: data.data.failMsg || 'Unknown error' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } else {
                return new Response(JSON.stringify({ status: 'generating' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('generate-image error:', error);
        if (orderId) {
            try {
                await client.database
                    .from('orders')
                    .update({
                        video_url: 'ERROR: ' + String(error.message),
                        generation_status: 'failed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', orderId);
            } catch (e) {}
        }
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}
