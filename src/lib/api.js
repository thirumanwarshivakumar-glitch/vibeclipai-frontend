import { insforge } from './insforge';

export default insforge;

// In-memory cache for instant 0ms responses on tab switching
let templatesCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Fetch all active templates for gallery view with high-performance caching & lightweight payload
 */
export async function fetchTemplates(options = {}) {
    const now = Date.now();
    
    // Serve from in-memory master cache instantly if fresh
    if (templatesCache && (now - lastFetchTime < CACHE_TTL_MS) && !options.forceRefresh) {
        return options.isFavorite ? templatesCache.filter(t => t.is_favorite) : templatesCache;
    }

    try {
        // Master query: always fetch all active templates so cache is never partially polluted
        const query = insforge.database
            .from('templates')
            .select('id, name, description, category, price, template_type, preview_video_url, preview_image, reference_image_url, default_aspect_ratio, is_favorite, created_at, tags, status')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        // 3.5-second timeout safeguard to prevent hanging loading screens
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout')), 3500)
        );

        const { data, error } = await Promise.race([query, timeoutPromise]);

        if (error) throw new Error(error.message);

        if (data && data.length > 0) {
            templatesCache = data;
            lastFetchTime = Date.now();
            try {
                sessionStorage.setItem('vibeclips_templates_v6', JSON.stringify(data));
            } catch (e) {}
            return options.isFavorite ? data.filter(t => t.is_favorite) : data;
        }
    } catch (err) {
        console.warn('fetchTemplates network/timeout warning:', err.message);
        // Fallback to sessionStorage cache if network fails or times out
        try {
            const stored = sessionStorage.getItem('vibeclips_templates_v6');
            if (stored) {
                const parsed = JSON.parse(stored);
                templatesCache = parsed;
                return options.isFavorite ? parsed.filter(t => t.is_favorite) : parsed;
            }
        } catch (e) {}
        
        // If cache is present, return filtered result even if expired
        if (templatesCache) {
            return options.isFavorite ? templatesCache.filter(t => t.is_favorite) : templatesCache;
        }
        throw err;
    }

    return [];
}

/**
 * Admin: Fetch all templates (drafts too)
 */
