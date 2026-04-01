import { insforge } from './insforge';

export default insforge;

/**
 * Fetch all available templates for categories
 */
export async function fetchTemplates(options = {}) {
    let query = insforge.database
        .from('templates')
        .select('*')
        .eq('status', 'active');

    if (options.isFavorite) {
        query = query.eq('is_favorite', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Admin: Fetch all templates (drafts too)
 */
export async function fetchAllTemplatesAdmin() {
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
    const { data, error } = await insforge.database
        .from('templates')
        .insert([{
            name: templateData.name,
            description: templateData.description,
            tags: templateData.tags || [],
            price: templateData.price || 199,
            image_prompt_skeleton: templateData.imagePromptSkeleton,
            video_prompt_skeleton: templateData.videoPromptSkeleton,
            input_schema: templateData.inputSchema || [],
            status: templateData.status || 'draft',
            reference_image_url: templateData.referenceImageUrl || '',
            template_type: templateData.templateType || 'video'
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
    // Map camelCase to snake_case if necessary, otherwise pass through
    const updatePayload = { ...templateData, updated_at: new Date().toISOString() };
    
    // Explicitly handle known camelCase fields for safety/consistency if needed,
    // but the object spread handles already-correctly-named fields.
    if (templateData.imagePromptSkeleton !== undefined) updatePayload.image_prompt_skeleton = templateData.imagePromptSkeleton;
    if (templateData.videoPromptSkeleton !== undefined) updatePayload.video_prompt_skeleton = templateData.videoPromptSkeleton;
    if (templateData.inputSchema !== undefined) updatePayload.input_schema = templateData.inputSchema;
    if (templateData.referenceImageUrl !== undefined) updatePayload.reference_image_url = templateData.referenceImageUrl;
    if (templateData.templateType !== undefined) updatePayload.template_type = templateData.templateType;

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
 * Admin: Upload a sample preview media (video/image) for a template
 */
export async function uploadPreviewVideo(templateId, file) {
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
 * Admin: Fetch all orders
 */
export async function fetchAllOrdersAdmin() {
    const { data, error } = await insforge.database
        .from('orders')
        .select(`
            id, readable_id, email, amount, payment_method, payment_status, generation_status, video_url, created_at, reference_image_url, generated_image_url, template_type,
            templates ( name )
        `)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Fetch orders for a specific logged-in user
 */
export async function fetchUserOrders(email) {
    if (!email) return [];
    
    const { data, error } = await insforge.database
        .from('orders')
        .select(`
            id, readable_id, email, amount, payment_method, payment_status, generation_status, video_url, created_at, reference_image_url, generated_image_url, template_type,
            templates ( name )
        `)
        .eq('email', email)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
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
export async function createRazorpayOrder(orderId, amount, currency) {
    const { data, error } = await insforge.functions.invoke('create-razorpay-order', {
        body: { orderId, amount, currency }
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
