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

    try {
        // ========== POST: Create a new order ==========
        if (req.method === 'POST') {
            const body = await req.json();
            const { templateId, email, formValues, paymentMethod, userId, userImageUrl } = body;

            if (!templateId || !email || !formValues) {
                return new Response(JSON.stringify({ error: 'Missing required fields: templateId, email, formValues' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // 1. Fetch the template
            const { data: template, error: templateErr } = await client.database
                .from('templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (templateErr || !template) {
                return new Response(JSON.stringify({ error: 'Template not found' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // 2. Build the prompts from skeletons + form values
            let constructedVideoPrompt = template.video_prompt_skeleton || '';
            let constructedImagePrompt = template.image_prompt_skeleton || '';

            for (const [key, value] of Object.entries(formValues)) {
                constructedVideoPrompt = constructedVideoPrompt.replace(new RegExp(`\\{${key}\\}`, 'gi'), value);
                constructedImagePrompt = constructedImagePrompt.replace(new RegExp(`\\{${key}\\}`, 'gi'), value);
            }

            // 3. Create the order
            const orderInsert = {
                template_id: templateId,
                email,
                user_id: userId || null,
                form_values: formValues,
                amount: template.price,
                payment_method: paymentMethod || 'stripe',
                payment_status: 'pending',
                generation_status: 'pending',
                constructed_video_prompt: constructedVideoPrompt,
                constructed_image_prompt: constructedImagePrompt,
                constructed_prompt: constructedVideoPrompt, // Keep legacy for backward compatibility
                template_type: template.template_type || 'video', // Store template type on order
            };

            // Reference image: either from user upload or template default
            if (userImageUrl) {
                orderInsert.reference_image_url = userImageUrl;
            } else if (template.reference_image_url) {
                orderInsert.reference_image_url = template.reference_image_url;
            }

            const { data: order, error: orderErr } = await client.database
                .from('orders')
                .insert(orderInsert)
                .select()
                .single();

            if (orderErr) {
                return new Response(JSON.stringify({ error: 'Failed to create order', details: orderErr.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({
                success: true,
                order: {
                    id: order.id,
                    amount: order.amount,
                    payment_status: order.payment_status,
                    generation_status: order.generation_status,
                },
            }), {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ========== GET: Poll order status ==========
        if (req.method === 'GET') {
            const url = new URL(req.url);
            const orderId = url.searchParams.get('orderId');

            if (!orderId) {
                return new Response(JSON.stringify({ error: 'orderId query param required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const { data: order, error } = await client.database
                .from('orders')
                .select('id, email, amount, payment_status, generation_status, video_url, created_at, template_type, reference_image_url, generated_image_url')
                .eq('id', orderId)
                .single();

            if (error || !order) {
                return new Response(JSON.stringify({ error: 'Order not found' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ order }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ========== PUT: Simulate payment confirmation + trigger generation ==========
        if (req.method === 'PUT') {
            const body = await req.json();
            const { orderId, action } = body;

            if (!orderId) {
                return new Response(JSON.stringify({ error: 'orderId required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Action: confirm-payment → sets payment to paid, triggers generation
            if (action === 'confirm-payment') {
                // Check if this order has a reference image or is an image-only template
                const { data: order } = await client.database
                    .from('orders')
                    .select('reference_image_url, template_type')
                    .eq('id', orderId)
                    .single();
                
                const hasRefImage = !!order?.reference_image_url;
                const isImageOnly = order?.template_type === 'image';

                // Initial status: if has ref image, always go to generating_image first.
                // If it's an image-only template BUT no ref image, go straight to generating_image (it will just generate from prompt).
                const startStatus = (hasRefImage || isImageOnly) ? 'generating_image' : 'generating';

                // Mark payment as paid
                const { data: updateData, error: updateErr } = await client.database
                    .from('orders')
                    .update({ payment_status: 'paid', generation_status: startStatus, updated_at: new Date().toISOString() })
                    .eq('id', orderId)
                    .select();

                if (updateErr) {
                    console.error('Update payment error:', updateErr);
                }

                // Trigger REAL video/image generation via edge functions
                try {
                    if (hasRefImage || isImageOnly) {
                        console.log('Triggering Image generation submission...');
                        await client.functions.invoke('generate-image', {
                            body: { orderId, action: 'submit' },
                        });
                    } else {
                        console.log('Triggering Video generation submission...');
                        await client.functions.invoke('generate-video', {
                            body: { orderId, action: 'submit' },
                        });
                    }
                } catch (e) {
                    console.error('Failed to trigger generation submission:', e);
                }

                return new Response(JSON.stringify({
                    success: true,
                    message: 'Payment confirmed. Generation started.',
                    status: startStatus,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Action: confirm-image → user approves generated image, moving to video generation
            if (action === 'confirm-image') {
                const { confirmDecision } = body; // 'approve', 'regenerate'

                const { data: order } = await client.database.from('orders').select('template_type, generated_image_url').eq('id', orderId).single();
                const isImageOnly = order?.template_type === 'image';

                if (confirmDecision === 'approve') {
                    // For image-only, 'approve' means we are finished!
                    const finalStatus = isImageOnly ? 'completed' : 'generating';
                    
                    await client.database
                        .from('orders')
                        .update({ 
                            generation_status: finalStatus, 
                            updated_at: new Date().toISOString(),
                            video_url: isImageOnly ? order?.generated_image_url : null // For image templates, video_url stores the result image
                        })
                        .eq('id', orderId);

                    if (!isImageOnly) {
                        try {
                            await client.functions.invoke('generate-video', {
                                body: { orderId, action: 'submit' },
                            });
                        } catch (e) {
                            console.error('Failed to trigger generate-video:', e);
                        }
                    }

                    return new Response(JSON.stringify({ success: true, status: finalStatus }), {
                        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                } else if (confirmDecision === 'regenerate') {
                    await client.database
                        .from('orders')
                        .update({
                            generation_status: 'generating_image',
                            generated_image_url: null,
                            image_task_id: null,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', orderId);

                    try {
                        await client.functions.invoke('generate-image', {
                            body: { orderId, action: 'submit', force: true },
                        });
                    } catch (e) {
                        console.error('Failed to trigger generate-image:', e);
                    }

                    return new Response(JSON.stringify({ success: true, status: 'generating_image' }), {
                        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }
            }

            return new Response(JSON.stringify({ error: 'Unknown action' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}