export async function fetchAllTemplatesAdmin() {
    await insforge.auth.getCurrentSession();
    const { data, error } = await insforge.database
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Fetch a single template's details
 */
export async function fetchTemplateById(id) {
    const { data, error } = await insforge.database
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Update template status (e.g., active/disabled)
 */
export async function toggleTemplateStatus(id, newStatus) {
    await insforge.auth.getCurrentSession();
    const { data, error } = await insforge.database
        .from('templates')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Create a new template record
 */
export async function createTemplate(templateData) {
    await insforge.auth.getCurrentSession(); // Ensure session is fresh before saving
    const { data, error } = await insforge.database
        .from('templates')
        .insert([{
            name: templateData.name,
            description: templateData.description,
            tags: templateData.tags || [],
            price: templateData.price || 199,
            image_prompt_skeleton: templateData.imagePromptSkeleton || templateData.image_prompt_skeleton,
            video_prompt_skeleton: templateData.videoPromptSkeleton || templateData.video_prompt_skeleton,
            input_schema: templateData.inputSchema || templateData.input_schema || [],
            status: templateData.status || 'draft',
            reference_image_url: templateData.referenceImageUrl || templateData.reference_image_url || '',
            template_type: templateData.templateType || templateData.template_type || 'video',
            // New fields
            ai_model: templateData.ai_model || 'midjourney',
            generation_mode: templateData.generation_mode || 'text-to-video',
            default_aspect_ratio: templateData.default_aspect_ratio || '16:9',
            reference_images: templateData.reference_images || '[]',
            max_user_uploads: templateData.max_user_uploads || 1,
            music_prompt: templateData.music_prompt || '',
            negative_prompt: templateData.negative_prompt || '',
            quality: templateData.quality || 'high',
            video_duration: templateData.video_duration || '5',
            video_fps: templateData.video_fps || '24',
            seed: templateData.seed || '',
            currency: templateData.currency || 'INR',
            allow_user_image_upload: templateData.allow_user_image_upload !== undefined ? templateData.allow_user_image_upload : false,
            allow_user_video_upload: templateData.allow_user_video_upload !== undefined ? templateData.allow_user_video_upload : false,
            reference_video_url: templateData.reference_video_url || '',
            caption_skeleton: templateData.caption_skeleton || templateData.captionSkeleton || '',
            category: templateData.category || 'General',
            preview_video_url: templateData.preview_video_url || templateData.previewVideoUrl || '',
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Update an existing template record (supports partial updates)
 */
export async function updateTemplate(id, templateData) {
    await insforge.auth.getCurrentSession();
    // Map camelCase to snake_case if necessary, otherwise pass through
    const updatePayload = { ...templateData, updated_at: new Date().toISOString() };
    
    // Explicitly handle known camelCase fields for safety/consistency if needed
    if (templateData.imagePromptSkeleton !== undefined) updatePayload.image_prompt_skeleton = templateData.imagePromptSkeleton;
    if (templateData.videoPromptSkeleton !== undefined) updatePayload.video_prompt_skeleton = templateData.videoPromptSkeleton;
    if (templateData.captionSkeleton !== undefined) updatePayload.caption_skeleton = templateData.captionSkeleton;
    if (templateData.inputSchema !== undefined) updatePayload.input_schema = templateData.inputSchema;
    if (templateData.referenceImageUrl !== undefined) updatePayload.reference_image_url = templateData.referenceImageUrl;
    if (templateData.previewVideoUrl !== undefined) updatePayload.preview_video_url = templateData.previewVideoUrl;
    if (templateData.templateType !== undefined) updatePayload.template_type = templateData.templateType;

    // New fields (already snake_case from TemplateEditor, but ensure they pass through)
    if (templateData.ai_model !== undefined) updatePayload.ai_model = templateData.ai_model;
    if (templateData.generation_mode !== undefined) updatePayload.generation_mode = templateData.generation_mode;
    if (templateData.default_aspect_ratio !== undefined) updatePayload.default_aspect_ratio = templateData.default_aspect_ratio;
    if (templateData.reference_images !== undefined) updatePayload.reference_images = templateData.reference_images;
    if (templateData.max_user_uploads !== undefined) updatePayload.max_user_uploads = templateData.max_user_uploads;
    if (templateData.music_prompt !== undefined) updatePayload.music_prompt = templateData.music_prompt;
    if (templateData.negative_prompt !== undefined) updatePayload.negative_prompt = templateData.negative_prompt;
    if (templateData.quality !== undefined) updatePayload.quality = templateData.quality;
    if (templateData.video_duration !== undefined) updatePayload.video_duration = templateData.video_duration;
    if (templateData.video_fps !== undefined) updatePayload.video_fps = templateData.video_fps;
    if (templateData.seed !== undefined) updatePayload.seed = templateData.seed;
    if (templateData.currency !== undefined) updatePayload.currency = templateData.currency;
    // Map and prioritize UI state over database spread
    if (templateData.is_favorite !== undefined) updatePayload.is_favorite = templateData.is_favorite;
    if (templateData.is_favorite_status !== undefined) updatePayload.is_favorite = templateData.is_favorite_status;
    if (templateData.isFavorite !== undefined) updatePayload.is_favorite = templateData.isFavorite;

    // Clean up all non-schema keys so PostgREST never errors
    delete updatePayload.imagePromptSkeleton;
    delete updatePayload.videoPromptSkeleton;
    delete updatePayload.captionSkeleton;
    delete updatePayload.inputSchema;
    delete updatePayload.referenceImageUrl;
    delete updatePayload.previewVideoUrl;
    delete updatePayload.templateType;
    delete updatePayload.allowUserImageUpload;
    delete updatePayload.allowUserVideoUpload;
    delete updatePayload.allowUserAudioUpload;
    delete updatePayload.allow_user_audio_upload;
    delete updatePayload.referenceAudioUrl;
    delete updatePayload.reference_audio_url;
    delete updatePayload.generateAudio;
    delete updatePayload.generate_audio;
    delete updatePayload.seedance_slots;
    delete updatePayload.seedanceSlots;
    delete updatePayload.referenceVideoUrl;
    delete updatePayload.isFavorite;
    delete updatePayload.referenceImages;
    delete updatePayload.id;

    const { data, error } = await insforge.database
        .from('templates')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Delete a template record
 */
export async function deleteTemplate(id) {
    await insforge.auth.getCurrentSession();
    const { data, error } = await insforge.database
        .from('templates')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Admin: Upload a sample preview media (video/image) for a template
 */
export async function uploadPreviewVideo(templateId, file) {
    await insforge.auth.getCurrentSession();
    const ext = file.name.split('.').pop();
    const path = `template-previews/${templateId}/preview.${ext}`;

    const { data, error } = await insforge.storage
        .from('template-previews')
        .upload(path, file, { upsert: true });

    if (error) throw new Error(error.message || 'Failed to upload preview media');

    // Update the template record with the URL and key
    return await updateTemplate(templateId, {
        preview_video_url: data.url,
        preview_video_key: data.key,
    });
}

/**
 * Admin: Remove the preview media from a template
 */
export async function removePreviewVideo(templateId, key) {
    if (key) {
        await insforge.storage
            .from('template-previews')
            .remove(key);
    }

    return await updateTemplate(templateId, {
        preview_video_url: null,
        preview_video_key: null,
    });
}

/**
 * Poll for order and generation status
 */
export async function getOrderStatus(id) {
    const { data, error } = await insforge.database
        .from('orders')
        .select(`
            id, readable_id, payment_status, generation_status, video_url, generated_image_url, template_type, email
        `)
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Admin: Fetch all orders with full detail (supports admin orders management page)
 */
export async function fetchAllOrdersAdmin() {
    await insforge.auth.getCurrentSession();
    const { data, error } = await insforge.database
        .from('orders')
        .select(`
            id, readable_id, email, user_id, amount, payment_method, payment_status,
            generation_status, video_url, created_at, updated_at,
            stripe_session_id, reference_image_url, generated_image_url,
            template_type, form_values, constructed_prompt,
            constructed_image_prompt, constructed_video_prompt,
            image_task_id, video_task_id, user_video_url,
            failure_reason, failure_stage, refund_status, refund_amount,
            refund_initiated_at, email_status, email_sent_at, admin_notes,
            razorpay_payment_id, razorpay_order_id,
            templates ( id, name, preview_video_url, template_type )
        `)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Fetch orders for a specific logged-in user (customer-facing My Orders page)
 */
export async function fetchUserOrders(email) {
    if (!email) return [];
    
    await insforge.auth.getCurrentSession();
    const { data, error } = await insforge.database
        .from('orders')
        .select(`
            id, readable_id, email, amount, payment_method, payment_status,
            generation_status, video_url, created_at, updated_at,
            reference_image_url, generated_image_url, template_type,
            failure_reason, failure_stage, refund_status, email_status, email_sent_at,
            templates ( id, name, preview_video_url, template_type )
        `)
        .eq('email', email)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Admin: Save internal notes on an order (never shown to customer)
 */
export async function updateOrderAdminNotes(orderId, notes) {
    await insforge.auth.getCurrentSession();
    const { data, error } = await insforge.database
        .from('orders')
        .update({ admin_notes: notes, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select('id, admin_notes, updated_at')
        .single();
    if (error) throw new Error(error.message);
    return data;
}

/**
 * Admin: Update generation status (e.g. mark as resolved)
 */
export async function updateOrderGenerationStatus(orderId, status) {
    await insforge.auth.getCurrentSession();
    const { data, error } = await insforge.database
        .from('orders')
        .update({ generation_status: status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select('id, generation_status, updated_at')
        .single();
    if (error) throw new Error(error.message);
    return data;
}

/**
 * Convert a File object to a Base64 string for secure edge function upload
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/**
 * Upload a user-provided reference image to storage before order creation.
 * Returns the public URL.
 */
export async function uploadUserImage(file, tempId) {
    const ext = file.name.split('.').pop();
    const path = `user-uploads/${tempId}/reference.${ext}`;

    const { data, error } = await insforge.storage
        .from('template-previews')
        .upload(path, file, { upsert: true });

    if (error) throw new Error('Image upload failed: ' + error.message);
    return data.url;
}

/**
 * Upload a user's motion reference video to InsForge storage
 */
export async function uploadUserVideo(file, tempId) {
    const ext = file.name.split('.').pop();
    const path = `user-uploads/${tempId}/motion-video.${ext}`;

    const { data, error } = await insforge.storage
        .from('template-previews')
        .upload(path, file, { upsert: true });

    if (error) throw new Error('Video upload failed: ' + error.message);
    return data.url;
}

/**
 * Create a new order via process-order edge function
 */
export async function createOrder(orderData) {
    const { data, error } = await insforge.functions.invoke('process-order', {
        body: orderData
    });
    if (error) throw new Error(error.message || 'Failed to create order');
    return data;
}

/**
 * Confirm payment and start generation via process-order edge function
 */
export async function confirmPayment(orderId) {
    const { data, error } = await insforge.functions.invoke('process-order', {
        method: 'PUT',
        body: { orderId, action: 'confirm-payment' }
    });
    if (error) throw new Error(error.message || 'Failed to confirm payment');
    return data;
}

/**
 * User approves or requests regeneration of an image via process-order edge function
 */
export async function confirmImage(orderId, confirmDecision) {
    const { data, error } = await insforge.functions.invoke('process-order', {
        method: 'PUT',
        body: { orderId, action: 'confirm-image', confirmDecision }
    });
    if (error) throw new Error(error.message || 'Failed to confirm image');
    return data;
}

/**
 * Create a Stripe checkout session
 */
export async function createStripeCheckout(orderId) {
    const { data, error } = await insforge.functions.invoke('create-checkout', {
        body: { orderId }
    });
    if (error) throw new Error(error.message || 'Failed to create Stripe checkout');
    return data;
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(orderId, amount, currency, mode) {
    const { data, error } = await insforge.functions.invoke('create-razorpay-order', {
        body: { orderId, amount, currency, mode }
    });
    if (error) throw new Error(error.message || 'Failed to create Razorpay order');
    return data;
}

/**
 * Verify Razorpay payment
 */
export async function verifyRazorpayPayment(payload) {
    const { data, error } = await insforge.functions.invoke('verify-razorpay-payment', {
        body: payload
    });
    if (error) throw new Error(error.message || 'Failed to verify Razorpay payment');
    return data;
}

/**
 * Trigger backend order polling for generation progression
 */
export async function pollGenerationStatus(orderId, type) {
    console.log(`[API] Polling order ${orderId} for ${type}...`);
    
    // Fetch the order and template to determine the correct edge function
    const { data: order, error: orderErr } = await insforge.database
        .from('orders')
        .select('*, templates(*)')
        .eq('id', orderId)
        .single();
        
    if (orderErr) throw new Error(orderErr.message || 'Failed to fetch order for polling');
    
    let template = order?.templates;
    if (Array.isArray(template)) template = template[0];
    if ((!template || !template.ai_model) && order?.template_id) {
        const { data: t } = await insforge.database.from('templates').select('*').eq('id', order.template_id).single();
        if (t) template = t;
    }
    const aiModel = (template?.ai_model || template?.aiModel || '').toLowerCase();
    
    let targetFunc = 'generate-video';
    if (type === 'generating_image') {
        if (aiModel === 'nano_banana_pro_v2') targetFunc = 'generate-image-nano-v2';
        else targetFunc = 'generate-image';
    } else {
        if (aiModel === 'veo_3_1_v2') targetFunc = 'generate-video-veo-v2';
        else if (aiModel.includes('kling')) targetFunc = 'generate-video-kling-v2';
        else if (aiModel.includes('seedance')) targetFunc = 'generate-video-seedance-v2';
    }
    
    console.log(`[API] Routing poll to ${targetFunc}...`);
    const { data, error } = await insforge.functions.invoke(targetFunc, {
        body: { orderId, action: 'poll' }
    });
    
    console.log(`[API] ${targetFunc} response:`, { data, error });
    if (error) throw new Error(error.message || `Failed to poll ${targetFunc}`);
    return data;
}

export async function pollImageGenerationStatus(orderId) {
    return pollGenerationStatus(orderId, 'generating_image');
}

export async function pollVideoGenerationStatus(orderId) {
    return pollGenerationStatus(orderId, 'generating');
}
/**
 * Fetch a specific site configuration value by key
 */
export async function getSiteConfig(key) {
    const { data, error } = await insforge.database
        .from('site_config')
        .select('value')
        .eq('key', key)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data?.value || null;
}

/**
 * Update (upsert) a site configuration value
 */
export async function setSiteConfig(key, value) {
    const { data, error } = await insforge.database
        .from('site_config')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Admin: Upload a hero preview video for the home page
 */
export async function uploadHeroVideo(file) {
    await insforge.auth.getCurrentSession();
    const ext = file.name.split('.').pop();
    const path = `site-assets/hero-preview.${ext}`;

    const { data, error } = await insforge.storage
        .from('template-previews')
        .upload(path, file, { upsert: true });

    if (error) throw new Error(error.message || 'Failed to upload hero video');

    // Update the site_config records
    await setSiteConfig('hero_video_url', data.url);
    await setSiteConfig('hero_video_key', data.key);

    return { url: data.url, key: data.key };
}

/**
 * Admin: Remove the hero preview video
 */
export async function removeHeroVideo() {
    const keyStr = await getSiteConfig('hero_video_key');
    if (keyStr) {
        await insforge.storage
            .from('template-previews')
            .remove(keyStr);
    }

    await setSiteConfig('hero_video_url', null);
    await setSiteConfig('hero_video_key', null);

    return true;
}

/**
 * Trigger manual email resend via edge function
 */
export async function resendEmail(orderId, email, videoUrl) {
    const { data, error } = await insforge.functions.invoke('send-email', {
        body: { to: email, videoUrl, orderId },
    });

    if (error) throw new Error(error.message || 'Failed to resend email');
    return data;
}

/**
 * Fetch a user's profile by ID
 */
export async function getUserProfile(userId) {
    if (!userId) return null;
    const { data, error } = await insforge.database
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Trigger welcome email and update profile status
 */
export async function sendWelcomeEmail(email, userId) {
    if (!email || !userId) return;

    // 1. Invoke edge function to send welcome email
    const { data, error } = await insforge.functions.invoke('send-email', {
        body: { to: email, type: 'welcome' }
    });

    if (error) throw new Error(error.message || 'Failed to send welcome email');

    // 2. Mark as sent in profiles table
    await insforge.database
        .from('profiles')
        .update({ 
            welcome_email_sent: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    return data;
}
