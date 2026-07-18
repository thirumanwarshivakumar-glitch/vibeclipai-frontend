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

    // Use 4:5 for image templates, square 1:1 for videos
    const isImage = template.template_type === 'image' || template.templateType === 'image';
    const aspectRatio = isImage ? '4/5' : '1/1';

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateY = ((x - centerX) / centerX) * 8;
            const rotateX = ((y - centerY) / centerY) * -8;

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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            className="flex justify-center"
            onMouseEnter={handleMouseEnterCard}
            onMouseLeave={handleMouseLeaveCard}
        >
            <div 
                ref={cardRef} 
                className="w-full max-w-sm rounded-3xl p-4 sm:p-6 text-white shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/10 transition-transform duration-200 ease-out group"
                style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
                    backdropFilter: "blur(20px)",
                    transformStyle: "preserve-3d"
                }}
            >
                {/* Media Preview */}
                <div 
                    className="w-full rounded-2xl bg-[#111115] mb-6 overflow-hidden relative group-hover:ring-2 ring-[#7C3AED]/50 transition-all flex items-center justify-center" 
                    style={{ transform: "translateZ(30px)", aspectRatio: aspectRatio }}
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
                            className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                    ) : (
                        <img 
                            src={previewImage || previewVideoUrl} 
                            alt={name}
                            className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-xs font-semibold text-white/90">
                            {category}
                        </span>
                    </div>

                    {/* Play Overlay */}
                    {!isHovering && isVideoFile && (
                        <div className="absolute inset-0 flex items-center justify-center transition-opacity">
                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <Play className="w-6 h-6 text-white ml-1 fill-white" />
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Info block */}
                <div style={{ transform: "translateZ(40px)" }}>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight truncate">{name}</h3>
                    <p className="text-purple-100/60 text-sm mb-6 line-clamp-2 min-h-[40px]">{description}</p>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-white bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md">₹{Number(price).toFixed(2)}</span>
                        <Link to={`/template/${id}`}>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-sm font-semibold shadow-lg shadow-purple-500/20"
                            >
                                Use Template
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
