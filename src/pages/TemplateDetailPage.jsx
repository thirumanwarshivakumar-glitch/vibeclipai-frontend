import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Upload, X, Check, Image as ImageIcon, Video, Sparkles, Volume2, VolumeX } from 'lucide-react';
import FormRenderer from '../components/FormRenderer';
import { fetchTemplateById } from '../lib/api';
import { compressImage } from '../lib/imageCompressor';

export default function TemplateDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formValues, setFormValues] = useState({});
    
    const [userImageFiles, setUserImageFiles] = useState([]);
    const [userImagePreviews, setUserImagePreviews] = useState([]);
    const [imageUploadError, setImageUploadError] = useState('');
    const userImageRef = useRef(null);

    // Seedance 2.5 Multi-Slot & Audio state
    const [slotFiles, setSlotFiles] = useState({});
    const [slotPreviews, setSlotPreviews] = useState({});
    const [userAudioFile, setUserAudioFile] = useState(null);
    const [userAudioPreview, setUserAudioPreview] = useState('');
    const [audioError, setAudioError] = useState('');
    const userAudioRef = useRef(null);

    const [userVideoFile, setUserVideoFile] = useState(null);
    const [userVideoPreview, setUserVideoPreview] = useState('');
    const [videoUploadError, setVideoUploadError] = useState('');
    const userVideoRef = useRef(null);

    const videoPreviewRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchTemplateById(id)
            .then((data) => setTemplate(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="spinner mb-4" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#7C3AED', width: 48, height: 48, borderWidth: 4, borderStyle: 'solid', borderRadius: '50%' }}></div>
                    <p className="text-zinc-400 font-medium tracking-wide">Loading template...</p>
                </div>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
                <div className="glass-panel p-10 rounded-3xl text-center max-w-md w-full">
                    <h1 className="text-2xl font-bold text-white mb-4">Template Not Found</h1>
                    <p className="text-zinc-400 mb-8">{error || "The template you're looking for doesn't exist."}</p>
                    <Link to="/">
                        <button className="w-full glass-button px-6 py-3 rounded-full font-semibold text-white">Back to Home</button>
                    </Link>
                </div>
            </div>
        );
    }

    const isImage = template.template_type === 'image' || template.templateType === 'image';
    const isKlingMotionControl = 
        template?.ai_model?.toLowerCase().includes('kling') || 
        template?.aiModel?.toLowerCase().includes('kling') ||
        template?.name?.toLowerCase().includes('kling') ||
        template?.id === 'b61dbd8e-2850-4fc8-afcb-f7e80451c7aa';

    const isSeedance25 = 
        template?.ai_model?.toLowerCase().includes('seedance_2_5') || 
        template?.aiModel?.toLowerCase().includes('seedance_2_5') ||
        Array.isArray(template?.seedance_slots) ||
        Array.isArray(template?.reference_images) ||
        (template?.reference_images && typeof template.reference_images === 'object' && template.reference_images.slots);

    const refImagesData = template?.reference_images || template?.seedance_slots;
    const seedanceSlots = Array.isArray(refImagesData) 
        ? refImagesData 
        : (refImagesData?.slots || []);
    const seedanceAudio = !Array.isArray(refImagesData) && refImagesData?.audio 
        ? refImagesData.audio 
        : {};

    const userSeedanceSlots = isSeedance25 && Array.isArray(seedanceSlots)
        ? seedanceSlots.filter(s => s && s.enabled && s.source === 'user')
        : [];
    const adminSeedanceSlots = isSeedance25 && Array.isArray(seedanceSlots)
        ? seedanceSlots.filter(s => s && s.enabled && s.source === 'admin')
        : [];

    const allowsUserAudio = isSeedance25 && (!!seedanceAudio.allow_user_audio_upload || !!template?.allow_user_audio_upload);

    const tags = template.tags || [];
    const rawRatio = (template.default_aspect_ratio || template.aspect_ratio || template.aspectRatio || '').toLowerCase();
    const isVertical916 = rawRatio.includes('9:16') || rawRatio.includes('9/16') || tags.some(t => String(t).includes('9:16') || String(t).includes('9/16')) || isKlingMotionControl;
    const isSquare11 = rawRatio.includes('1:1') || rawRatio.includes('1/1') || tags.some(t => String(t).includes('1:1') || String(t).includes('1/1'));
    const mediaAspectRatio = isImage ? '4/5' : (isVertical916 ? '9/16' : (isSquare11 ? '1/1' : '16/9'));

    const requiresUserImage = !isSeedance25 && (!!(template?.allow_user_image_upload) || isKlingMotionControl);
    const requiresUserVideo = !!(template?.allow_user_video_upload);
    const inputSchema = (template.input_schema || []).filter(f => f && f.key && String(f.key).trim() !== '');
    const maxUploads = template?.max_user_uploads || template?.maxUserUploads || 1;

    const includesMap = {
        'Wedding': [
            'AI-generated cinematic name reveal',
            'Venue & date display with elegant transitions',
            'RSVP details with contact information',
            'Custom color theme selection',
            'Vertical 9:16 format (social media ready)',
            'HD 1080p quality video output',
        ],
        'Birthday': [
            'Colorful confetti burst animation',
            'Name & age reveal with dynamic effects',
            'Custom birthday message card',
            'Choice of vibrant color themes',
            'Vertical 9:16 format (social media ready)',
            'HD 1080p quality video output',
        ],
    };
    
    const tagIcons = { 'Wedding': '💍', 'Birthday': '🎂' };
    const matchedTag = tags.find((t) => tagIcons[t]);
    const icon = tagIcons[matchedTag] || (isImage ? '🖼️' : '🎬');
    
    const includes = includesMap[matchedTag] || [
        isImage ? 'AI-generated image content' : 'AI-generated video content',
        'Custom text and details',
        isImage ? 'Premium high-quality output' : 'HD 1080p quality output',
        'Social media ready format',
    ];

    const handleUserImageSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        
        let validFiles = [];
        let validPreviews = [];
        let errors = [];

        for (const file of files) {
            const isImageType = file.type?.startsWith('image/') || file.type === '';
            const hasImageExt = /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name || '');

            if (!isImageType && !hasImageExt) {
                errors.push('Please select a JPEG, PNG, or JPG image.');
                continue;
            }

            try {
                // Compress camera selfies in browser memory if large
                const processedFile = await compressImage(file);
                validFiles.push(processedFile);
                validPreviews.push(URL.createObjectURL(processedFile));
            } catch (err) {
                console.warn('Image processing warning:', err);
                validFiles.push(file);
                validPreviews.push(URL.createObjectURL(file));
            }
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
        if (!file.type.startsWith('video/')) {
            setVideoUploadError('Please select a valid video file (MP4, MOV).');
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            setVideoUploadError('Video must be under 100MB.');
            return;
        }
        setVideoUploadError('');
        setUserVideoFile(file);
        setUserVideoPreview(URL.createObjectURL(file));
        if (userVideoRef.current) userVideoRef.current.value = '';
    };

    const handleSlotSelect = async (e, slotIdx) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const processed = await compressImage(file);
            setSlotFiles(prev => ({ ...prev, [slotIdx]: processed }));
            setSlotPreviews(prev => ({ ...prev, [slotIdx]: URL.createObjectURL(processed) }));
        } catch (err) {
            setSlotFiles(prev => ({ ...prev, [slotIdx]: file }));
            setSlotPreviews(prev => ({ ...prev, [slotIdx]: URL.createObjectURL(file) }));
        }
    };

    const removeSlotSelect = (slotIdx) => {
        setSlotFiles(prev => {
            const copy = { ...prev };
            delete copy[slotIdx];
            return copy;
        });
        setSlotPreviews(prev => {
            const copy = { ...prev };
            delete copy[slotIdx];
            return copy;
        });
    };

    const handleAudioSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('audio/')) {
            setAudioError('Please select a valid audio file (MP3, WAV, AAC).');
            return;
        }
        if (file.size > 30 * 1024 * 1024) {
            setAudioError('Audio file must be under 30MB.');
            return;
        }
        setAudioError('');
        setUserAudioFile(file);
        setUserAudioPreview(URL.createObjectURL(file));
    };

    const removeAudioSelect = () => {
        setUserAudioFile(null);
        setUserAudioPreview('');
    };

    const handleContinue = () => {
        const missingRequired = inputSchema
            .filter((f) => f.required && !formValues[f.key])
            .map((f) => f.label);

        if (missingRequired.length > 0) {
            alert(`Please fill in required fields: ${missingRequired.join(', ')}`);
            return;
        }

        if (isSeedance25 && userSeedanceSlots.length > 0) {
            const missingSlots = userSeedanceSlots.filter(s => !slotFiles[s.slot]);
            if (missingSlots.length > 0) {
                alert(`Please upload photo for: ${missingSlots.map(s => s.label || `Image ${s.slot}`).join(', ')}`);
                return;
            }
        } else {
            if (requiresUserImage && userImageFiles.length === 0) {
                alert('Please upload your reference photo to proceed.');
                return;
            }
        }

        if (requiresUserVideo && !userVideoFile) {
            alert('Please upload your motion video to proceed.');
            return;
        }

        navigate('/checkout', {
            state: {
                template,
                formValues,
                userImageFiles,
                userImagePreviews,
                userVideoFile,
                userVideoPreview,
                seedanceSlotFiles: slotFiles,
                seedanceSlotPreviews: slotPreviews,
                userAudioFile,
                userAudioPreview
            },
        });
    };

    const toggleVideoPlayback = () => {
        if (!videoPreviewRef.current) return;
        if (isPlaying) {
            videoPreviewRef.current.pause();
            setIsPlaying(false);
        } else {
            if (isMuted) {
                videoPreviewRef.current.muted = false;
                setIsMuted(false);
            }
            videoPreviewRef.current.play();
            setIsPlaying(true);
        }
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        if (!videoPreviewRef.current) return;
        const newMuted = !isMuted;
        videoPreviewRef.current.muted = newMuted;
        setIsMuted(newMuted);
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
                    <Link to="/templates" className="hover:text-white transition-colors">Templates</Link>
                    <span>/</span>
                    <span className="text-white truncate">{template.name}</span>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* LEFT: PREVIEW & DETAILS */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-7 space-y-8 lg:sticky lg:top-28"
                    >
                        {/* Media Preview */}
                        <div className={`glass-panel p-2 rounded-[2rem] overflow-hidden relative shadow-2xl group ${isVertical916 ? 'max-w-[380px] mx-auto' : ''}`} style={{ aspectRatio: mediaAspectRatio }}>
                            {template.preview_video_url ? (
                                template.preview_video_url.match(/\.(mp4|webm|mov|avi|m4v|ogv)(\?.*)?$/i) ? (
                                    <>
                                        <video
                                            ref={videoPreviewRef}
                                            src={template.preview_video_url}
                                            autoPlay
                                            muted={isMuted}
                                            loop
                                            playsInline
                                            className="w-full h-full object-cover rounded-[1.75rem]"
                                        />
                                        <button 
                                            onClick={toggleVideoPlayback}
                                            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                                {!isPlaying ? <Play className="w-8 h-8 fill-white ml-1" /> : <div className="w-6 h-6 border-l-4 border-r-4 border-white"></div>}
                                            </div>
                                        </button>
                                        <button 
                                            onClick={toggleMute}
                                            className="absolute bottom-6 right-6 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white backdrop-blur-md transition-all flex items-center justify-center shadow-lg hover:scale-110"
                                            title={isMuted ? "Unmute" : "Mute"}
                                        >
                                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                        </button>
                                    </>
                                ) : (
                                    <img 
                                        src={template.preview_video_url} 
                                        alt={template.name}
                                        className="w-full h-full object-contain rounded-[1.75rem]" 
                                    />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-[1.75rem]">
                                    <span className="text-6xl">{icon}</span>
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{template.name}</h1>
                            <p className="text-zinc-300 leading-relaxed mb-6">{template.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-8">
                                {tags.map((tag) => (
                                    <span key={tag} className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white/90 border border-white/10">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="glass-panel p-6 rounded-2xl">
                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#EC4899]" />
                                    What's included:
                                </h4>
                                <ul className="space-y-3">
                                    {includes.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                            <Check className="w-5 h-5 text-green-400 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT: FORM */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-5"
                    >
                        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                                    <h3 className="text-xl sm:text-2xl font-bold">
                                        Personalize {isImage ? 'Image' : 'Video'}
                                    </h3>
                                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EC4899]">
                                        ₹{Number(template.price).toFixed(2)}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Seedance 2.5 Multi-Slot Image Uploads */}
                                    {isSeedance25 && userSeedanceSlots.length > 0 && (
                                        <div className="space-y-6">
                                            {userSeedanceSlots.map((slot, idx) => (
                                                <div key={slot.slot || idx} className="space-y-2">
                                                    <label className="flex items-center gap-3 text-sm font-semibold mb-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] flex items-center justify-center text-xs">
                                                            {idx + 1}
                                                        </div>
                                                        <span>{slot.label || `Photo ${slot.slot}`}</span>
                                                        <span className="text-[#EC4899]">*</span>
                                                    </label>
                                                    
                                                    <div className="ml-9">
                                                        {slotPreviews[slot.slot] ? (
                                                            <div className="relative w-28 h-28 group">
                                                                <img
                                                                    src={slotPreviews[slot.slot]}
                                                                    alt={slot.label || `Slot ${slot.slot}`}
                                                                    className="w-full h-full object-cover rounded-xl border-2 border-[#7C3AED]"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSlotSelect(slot.slot)}
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <label className="border-2 border-dashed border-white/20 hover:border-[#7C3AED]/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-white/5 block">
                                                                <Upload className="w-6 h-6 mx-auto mb-1 text-zinc-400" />
                                                                <p className="text-sm font-semibold">Upload {slot.label || `Photo ${slot.slot}`}</p>
                                                                <p className="text-xs text-zinc-500 mt-0.5">JPG, PNG, WebP (Max 10MB)</p>
                                                                <input
                                                                    type="file"
                                                                    accept="image/jpeg,image/png,image/webp"
                                                                    className="hidden"
                                                                    onChange={(e) => handleSlotSelect(e, slot.slot)}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Seedance 2.5 Admin Pre-set Assets Preview */}
                                    {isSeedance25 && adminSeedanceSlots.length > 0 && (
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs">
                                            <div className="font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                                                <span>🎨 Included Template Assets (Admin Pre-set)</span>
                                            </div>
                                            <div className="flex gap-3 flex-wrap">
                                                {adminSeedanceSlots.map((slot, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/10">
                                                        {slot.url && <img src={slot.url} alt={slot.label} className="w-8 h-8 rounded object-cover" />}
                                                        <span className="text-zinc-300">{slot.label || `Asset ${slot.slot}`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Seedance 2.5 User Audio Upload */}
                                    {isSeedance25 && allowsUserAudio && (
                                        <div>
                                            <label className="flex items-center gap-3 text-sm font-semibold mb-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] flex items-center justify-center text-xs">
                                                    🎵
                                                </div>
                                                Custom Background Music (Optional)
                                            </label>
                                            <p className="text-xs text-zinc-400 mb-4 ml-9">
                                                Upload your favorite soundtrack or wedding song (MP3, WAV).
                                            </p>

                                            <div className="ml-9">
                                                {userAudioPreview ? (
                                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                                        <audio src={userAudioPreview} controls className="h-8 max-w-[220px]" />
                                                        <button
                                                            type="button"
                                                            onClick={removeAudioSelect}
                                                            className="text-red-400 hover:text-red-300 text-xs font-semibold"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="border-2 border-dashed border-white/20 hover:border-[#7C3AED]/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-white/5 block">
                                                        <Upload className="w-6 h-6 mx-auto mb-1 text-zinc-400" />
                                                        <p className="text-sm font-semibold">Upload MP3 / Audio Track</p>
                                                        <p className="text-xs text-zinc-500 mt-0.5">MP3, WAV, AAC (Max 30MB)</p>
                                                        <input
                                                            ref={userAudioRef}
                                                            type="file"
                                                            accept="audio/mpeg,audio/wav,audio/aac,audio/ogg"
                                                            className="hidden"
                                                            onChange={handleAudioSelect}
                                                        />
                                                    </label>
                                                )}
                                                {audioError && <p className="text-xs text-red-400 mt-2">{audioError}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Standard Image Upload for Veo and Legacy Models */}
                                    {requiresUserImage && (
                                        <div>
                                            <label className="flex items-center gap-3 text-sm font-semibold mb-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] flex items-center justify-center text-xs">
                                                    {requiresUserVideo ? '2' : '1'}
                                                </div>
                                                Your Reference Photo <span className="text-[#EC4899]">*</span>
                                            </label>
                                            <p className="text-xs text-zinc-400 mb-4 ml-9">
                                                Upload a clear photo for {isImage ? 'image' : 'video'} personalization.
                                            </p>

                                            <div className="ml-9">
                                                {userImagePreviews.length > 0 && (
                                                    <div className="flex gap-3 flex-wrap mb-4">
                                                        {userImagePreviews.map((preview, idx) => (
                                                            <div key={idx} className="relative w-20 h-20 group">
                                                                <img src={preview} alt="Upload" className="w-full h-full object-cover rounded-xl border-2 border-[#7C3AED]" />
                                                                <button
                                                                    onClick={() => {
                                                                        setUserImageFiles(prev => prev.filter((_, i) => i !== idx));
                                                                        setUserImagePreviews(prev => prev.filter((_, i) => i !== idx));
                                                                    }}
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {userImageFiles.length < maxUploads && (
                                                    <div 
                                                        onClick={() => userImageRef.current?.click()}
                                                        className="border-2 border-dashed border-white/20 hover:border-[#7C3AED]/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white/5"
                                                    >
                                                        <Upload className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                                                        <p className="text-sm font-semibold">{userImageFiles.length > 0 ? 'Add another photo' : 'Upload photo'}</p>
                                                        <p className="text-xs text-zinc-500 mt-1">JPG, PNG (Max 10MB)</p>
                                                    </div>
                                                )}
                                                <input ref={userImageRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={maxUploads > 1} className="hidden" onChange={handleUserImageSelect} />
                                                {imageUploadError && <p className="text-xs text-red-400 mt-2">{imageUploadError}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Video Upload */}
                                    {requiresUserVideo && (
                                        <div>
                                            <label className="flex items-center gap-3 text-sm font-semibold mb-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] flex items-center justify-center text-xs">
                                                    {requiresUserImage ? '2' : '1'}
                                                </div>
                                                Motion Video <span className="text-[#EC4899]">*</span>
                                            </label>
                                            <p className="text-xs text-zinc-400 mb-4 ml-9">Upload a reference motion video.</p>

                                            <div className="ml-9">
                                                {userVideoPreview ? (
                                                    <div className="relative mb-4">
                                                        <video src={userVideoPreview} controls className="w-full rounded-xl border-2 border-[#7C3AED]" />
                                                        <button
                                                            onClick={() => { setUserVideoFile(null); setUserVideoPreview(''); }}
                                                            className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-md text-white rounded-full p-2 shadow-lg"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div 
                                                        onClick={() => userVideoRef.current?.click()}
                                                        className="border-2 border-dashed border-white/20 hover:border-[#7C3AED]/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white/5"
                                                    >
                                                        <Video className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                                                        <p className="text-sm font-semibold">Upload motion video</p>
                                                        <p className="text-xs text-zinc-500 mt-1">MP4, MOV (Max 100MB)</p>
                                                    </div>
                                                )}
                                                <input ref={userVideoRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleUserVideoSelect} />
                                                {videoUploadError && <p className="text-xs text-red-400 mt-2">{videoUploadError}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Dynamic Inputs */}
                                    {inputSchema.length > 0 && (
                                        <div className={requiresUserImage || requiresUserVideo ? "pt-6 border-t border-white/10" : ""}>
                                            <FormRenderer schema={inputSchema} values={formValues} onChange={setFormValues} />
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
                                        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-zinc-300 leading-relaxed">
                                            <span className="font-semibold text-purple-300">💡 Creative Style Notice:</span> The preview is an example of the expected creative concept. Generated details (such as facial features, expressions, and lighting) will vary based on your uploaded reference photo.
                                        </div>
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleContinue}
                                            className="w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-[#7C3AED]/20 bg-gradient-to-r from-[#7C3AED] to-[#EC4899]"
                                        >
                                            Continue to Payment
                                        </motion.button>
                                        <Link to="/templates" className="w-full">
                                            <button className="w-full py-4 rounded-xl font-medium text-zinc-300 glass-button">
                                                Explore More Templates
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
