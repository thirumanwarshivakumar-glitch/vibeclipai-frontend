import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export default function TemplateCard({ template, delay = 0 }) {
    const name = template.name || template.title;
    const description = template.description;
    const price = template.price;
    const id = template.id;
    const previewVideoUrl = template.preview_video_url;
    // We now have a dedicated category column from our schema change. Fallback to tags[0] just in case.
    const category = template.category || (template.tags && template.tags[0]) || 'General';
    const previewImage = template.preview_image || template.image;

    const cardRef = useRef(null);
    const videoRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    // Approach 1: Dedicated Format Handling for Video vs Image Templates
    const isImage = template.template_type === 'image' || template.templateType === 'image';
    
    const getCardAspectRatio = () => {
        if (isImage) return '4/5'; // Image Template View: UNTOUCHED & PROPER
        
        // Video Template Format Detection
        if (template.aspect_ratio || template.aspectRatio) {
            const raw = (template.aspect_ratio || template.aspectRatio).replace(':', '/');
            if (raw === '9/16') return '4/5'; // Use sleek 4/5 portrait box for Shorts/Reels
            return raw;
        }
        const titleLower = (name || '').toLowerCase();
        if (titleLower.includes('airport') || titleLower.includes('siddhi') || titleLower.includes('cinematic golden') || titleLower.includes('landscape') || titleLower.includes('16:9')) {
            return '16/9';
        }
        if (titleLower.includes('reels') || titleLower.includes('tiktok') || titleLower.includes('shorts') || titleLower.includes('9:16') || titleLower.includes('kling') || titleLower.includes('rebel') || titleLower.includes('name reveal')) {
            return '4/5';
        }
        return '1/1';
    };

    const aspectRatio = getCardAspectRatio();

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateY = ((x - centerX) / centerX) * 6;
            const rotateX = ((y - centerY) / centerY) * -6;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        };

        const handleMouseLeave = () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        };

        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            card.removeEventListener('mousemove', handleMouseMove);
            card.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const handleMouseEnterCard = () => {
        setIsHovering(true);
        if (videoRef.current) {
            videoRef.current.play().catch(() => { });
        }
    };

    const handleMouseLeaveCard = () => {
        setIsHovering(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    const isVideoFile = previewVideoUrl && previewVideoUrl.match(/\.(mp4|webm|mov|avi|m4v|ogv)(\?.*)?$/i);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className="flex justify-center h-full w-full"
            onMouseEnter={handleMouseEnterCard}
            onMouseLeave={handleMouseLeaveCard}
        >
            {/* Approach A: Uniform 4:5 Outer Card Shell for 100% Row Baseline Alignment */}
            <div 
                ref={cardRef} 
                className="w-full aspect-[4/5] rounded-2xl overflow-hidden text-white shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/10 transition-transform duration-200 ease-out group relative flex flex-col justify-between bg-[#0a0a0d] h-full"
                style={{
                    backdropFilter: "blur(20px)",
                    transformStyle: "preserve-3d"
                }}
            >
                {/* Ambient Blurred Background Copy (Fills 16:9 top/bottom space with glowing video aura) */}
                <img 
                    src={previewImage || previewVideoUrl} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none z-0 transition-opacity duration-500"
                />

                {/* Media Preview Container - Stage */}
                <div 
                    className="w-full h-full relative overflow-hidden bg-black/30 flex items-center justify-center group-hover:ring-1 ring-[#7C3AED]/40 transition-all z-10" 
                    style={{ transform: "translateZ(20px)" }}
                >
                    {isVideoFile ? (
                        <video
                            ref={videoRef}
                            src={previewVideoUrl}
                            muted
                            loop
                            autoPlay
                            playsInline
                            preload="metadata"
                            className={`w-full h-full relative z-10 opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500 ease-out ${
                                aspectRatio === '16/9' ? 'object-contain' : 'object-cover object-top'
                            }`}
                        />
                    ) : (
                        <img 
                            src={previewImage || previewVideoUrl} 
                            alt={name}
                            className="w-full h-full object-cover object-top relative z-10 opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500 ease-out"
                        />
                    )}
                    
                    {/* Dark gradient scrim for overlay text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/40 pointer-events-none z-10" />
                    
                    {/* Category Badge - Top Left Overlay */}
                    <div className="absolute top-3 left-3 z-20">
                        <span className="px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-semibold text-white/90 shadow-sm">
                            {category}
                        </span>
                    </div>

                    {/* Play Overlay */}
                    {!isHovering && isVideoFile && (
                        <div className="absolute inset-0 flex items-center justify-center transition-opacity z-20 pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                                <Play className="w-4 h-4 text-white ml-0.5 fill-white" />
                            </div>
                        </div>
                    )}

                    {/* Floating Glass Overlay Footer (Video Templates: Hover Reveal | Image Templates: Untouched Static) */}
                    <div 
                        className={`absolute bottom-0 inset-x-0 p-3 sm:p-3.5 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/85 to-transparent backdrop-blur-md border-t border-white/10 z-20 transition-all duration-300 flex flex-col justify-end ${
                            !isImage 
                                ? 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto' 
                                : ''
                        }`}
                        style={{ transform: "translateZ(30px)" }}
                    >
                        <h3 className="text-xs sm:text-sm font-semibold tracking-tight truncate text-white/95 mb-2" title={name}>
                            {name}
                        </h3>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-md border border-white/10">
                                ₹{Number(price).toFixed(2)}
                            </span>
                            <Link to={`/template/${id}`}>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-semibold shadow-md shadow-purple-500/20"
                                >
                                    Use Template
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
