import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { getOrderStatus, confirmPayment, confirmImage, resendEmail } from '../lib/api';
import { generateCaption } from '../lib/captionEngine';
import { useNativeShare } from '../hooks/useNativeShare';

const defaultSteps = [
    { key: 'paid', label: 'Payment Confirmed', icon: '✓' },
    { key: 'generating', label: 'Generating Video', icon: '⚡' },
    { key: 'uploading', label: 'Uploading', icon: '☁️' },
    { key: 'completed', label: 'Email Sent', icon: '📧' },
];

const imageSteps = [
    { key: 'paid', label: 'Payment Confirmed', icon: '✓' },
    { key: 'generating_image', label: 'Generating Preview Image', icon: '🖼️' },
    { key: 'awaiting_image_confirmation', label: 'Review Image', icon: '👀' },
    { key: 'generating', label: 'Generating Video', icon: '⚡' },
    { key: 'uploading', label: 'Uploading', icon: '☁️' },
    { key: 'completed', label: 'Email Sent', icon: '📧' },
];

// Steps for image-only templates (no video or separate review step unless explicitly required)
const imageOnlySteps = [
    { key: 'paid', label: 'Payment Confirmed', icon: '✓' },
    { key: 'generating_image', label: 'Generating Your Image', icon: '🖼️' },
    { key: 'completed', label: 'Image Ready & Email Sent', icon: '📧' },
];

const statusToStepDefault = {
    pending: -1,
    paid: 0,
    generating_image: 1,           // Fallback if it goes here for video
    awaiting_image_confirmation: 1, // Fallback
    generating: 1,
    uploading: 2,
    completed: 3,
    failed: -1,
};

const statusToStepImage = {
    pending: -1,
    paid: 0,
    generating_image: 1,
    awaiting_image_confirmation: 2,
    generating: 3,
    uploading: 4,
    completed: 5,
    failed: -1,
};

const statusToStepImageOnly = {
    pending: -1,
    paid: 0,
    generating_image: 1,
    awaiting_image_confirmation: 1, // Treat review as part of generation for image-only if it happens
    completed: 2,
    failed: -1,
};

