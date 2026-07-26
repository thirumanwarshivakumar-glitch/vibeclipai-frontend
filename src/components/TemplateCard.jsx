import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';

export default function TemplateCard({ template, delay = 0 }) {
    const name = template.name || template.title;
    const price = template.price;
    const id = template.id;
    const previewVideoUrl = template.preview_video_url;
    const category = template.category || (template.tags && template.tags[0]) || 'General';
    const previewImage = template.preview_image || template.image;

    const cardRef = useRef(null);
    const videoRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    // Approach 1: Dedicated Format Handling for Video vs Image Templates
    const isImage = template.template_type === 'image' || template.templateType === 'image';
    const isVideoFile = !isImage;
    
    const getCardAspectRatio = () => {
        if (isImage) return '4/5';
        
        if (template.aspect_ratio || template.aspectRatio) {
            const raw = (template.aspect_ratio || template.aspectRatio).replace(':', '/');
            if (raw === '9/16') return '4/5';
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay * 0.05 }}
            className="h-full flex flex-col justify-between group"
            onMouseEnter={() => {
                setIsHovering(true);
                if (videoRef.current) {
                    videoRef.current.play().catch(() => {});
                }
            }}
            onMouseLeave={() => {
                setIsHovering(false);
                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0;
                }
            }}
        >
            <div className="relative w-full h-full flex flex-col justify-between">
                <Link to={`/template/${id}`} className="block w-full h-full flex flex-col">
                    <div 
                        ref={cardRef}
                        className="glass-card rounded-2xl overflow-hidden relative border border-white/10 transition-all duration-300 group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] flex flex-col justify-between w-full h-full"
                        style={{ transformStyle: 'preserve-3d', aspectRatio: aspectRatio }}
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
                                className="w-full h-full object-cover object-top relative z-10 opacity-95 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500 ease-out"
                            />
                        )}
                        
                        <div className={`absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/40 pointer-events-none z-10 ${
                            isImage ? 'hidden sm:block' : 'block'
                        }`} />
                        
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20">
                            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[9px] sm:text-[10px] font-semibold text-white/90 shadow-sm">
                                {category}
                            </span>
                        </div>

                        {isImage && (
                            <div className="sm:hidden absolute top-2 right-2 z-20">
                                <span className="px-2 py-0.5 rounded-full bg-black/75 border border-white/20 backdrop-blur-md text-[10px] font-bold text-white shadow-md">
                                    ₹{Number(price).toFixed(2)}
                                </span>
                            </div>
                        )}

                        {!isHovering && isVideoFile && (
                            <div className="absolute inset-0 flex items-center justify-center transition-opacity z-20 pointer-events-none">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white ml-0.5 fill-white" />
                                </div>
                            </div>
                        )}

                        <div 
                            className={`absolute bottom-0 inset-x-0 p-2.5 sm:p-3.5 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/85 to-transparent backdrop-blur-md border-t border-white/10 z-20 transition-all duration-300 flex-col justify-end ${
                                isImage 
                                    ? 'hidden sm:flex sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:pointer-events-none sm:group-hover:pointer-events-auto' 
                                    : 'flex opacity-100 translate-y-0 pointer-events-auto sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:pointer-events-none sm:group-hover:pointer-events-auto'
                            }`}
                            style={{ transform: "translateZ(30px)" }}
                        >
                            <h3 className="text-[11px] sm:text-sm font-semibold tracking-tight truncate text-white/95 mb-1.5 sm:mb-2" title={name}>
                                {name}
                            </h3>
                            
                            <div className="flex justify-between items-center gap-1">
                                <span className="text-[10px] sm:text-xs font-bold text-white bg-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md backdrop-blur-md border border-white/10">
                                    ₹{Number(price).toFixed(2)}
                                </span>
                                <button 
                                    className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-[10px] sm:text-xs font-semibold shadow-md shadow-purple-500/20 whitespace-nowrap"
                                >
                                    Use Template
                                </button>
                            </div>
                        </div>
                    </div>

                    {isImage && (
                        <div className="sm:hidden mt-2 px-1 flex items-center justify-between gap-1 z-20">
                            <h3 className="text-[11px] font-medium tracking-tight text-white/90 truncate max-w-[85%]" title={name}>
                                {name}
                            </h3>
                            <div className="flex items-center text-violet-400 shrink-0">
                                <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    )}
                </Link>
            </div>
        </motion.div>
    );
}
