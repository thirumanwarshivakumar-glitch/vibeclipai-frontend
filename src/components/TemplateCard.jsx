import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';

export default function TemplateCard({ template }) {
    const name = template.name;
    const description = template.description;
    const tags = template.tags || [];
    const price = template.price;
    const id = template.id;
    const previewVideoUrl = template.preview_video_url;

    const videoRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    const tagIcons = { 'Wedding': '💍', 'Birthday': '🎂' };
    const matchedTag = tags.find((t) => tagIcons[t]);
    const icon = tagIcons[matchedTag] || '🎬';

    // Use 4:5 for image templates, square 1:1 for videos
    const isImage = template.template_type === 'image' || template.templateType === 'image';
    const aspectRatio = isImage ? '4/5' : '1/1';

    const handleMouseEnter = () => {
        setIsHovering(true);
        if (videoRef.current) {
            videoRef.current.play().catch(() => { });
        }
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    return (
        <div
            className="template-card"
            id={`template-card-${id}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="template-card-preview"
                style={{
                    background: previewVideoUrl ? '#000' : undefined,
                    aspectRatio: aspectRatio
                }}
            >
                {previewVideoUrl ? (
                    <>
                        {previewVideoUrl.match(/\.(mp4|webm|mov|avi|m4v|ogv)(\?.*)?$/i) ? (
                            <video
                                ref={videoRef}
                                src={previewVideoUrl}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    display: 'block',
                                }}
                            />
                        ) : (
                            <img
                                src={previewVideoUrl}
                                alt={name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    display: 'block',
                                }}
                            />
                        )}
                        {!isHovering && previewVideoUrl.match(/\.(mp4|webm|mov|avi|m4v|ogv)(\?.*)?$/i) && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(0,0,0,0.25)',
                                transition: 'opacity 0.3s ease',
                            }}>
                                <div style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(6px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                }}>
                                    ▶
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <span className="template-card-preview-icon">{icon}</span>
                )}
            </div>
            <div className="template-card-body">
                <h3 className="template-card-title">{name}</h3>
                <p className="template-card-subtitle">{description}</p>
                <div className="template-card-tags">
                    {tags.map((tag) => (
                        <span className="tag" key={tag}>{tag}</span>
                    ))}
                </div>
                <div className="template-card-footer">
                    <span className="template-card-price">₹{Number(price).toFixed(2)}</span>
                    <Link to={`/template/${id}`} className="btn btn-primary btn-sm">
                        Use Template
                    </Link>
                </div>
            </div>
        </div>
    );
}
