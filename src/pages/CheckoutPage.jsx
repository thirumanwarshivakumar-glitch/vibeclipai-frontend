import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Upload, Video, X, ShieldCheck, Mail, ArrowRight, Camera } from 'lucide-react';
import { useUser } from '@insforge/react';
import { createOrder, createStripeCheckout, uploadUserImage, uploadUserVideo, createRazorpayOrder, verifyRazorpayPayment } from '../lib/api';

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isLoaded: userLoaded } = useUser();
    const { 
        template, 
        formValues, 
        userImageFiles: passedImageFiles = [],
        userImagePreviews: passedImagePreviews = [],
        userImageFile: passedImageFile, 
        userImagePreview: passedImagePreview,
        userVideoFile: passedVideoFile,
        userVideoPreview: passedVideoPreview
    } = location.state || {};
    
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [statusText, setStatusText] = useState('');

    // User image upload state
    const initialFiles = passedImageFiles.length > 0 ? passedImageFiles : (passedImageFile ? [passedImageFile] : []);
    const initialPreviews = passedImagePreviews.length > 0 ? passedImagePreviews : (passedImagePreview ? [passedImagePreview] : []);
    const [userImageFiles, setUserImageFiles] = useState(initialFiles);
    const [userImagePreviews, setUserImagePreviews] = useState(initialPreviews);
    const [imageUploadError, setImageUploadError] = useState('');
    const userImageRef = useRef(null);

    // Motion video upload state
    const [userVideoFile, setUserVideoFile] = useState(passedVideoFile || null);
    const [userVideoPreview, setUserVideoPreview] = useState(passedVideoPreview || '');
    const [videoUploadError, setVideoUploadError] = useState('');
    const userVideoRef = useRef(null);

    const isKlingMotionControl = 
        template?.ai_model?.toLowerCase().includes('kling') || 
        template?.aiModel?.toLowerCase().includes('kling') ||
        template?.name?.toLowerCase().includes('kling') ||
        template?.id === 'b61dbd8e-2850-4fc8-afcb-f7e80451c7aa'; 
        
    const requiresUserImage = !!(template?.allow_user_image_upload) || isKlingMotionControl;
    const requiresUserVideo = !!(template?.allow_user_video_upload);

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
        return () => document.body.removeChild(script);
    }, []);

    const handleUserImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const maxUploads = template?.max_user_uploads || template?.maxUserUploads || 1;
        let validFiles = [];
        let validPreviews = [];
        let errors = [];

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                errors.push('Please select a JPEG, PNG, or JPG image.');
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                errors.push('Images must be under 10MB.');
                continue;
            }
            validFiles.push(file);
            validPreviews.push(URL.createObjectURL(file));
        }

        if (errors.length > 0) setImageUploadError(errors[0]);
        else setImageUploadError('');

        setUserImageFiles(prev => [...prev, ...validFiles].slice(0, maxUploads));
        setUserImagePreviews(prev => [...prev, ...validPreviews].slice(0, maxUploads));
        
        if (userImageRef.current) userImageRef.current.value = '';
    };

    const handleUserVideoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['video/mp4', 'video/quicktime'];
        if (!validTypes.includes(file.type)) {
            setVideoUploadError('Please select an MP4 or QuickTime video.');
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            setVideoUploadError('Video must be under 100MB.');
            return;
        }

        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            const duration = video.duration;
            if (duration < 3) {
                setVideoUploadError('Video must be at least 3 seconds long.');
                URL.revokeObjectURL(video.src);
                return;
            }
            if (duration > 30) {
                setVideoUploadError('Video must be 30 seconds or shorter.');
                URL.revokeObjectURL(video.src);
                return;
            }
            setVideoUploadError('');
            setUserVideoFile(file);
            setUserVideoPreview(URL.createObjectURL(file));
        };
        video.src = URL.createObjectURL(file);
    };

    if (!template) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
                <div className="glass-panel p-10 rounded-3xl text-center max-w-md w-full">
                    <h1 className="text-2xl font-bold text-white mb-4">No Template Selected</h1>
                    <p className="text-zinc-400 mb-8">Please select a template first to proceed with checkout.</p>
                    <Link to="/templates">
                        <button className="w-full glass-button px-6 py-3 rounded-full font-semibold text-white">Browse Templates</button>
                    </Link>
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
        if (requiresUserImage && userImageFiles.length === 0) {
            alert('Please upload your reference image(s) to continue.');
            return;
        }
        if (requiresUserVideo && !userVideoFile) {
            alert('Please upload your motion reference video to continue.');
            return;
        }

        setLoading(true);

        try {
            let userImageUrl = null;
            let userVideoUrl = null;
            const tempId = `temp-${Date.now()}`;

            if (requiresUserImage && userImageFiles.length > 0) {
                setStatusText('Uploading your image(s)...');
                const uploadPromises = userImageFiles.map((file, idx) => 
                    uploadUserImage(file, `${tempId}-${idx}`)
                );
                const urls = await Promise.all(uploadPromises);
                userImageUrl = urls.join(',');
            }

            if (userVideoFile) {
                setStatusText('Uploading your motion video...');
                userVideoUrl = await uploadUserVideo(userVideoFile, tempId);
            }

            setStatusText('Creating order...');
            const orderResult = await createOrder({
                templateId: template.id,
                email,
                formValues: values,
                paymentMethod,
                userId: user?.id,
                userImageUrl,
                userVideoUrl,
            });

            if (!orderResult?.order?.id) throw new Error('Failed to create order');
            const orderId = orderResult.order.id;

            if (paymentMethod === 'stripe') {
                setStatusText('Redirecting to Stripe...');
                const checkout = await createStripeCheckout(orderId);
                if (checkout?.url) {
                    window.location.href = checkout.url;
                    return;
                } else throw new Error('No checkout URL returned');
            } else if (paymentMethod === 'razorpay') {
                setStatusText('Initializing Razorpay...');
                
                const isProduction = window.location.hostname === 'vibeclipsai.com';
                const mode = isProduction ? 'live' : 'test';
                const razorpayKeyId = isProduction
                    ? (import.meta.env.VITE_RAZORPAY_KEY_ID_LIVE || 'rzp_live_default')
                    : (import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Sye28MlYfYvC0l');

                const razorpayOrder = await createRazorpayOrder(orderId, template.price, 'INR', mode);

                const options = {
                    key: razorpayKeyId,
                    amount: razorpayOrder.amount,
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
                                razorpay_signature: response.razorpay_signature,
                                mode: mode
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
                    theme: { color: "#7C3AED" },
                    modal: { ondismiss: function() { setLoading(false); setStatusText(''); } }
                };
                
                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (err) {
            console.error('Payment error:', err);
            alert('Something went wrong: ' + (err.message || 'Please try again.'));
            setStatusText('');
        } finally {
            if (!statusText.includes('Stripe')) setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen pt-24 pb-24 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-zinc-400 mb-8"
                >
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <span>/</span>
                    <Link to={`/template/${template.id}`} className="hover:text-white transition-colors truncate max-w-[150px] sm:max-w-xs">{template.name}</Link>
                    <span>/</span>
                    <span className="text-white font-medium">Checkout</span>
                </motion.div>

                <div className="mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">Checkout</h1>
                    <p className="text-zinc-400">Review your order and complete secure payment</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* LEFT COLUMN: UPLOADS & PAYMENT */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-7 space-y-6"
                    >
                        <div className="glass-panel p-6 sm:p-8 rounded-[2rem]">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-[#7C3AED]" />
                                Payment Method
                            </h3>

                            <div className="mb-8">
                                <button
                                    onClick={() => setPaymentMethod('razorpay')}
                                    disabled={loading}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all border-[#7C3AED] bg-[#7C3AED]/10 shadow-[0_0_15px_rgba(124,58,237,0.2)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">₹</span>
                                        </div>
                                        <div className="text-left">
                                            <span className="font-semibold block text-white">Razorpay (India & Intl.)</span>
                                            <span className="text-xs text-purple-200/70">UPI, Cards, Netbanking</span>
                                        </div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-2 border-[#7C3AED] flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                                    </div>
                                </button>
                            </div>

                            {/* Reference Image Upload */}
                            {requiresUserImage && (
                                <div className="border-t border-white/10 pt-8 pb-8">
                                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                        <Camera className="w-5 h-5 text-[#EC4899]" />
                                        Reference Photo <span className="text-[#EC4899]">*</span>
                                    </h3>
                                    <p className="text-sm text-zinc-400 mb-6">Upload clear photos to be used in your generation.</p>

                                    <div className="flex flex-wrap gap-4 mb-4">
                                        {userImagePreviews.map((preview, idx) => (
                                            <div key={idx} className="relative w-24 h-24 group">
                                                <img src={preview} alt="Upload" className="w-full h-full object-cover rounded-xl border-2 border-white/20" />
                                                <button
                                                    onClick={() => {
                                                        setUserImageFiles(prev => prev.filter((_, i) => i !== idx));
                                                        setUserImagePreviews(prev => prev.filter((_, i) => i !== idx));
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        {userImageFiles.length < (template?.max_user_uploads || template?.maxUserUploads || 1) && (
                                            <div 
                                                onClick={() => !loading && userImageRef.current?.click()}
                                                className={`w-24 h-24 border-2 border-dashed border-white/20 hover:border-[#7C3AED] rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/5 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Upload className="w-6 h-6 text-zinc-400 mb-1" />
                                                <span className="text-[10px] font-semibold">Upload</span>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={userImageRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={(template?.max_user_uploads || template?.maxUserUploads || 1) > 1} className="hidden" onChange={handleUserImageSelect} disabled={loading} />
                                    {imageUploadError && <p className="text-xs text-red-400">{imageUploadError}</p>}
                                </div>
                            )}

                            {/* Motion Video Upload */}
                            {requiresUserVideo && (
                                <div className="border-t border-white/10 pt-8 pb-8">
                                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                        <Video className="w-5 h-5 text-[#EC4899]" />
                                        Motion Video <span className="text-[#EC4899]">*</span>
                                    </h3>
                                    <p className="text-sm text-zinc-400 mb-6">Upload a reference motion video (3-30 sec).</p>

                                    {userVideoPreview ? (
                                        <div className="relative max-w-[240px]">
                                            <video src={userVideoPreview} controls className="w-full rounded-xl border-2 border-white/20" />
                                            <button
                                                onClick={() => { setUserVideoFile(null); setUserVideoPreview(''); }}
                                                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <div className="mt-2 text-xs text-green-400 font-semibold flex items-center gap-1">
                                                <ShieldCheck className="w-4 h-4" /> Ready to process
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => !loading && userVideoRef.current?.click()}
                                            className={`border-2 border-dashed border-white/20 hover:border-[#7C3AED] rounded-xl p-8 text-center cursor-pointer transition-colors bg-white/5 max-w-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Video className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                                            <p className="text-sm font-semibold mb-1">Click to upload motion video</p>
                                            <p className="text-xs text-zinc-500">MP4, MOV (Max 100MB)</p>
                                        </div>
                                    )}
                                    <input ref={userVideoRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleUserVideoSelect} disabled={loading} />
                                    {videoUploadError && <p className="text-xs text-red-400 mt-2">{videoUploadError}</p>}

                                    <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-200">
                                        <strong className="text-green-400 block mb-1">🎯 Output Goal:</strong> 
                                        Your character will be animated to perform the exact motions from this video.
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div className="border-t border-white/10 pt-8 pb-4">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-white/70" />
                                    Delivery Email <span className="text-[#EC4899]">*</span>
                                </h3>
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all"
                                />
                                <p className="text-xs text-zinc-400 mt-2">
                                    We will send your {isKlingMotionControl ? 'generated video' : 'download link'} to this address.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: SUMMARY */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-5"
                    >
                        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] sticky top-28">
                            <h3 className="text-xl font-bold mb-6">Order Summary</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
                                    <span className="text-zinc-400">Template</span>
                                    <span className="font-semibold text-right max-w-[200px] truncate">{template.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
                                    <span className="text-zinc-400">Format</span>
                                    <span className="font-semibold">{isKlingMotionControl ? 'Motion Control Video' : ((template.tags || [])[0] || 'Video')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
                                    <span className="text-zinc-400">Payment</span>
                                    <span className="font-semibold">Razorpay</span>
                                </div>

                                {isKlingMotionControl && (
                                    <div className="pt-2 pb-4 border-b border-white/5">
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Upload Status</span>
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="text-zinc-400">Reference Photo</span>
                                            <span className={userImageFiles.length > 0 ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                                                {userImageFiles.length > 0 ? '✅ Ready' : '⏳ Required'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400">Motion Video</span>
                                            <span className={userVideoFile ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                                                {userVideoFile ? '✅ Ready' : '⏳ Required'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Details Preview */}
                            {Object.keys(values).length > 0 && (
                                <div className="mb-8">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Your Details</span>
                                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                        {inputSchema.filter(f => values[f.key]).map(field => (
                                            <div key={field.key} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                                                <span className="text-zinc-400">{field.label}</span>
                                                <span className="font-medium text-right break-words max-w-[200px]">{values[field.key]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                                <span className="text-lg text-zinc-300">Total</span>
                                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EC4899]">
                                    ₹{Number(template.price).toFixed(2)}
                                </span>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handlePay}
                                disabled={loading}
                                className="w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-[#7C3AED]/20 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {statusText || 'Processing...'}
                                    </>
                                ) : (
                                    <>
                                        Pay ₹{Number(template.price).toFixed(2)} <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>

                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500 text-center">
                                <ShieldCheck className="w-4 h-4" /> 
                                <span>Secured with 256-bit SSL encryption</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