export default function SuccessPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Support both: navigation state (from simulated flow) AND URL params (from Stripe redirect)
    const stateOrderId = location.state?.orderId;
    const urlOrderId = searchParams.get('orderId');
    const orderId = stateOrderId || urlOrderId;

    const stateEmail = location.state?.email;
    const stateTemplate = location.state?.template;

    const [currentStep, setCurrentStep] = useState(0);
    const [orderData, setOrderData] = useState(null);
    const [pollError, setPollError] = useState(null);
    const [genFailed, setGenFailed] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // Caption & Sharing State
    // Caption & Sharing State
    const [captionCopied, setCaptionCopied] = useState(false);
    const { share: nativeShare, isSupported: canNativeShare, isSharing } = useNativeShare();

    const pollingRef = useRef(null);
    const confirmedRef = useRef(false);

    const activeCaption = generateCaption(orderData?.templates || stateTemplate, orderData?.form_values || {});

    const handleCopyCaption = async () => {
        try {
            await navigator.clipboard.writeText(activeCaption);
            setCaptionCopied(true);
            setTimeout(() => setCaptionCopied(false), 2500);
        } catch (err) {
            console.error('Failed to copy caption:', err);
        }
    };

    const handleNativeShare = async () => {
        const targetMediaUrl = isImageOnlyTemplate ? (orderData?.video_url || orderData?.generated_image_url) : orderData?.video_url;
        await nativeShare({
            imageUrl: targetMediaUrl,
            title: orderData?.templates?.name || stateTemplate?.name || 'VibeClipAI Artwork',
            text: activeCaption,
        });
    };

    // Determine current steps mapping dynamically
    // Use both state and polled data for type check, checking both case conventions
    const rawType = (
        orderData?.template_type || 
        orderData?.templateType || 
        stateTemplate?.template_type || 
        stateTemplate?.templateType || 
        ''
    ).trim().toLowerCase();
    
    // Check if it's a direct video model (Seedance or Kling)
    const aiModelName = (
        stateTemplate?.ai_model || 
        orderData?.ai_model || 
        orderData?.templates?.ai_model || 
        stateTemplate?.name || 
        orderData?.template_name || 
        ''
    ).toLowerCase();

    const isDirectVideoModel = aiModelName.includes('seedance') || aiModelName.includes('kling');

    // Safety check: some parts of the app might use tags to identify it as an image
    const hasImageTag = stateTemplate?.tags?.some(t => String(t).toLowerCase().includes('image'));

    const isImageOnlyTemplate = rawType === 'image' || rawType === 'photo' || hasImageTag;
    
    // hasTwoStepReview is ONLY for Veo two-step templates that explicitly use Nano Banana image preview
    const hasTwoStepReview = !isDirectVideoModel && !isImageOnlyTemplate && !!(orderData?.reference_image_url || stateTemplate?.reference_image_url || orderData?.user_image_url);
    
    // If it's an image template, always use imageOnlySteps.
    // If it's a Veo two-step video template, use imageSteps.
    // For direct video models (Seedance 2.5, Seedance 2.0 Fast, Kling) and standard video templates, use defaultSteps.
    const activeSteps = isImageOnlyTemplate ? imageOnlySteps : (hasTwoStepReview ? imageSteps : defaultSteps);

    // Use a memoized map to avoid effect restarts
    const activeStatusMap = isImageOnlyTemplate ? statusToStepImageOnly : (hasTwoStepReview ? statusToStepImage : statusToStepDefault);

    useEffect(() => {
        if (!orderId) {
            // No orderId = demo/simulation mode
            const timers = [];
            timers.push(setTimeout(() => setCurrentStep(0), 500));
            timers.push(setTimeout(() => setCurrentStep(1), 2000));
            timers.push(setTimeout(() => setCurrentStep(2), 5000));
            timers.push(setTimeout(() => setCurrentStep(3), 8000));
            return () => timers.forEach(clearTimeout);
        }

        // Real polling from database
        const poll = async () => {
            try {
                const result = await getOrderStatus(orderId);
                if (!result) return;

                // Support both direct DB fetch and Edge Function response formats
                const order = result.order || result;
                setOrderData(order);
                const genStatus = order.generation_status || 'pending';
                const payStatus = order.payment_status || 'pending';

                // FALLBACK: If order is still pending after arriving from Stripe,
                // call confirmPayment to mark it paid + trigger generation.
                if (payStatus === 'pending' && genStatus === 'pending' && !confirmedRef.current) {
                    confirmedRef.current = true;
                    console.log('Order still pending — triggering fallback payment confirmation...');
                    try {
                        await confirmPayment(orderId);
                    } catch (confirmErr) {
                        console.error('Fallback confirm failed:', confirmErr);
                    }
                    return; // Wait for next poll to get updated status
                }

                // Trigger Edge Function polling to update database if it's currently generating
                if (genStatus === 'generating_image' || genStatus === 'generating') {
                    try {
                        import('../lib/api').then(api => {
                            api.pollGenerationStatus(orderId, genStatus).catch(err => {
                                console.error('Silent backend poll error:', err);
                            });
                        });
                    } catch (e) {
                         console.error('Failed to dispatch background poll', e);
                    }
                }

                // Map statuses to timeline steps
                if (payStatus === 'paid') {
                    if (genStatus === 'pending') {
                        setCurrentStep(0); // Payment done, waiting for generation to start
                    } else {
                        const step = activeStatusMap[genStatus];
                        if (step !== undefined && step >= 0) {
                            setCurrentStep(step);
                        }
                    }
                }

                // Stop polling when done or failed
                if (genStatus === 'completed') {
                    setCurrentStep(activeStatusMap['completed']);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                }
                if (genStatus === 'failed') {
                    setGenFailed(true);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                }
            } catch (err) {
                console.error('Poll error:', err);
                setPollError(err.message);
            }
        };

        const initialTimeout = setTimeout(poll, 1000);
        pollingRef.current = setInterval(poll, 6000);

        return () => {
            clearTimeout(initialTimeout);
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [orderId, activeStatusMap]); // Add activeStatusMap to deps to handle type change during poll

    const handleConfirmImage = async (decision) => {
        setConfirming(true);
        try {
            await confirmImage(orderId, decision);
            // Instantly transition UI locally before next poll
            if (decision === 'approve') {
                const nextStatus = isImageOnlyTemplate ? 'completed' : 'generating';
                setCurrentStep(activeStatusMap[nextStatus]);
                setOrderData(prev => ({ ...prev, generation_status: nextStatus }));
            } else {
                setCurrentStep(activeStatusMap['generating_image']);
                setOrderData(prev => ({ ...prev, generation_status: 'generating_image', generated_image_url: null }));
            }
        } catch (err) {
            console.error('Error confirming image:', err);
            alert('Failed to send confirmation. Please try again.');
        } finally {
            setConfirming(false);
        }
    };

    const isCompleted = currentStep >= (activeSteps.length - 1);
    const isAwaitingImage = orderData?.generation_status === 'awaiting_image_confirmation';
    const email = stateEmail || orderData?.email || '';
    const templateName = stateTemplate?.name || '';
    const [resending, setResending] = useState(false);

    const handleResendEmail = async () => {
        if (!orderId || !email || !orderData?.video_url) return;
        setResending(true);
        try {
            await resendEmail(orderId, email, orderData.video_url);
            alert('Email sent successfully! Please check your inbox (and spam folder).');
        } catch (err) {
            console.error('Resend error:', err);
            alert('Failed to resend email: ' + err.message);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="page" id="success-page">
            <div className="success-page-content glass-panel" style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="success-icon animate-fade-in-up">🎉</div>
                <h1 className="success-title animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {genFailed ? 'Generation Failed' : isCompleted
                        ? (isImageOnlyTemplate ? 'Image Ready!' : 'Video Ready!')
                        : (isImageOnlyTemplate ? 'Order Confirmed!' : 'Payment Successful!')}
                </h1>
                <p className="success-subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    {genFailed
                        ? 'Something went wrong generating your media. Please contact support.'
                        : isCompleted
                            ? (isImageOnlyTemplate
                                ? 'Your AI-generated image has been sent to your email.'
                                : 'Your AI-generated invitation video has been sent to your email.')
                            : "Your order is being processed. We'll send updates to your email."}
                </p>

                {/* Email Display */}
                {email && (
                    <div className="email-display animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        📧 {email}
                    </div>
                )}

                {/* Template Info */}
                {templateName && (
                    <p className="animate-fade-in-up" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, animationDelay: '0.35s' }}>
                        Template: <strong>{templateName}</strong>
                    </p>
                )}

                {/* Order ID */}
                {orderId && (
                    <p className="animate-fade-in-up" style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 24, fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
                        Order ID: {orderData?.readable_id || `${orderId.slice(0, 8)}...${orderId.slice(-4)}`}
                    </p>
                )}

                {pollError && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--danger)', marginBottom: 16 }}>
                        ⚠️ Status check failed: {pollError}
                    </p>
                )}

                {/* Image Confirmation Step (Only show for Veo two-step templates that explicitly request review) */}
                {isAwaitingImage && orderData?.generated_image_url && hasTwoStepReview && (
                    <div className="image-confirmation-card animate-fade-in-up" style={{ marginBottom: 32, padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', animationDelay: '0.4s' }}>
                        <h3 style={{ marginBottom: 16, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Review Generated Image</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                            Please review the preview image below. If the text and composition look correct, confirm to proceed with the final video generation.
                        </p>
                        <img
                            src={orderData.generated_image_url}
                            alt="Generated Preview"
                            style={{ width: '100%', maxWidth: '300px', borderRadius: 'var(--radius-md)', display: 'block', margin: '0 auto 24px', border: '1px solid var(--border-color)' }}
                        />
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                onClick={() => handleConfirmImage('regenerate')}
                                disabled={confirming}
                                className="btn btn-outline"
                                style={{ flex: 1 }}
                            >
                                🔄 Regenerate
                            </button>
                            <button
                                onClick={() => handleConfirmImage('approve')}
                                disabled={confirming}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                ✓ Confirm & Generate Video
                            </button>
                        </div>
                    </div>
                )}

                {/* Result Display when completed */}
                {isCompleted && (orderData?.video_url || orderData?.generated_image_url) && !orderData?.video_url?.startsWith('kie:') && (
                    <div style={{ marginBottom: 24, padding: '20px 24px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                            {isImageOnlyTemplate ? '🖼️ Your AI Image is ready!' : '🎬 Your AI Video is ready!'}
                        </p>

                        {/* Primary Action Row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                            <a
                                href={isImageOnlyTemplate ? (orderData.video_url || orderData.generated_image_url) : orderData.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                                {isImageOnlyTemplate ? '📥 Download Image' : '📥 Download Video'}
                            </a>

                            {/* 1-Tap Mobile Native Share (Mobile Viewports Only) */}
                            {canNativeShare && (
                                <button
                                    onClick={handleNativeShare}
                                    disabled={isSharing}
                                    className="btn sm:hidden"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 20px',
                                        borderRadius: '9999px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                                        color: '#ffffff',
                                        border: 'none',
                                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                                    }}
                                >
                                    {isSharing ? '⏳ Preparing...' : '🚀 Share to Instagram / Facebook'}
                                </button>
                            )}
                        </div>

                        {/* Copy Caption Section (Desktop & Mobile) */}
                        <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    📋 Personalized Social Caption:
                                </span>

                                <button
                                    onClick={handleCopyCaption}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '7px 16px',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: captionCopied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                        color: captionCopied ? '#4ade80' : 'var(--text-primary)',
                                        border: captionCopied ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {captionCopied ? '✓ Copied to Clipboard!' : '📋 Copy Caption'}
                                </button>
                            </div>

                            {/* Caption Preview Box */}
                            <div style={{
                                padding: '12px 16px',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.06)',
                                fontSize: '0.82rem',
                                color: 'rgba(255,255,255,0.85)',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'inherit',
                                lineHeight: '1.5',
                            }}>
                                {activeCaption}
                            </div>
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="timeline animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    {activeSteps.map((step, index) => {
                        let status = 'pending';
                        if (isCompleted) {
                            status = 'completed';
                        } else if (index < currentStep) {
                            status = 'completed';
                        } else if (index === currentStep) {
                            status = 'active';
                        }

                        // Special case: if we are at awaiting_image_confirmation, we pulse it differently
                        const isInteractiveStep = (status === 'active' && step.key === 'awaiting_image_confirmation');

                        return (
                            <div className={`timeline-item ${status}`} key={index}>
                                <div className={`timeline-dot ${status} ${isInteractiveStep ? 'pulse' : ''}`}>
                                    {status === 'completed' ? '✓' : status === 'active' ? '•' : (index + 1)}
                                </div>
                                <span className="timeline-label">{step.label}</span>
                                {status === 'active' && !isInteractiveStep && (
                                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></span>
                                        In progress...
                                    </span>
                                )}
                                {isInteractiveStep && (
                                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--warning-color, #f39c12)', fontWeight: 'bold' }}>
                                        Action Required
                                    </span>
                                )}
                                {status === 'completed' && (
                                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--success)' }}>
                                        ✓ Done
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Generation Failed */}
                {genFailed && (
                    <div style={{ marginTop: 24, padding: '16px 24px', background: 'rgba(255,0,0,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>
                            ⚠️ Generation failed. This could be due to API limits or content filtering.
                            If you were charged, please contact support for a refund.
                        </p>
                    </div>
                )}

                {/* Buttons */}
                <div className="success-buttons" style={{ marginTop: 32 }}>
                    <Link to="/" className="btn btn-primary">Back to Home</Link>
                    <div className="resend-tooltip">
                        <button 
                            className="btn btn-outline" 
                            disabled={!isCompleted || resending}
                            onClick={handleResendEmail}
                        >
                            {resending ? 'Sending...' : 'Resend Email'}
                        </button>
                        {!isCompleted && (
                            <span className="tooltip-text">Available after completion</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
