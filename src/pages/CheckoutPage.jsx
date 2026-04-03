import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { createOrder, createStripeCheckout, confirmPayment, uploadUserImage, createRazorpayOrder, verifyRazorpayPayment } from '../lib/api';

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isLoaded: userLoaded } = useUser();
    const { template, formValues, userImageFile: passedFile, userImagePreview: passedPreview } = location.state || {};
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [statusText, setStatusText] = useState('');

    // User image upload state (when template.allow_user_image_upload is true)
    const [userImageFile, setUserImageFile] = useState(passedFile || null);
    const [userImagePreview, setUserImagePreview] = useState(passedPreview || '');
    const [imageUploadError, setImageUploadError] = useState('');
    const userImageRef = useRef(null);

    const requiresUserImage = !!(template?.allow_user_image_upload);

    useEffect(() => {
        if (userLoaded && user?.email && !email) {
            setEmail(user.email);
        }
    }, [user, userLoaded, email]);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleUserImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setImageUploadError('Please select a JPEG, PNG, or WebP image.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setImageUploadError('Image must be under 10MB.');
            return;
        }
        setImageUploadError('');
        setUserImageFile(file);
        setUserImagePreview(URL.createObjectURL(file));
    };

    if (!template) {
        return (
            <div className="page">
                <div className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>No Template Selected</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Please select a template first.</p>
                    <Link to="/" className="btn btn-primary">Browse Templates</Link>
                </div>
            </div>
        );
    }

    const values = formValues || {};
    const inputSchema = template.input_schema || template.inputSchema || [];

    const handlePay = async () => {
        if (!email.trim() || !email.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }

        // Validate user image if required
        if (requiresUserImage && !userImageFile) {
            alert('Please upload your reference image to continue.');
            return;
        }

        setLoading(true);

        try {
            let userImageUrl = null;

            // Upload user image if required
            if (requiresUserImage && userImageFile) {
                setStatusText('Uploading your image...');
                const tempId = `temp-${Date.now()}`;
                userImageUrl = await uploadUserImage(userImageFile, tempId);
            }

            // Step 1: Create order in the database
            setStatusText('Creating order...');
            const orderResult = await createOrder({
                templateId: template.id,
                email,
                formValues: values,
                paymentMethod,
                userId: user?.id,
                userImageUrl,   // ← passed to backend, will override reference_image_url on the order
            });

            if (!orderResult?.order?.id) {
                throw new Error('Failed to create order');
            }

            const orderId = orderResult.order.id;

            if (paymentMethod === 'stripe') {
                // Step 2a: Real Stripe checkout — redirect to Stripe payment page
                setStatusText('Redirecting to Stripe...');
                const checkout = await createStripeCheckout(orderId);

                if (checkout?.url) {
                    // Redirect to Stripe hosted checkout
                    window.location.href = checkout.url;
                    return; // Page will unload
                } else {
                    throw new Error('No checkout URL returned');
                }
            } else if (paymentMethod === 'razorpay') {
                setStatusText('Initializing Razorpay...');
                
                // 1. Create order on backend
                const razorpayOrder = await createRazorpayOrder(orderId, template.price, 'INR');

                // 2. Launch Razorpay Checkout
                const options = {
                    key: import.meta.env.RAZORPAY_KEY_ID,
                    amount: razorpayOrder.amount, // already converted to paise by backend
                    currency: razorpayOrder.currency,
                    name: "VibeClipAI",
                    description: "AI Template Purchase",
                    order_id: razorpayOrder.id,
                    handler: async function (response) {
                        try {
                            setStatusText('Verifying payment...');
                            setLoading(true);
                            await verifyRazorpayPayment({
                                orderId: orderId,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            });
                            
                            navigate('/success', {
                                state: { email, template, formValues: values, orderId },
                            });
                        } catch (err) {
                            console.error('Verification error:', err);
                            alert('Payment verification failed: ' + (err.message || 'Unknown error'));
                            setLoading(false);
                            setStatusText('');
                        }
                    },
                    prefill: {
                        name: user?.user_metadata?.full_name || "",
                        email: email || "",
                        contact: ""
                    },
                    theme: {
                        color: "#6366f1"
                    },
                    modal: {
                        ondismiss: function() {
                            setLoading(false);
                            setStatusText('');
                        }
                    }
                };
                
                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (err) {
            console.error('Payment error:', err);
            alert('Something went wrong: ' + (err.message || 'Please try again.'));
            setStatusText('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page" id="checkout-page">
            <div className="container">
                <div className="page-header">
                    <div className="breadcrumb">
                        <Link to="/">Home</Link>
                        <span>/</span>
                        <Link to={`/template/${template.id}`}>Template</Link>
                        <span>/</span>
                        <span>Checkout</span>
                    </div>
                    <h1 className="page-title">Checkout</h1>
                    <p className="page-subtitle">Review your order and complete payment</p>
                </div>

                <div className="checkout-grid">
                    {/* Payment Section */}
                    <div className="checkout-card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Payment Method</h3>

                        <div className="payment-tabs">
                            <button
                                className="payment-tab active"
                                onClick={() => setPaymentMethod('razorpay')}
                                disabled={loading}
                                style={{ width: '100%' }}
                            >
                                🏦 Razorpay
                            </button>
                        </div>

                        <div className="payment-placeholder">
                            <div className="payment-placeholder-icon">🔒</div>
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>Razorpay Payment Gateway</p>
                            <p style={{ fontSize: '0.85rem' }}>
                                Pay securely using UPI, Credit/Debit cards, Netbanking, or Wallets (India & International).
                            </p>
                        </div>

                        {/* User Reference Image Upload (when template requires it) */}
                        {requiresUserImage && (
                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <label className="form-label">
                                    📸 Your Reference Photo <span className="required">*</span>
                                </label>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                                    This photo will be used by our AI to personalize your {template.templateType === 'image' ? 'image' : 'video'}. Please upload a clear, high-quality photo.
                                </p>

                                {userImagePreview ? (
                                    <div style={{ position: 'relative', maxWidth: 220, marginBottom: 8 }}>
                                        <img
                                            src={userImagePreview}
                                            alt="Your uploaded photo"
                                            style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '2px solid var(--accent-primary)', display: 'block' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setUserImageFile(null); setUserImagePreview(''); }}
                                            style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(220,53,69,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >✕</button>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--success, #28a745)', marginTop: 6, fontWeight: 600 }}>✅ Photo ready</p>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => !loading && userImageRef.current?.click()}
                                        style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px 16px', textAlign: 'center', cursor: loading ? 'not-allowed' : 'pointer', background: 'var(--bg-secondary)', transition: 'border-color 0.2s' }}
                                    >
                                        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🤳</div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>Click to upload your photo</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>JPEG, PNG, WebP — Max 10MB</p>
                                    </div>
                                )}

                                <input
                                    ref={userImageRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    style={{ display: 'none' }}
                                    onChange={handleUserImageSelect}
                                    disabled={loading}
                                />

                                {imageUploadError && (
                                    <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: 8 }}>⚠️ {imageUploadError}</p>
                                )}
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="form-group">
                            <label className="form-label">
                                Email Address <span className="required">*</span>
                            </label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="Enter your email for delivery"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>
                                Your video download link will be sent to this email.
                            </small>
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: 16 }}
                            onClick={handlePay}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    {statusText || 'Processing...'}
                                </>
                            ) : (
                                <>Pay ₹{Number(template.price).toFixed(2)} & Generate</>
                            )}
                        </button>

                        <p className="microcopy">
                            🔒 Your payment is secured with 256-bit SSL encryption.<br />
                            You'll receive your download link by email after payment is confirmed.
                        </p>
                    </div>

                    {/* Order Summary */}
                    <div className="checkout-card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Order Summary</h3>

                        <div className="checkout-summary-item">
                            <span className="label">Template</span>
                            <span className="value">{template.name}</span>
                        </div>
                        <div className="checkout-summary-item">
                            <span className="label">Category</span>
                            <span className="value">{(template.tags || [])[2] || (template.tags || [])[0] || 'General'}</span>
                        </div>
                        <div className="checkout-summary-item">
                            <span className="label">Format</span>
                            <span className="value">{(template.tags || [])[0] || 'Video'}</span>
                        </div>
                        <div className="checkout-summary-item">
                            <span className="label">Payment</span>
                            <span className="value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                🏦 Razorpay
                            </span>
                        </div>

                        {/* Input Values Preview */}
                        {Object.keys(values).length > 0 && (
                            <div className="inputs-preview">
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '12px 0 8px' }}>
                                    Your Details
                                </h4>
                                {inputSchema
                                    .filter((f) => values[f.key])
                                    .map((field) => (
                                        <div className="inputs-preview-item" key={field.key}>
                                            <span className="label">{field.label}</span>
                                            <span className="value">{values[field.key]}</span>
                                        </div>
                                    ))}
                            </div>
                        )}

                        <div className="checkout-total">
                            <span>Total</span>
                            <span style={{ color: 'var(--accent-primary)' }}>₹{Number(template.price).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
