import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import FormRenderer from '../components/FormRenderer';
import { fetchTemplateById } from '../lib/api';

export default function TemplateDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formValues, setFormValues] = useState({});
    const [userImageFile, setUserImageFile] = useState(null);
    const [userImagePreview, setUserImagePreview] = useState('');
    const [imageUploadError, setImageUploadError] = useState('');
    const userImageRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        fetchTemplateById(id)
            .then((data) => setTemplate(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="page">
                <div className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px', borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)', width: 32, height: 32 }}></div>
                    <p style={{ color: 'var(--text-tertiary)' }}>Loading template...</p>
                </div>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="page">
                <div className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>Template Not Found</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error || "The template you're looking for doesn't exist."}</p>
                    <Link to="/" className="btn btn-primary">Back to Home</Link>
                </div>
            </div>
        );
    }

    // DB returns snake_case: input_schema, prompt_skeleton
    const isImage = template.template_type === 'image' || template.templateType === 'image';
    const requiresUserImage = !!(template?.allow_user_image_upload);
    const tags = template.tags || [];
    const inputSchema = template.input_schema || [];
    const tagIcons = { 'Wedding': '💍', 'Birthday': '🎂' };
    const matchedTag = tags.find((t) => tagIcons[t]);
    const icon = tagIcons[matchedTag] || (isImage ? '🖼️' : '🎬');

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
    const includes = includesMap[matchedTag] || [
        isImage ? 'AI-generated image content' : 'AI-generated video content',
        'Custom text and details',
        isImage ? 'Premium high-quality output' : 'HD 1080p quality output',
        'Social media ready format',
    ];

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

    const handleContinue = () => {
        const missingRequired = inputSchema
            .filter((f) => f.required && !formValues[f.key])
            .map((f) => f.label);

        if (missingRequired.length > 0) {
            alert(`Please fill in required fields: ${missingRequired.join(', ')}`);
            return;
        }

        if (requiresUserImage && !userImageFile) {
            alert('Please upload your reference photo to proceed.');
            return;
        }

        navigate('/checkout', {
            state: { template, formValues, userImageFile, userImagePreview },
        });
    };

    return (
        <div className="page" id="template-detail-page">
            <div className="container">
                <div className="page-header">
                    <div className="breadcrumb">
                        <Link to="/">Home</Link>
                        <span>/</span>
                        <Link to="/#templates">Templates</Link>
                        <span>/</span>
                        <span>{template.name}</span>
                    </div>
                    <h1 className="page-title">{template.name}</h1>
                    <p className="page-subtitle">{template.description}</p>
                </div>

                <div className="template-detail-grid">
                    {/* Left: Preview */}
                    <div className="template-preview-card">
                        <div className="template-preview-visual" style={{
                            background: template.preview_video_url ? '#000' : undefined,
                            padding: 0,
                            aspectRatio: isImage ? '4/5' : (tags.includes('9:16') ? '9/16' : '16/9')
                        }}>
                            {template.preview_video_url ? (
                                template.preview_video_url.match(/\.(mp4|webm|mov|avi|m4v|ogv)(\?.*)?$/i) ? (
                                    <video
                                        src={template.preview_video_url}
                                        controls
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        preload="auto"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <img 
                                        src={template.preview_video_url} 
                                        alt={template.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
                                    />
                                )
                            ) : (
                                <span style={{ fontSize: '4rem', position: 'relative', zIndex: 1 }}>{icon}</span>
                            )}
                        </div>
                        <div className="template-preview-info">
                            <h3 className="template-preview-title">{template.name}</h3>
                            <p className="template-preview-desc">{template.description}</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                                {tags.map((tag) => (
                                    <span className="tag" key={tag}>{tag}</span>
                                ))}
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 16 }}>
                                ₹{Number(template.price).toFixed(2)}
                            </div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>What's included:</h4>
                            <ul className="template-includes">
                                {includes.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="template-form-card">
                        <h3 className="template-form-title">✏️ {isImage ? 'Personalize Your Image' : 'Personalize Your Video'}</h3>

                        {/* User Reference Image Upload (when template requires it) */}
                        {requiresUserImage && (
                            <div className="form-group" style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border-color)' }}>
                                <label className="form-label">
                                    📸 Your Reference Photo <span className="required">*</span>
                                </label>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                                    This photo will be used to personalize your {isImage ? 'image' : 'video'}. Please upload a clear photo.
                                </p>

                                {userImagePreview ? (
                                    <div style={{ position: 'relative', maxWidth: 160, marginBottom: 8 }}>
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
                                        onClick={() => userImageRef.current?.click()}
                                        style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', transition: 'all 0.2s' }}
                                    >
                                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🤳</div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>Click to upload photo</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>JPG, PNG, WebP — Max 10MB</p>
                                    </div>
                                )}

                                <input
                                    ref={userImageRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    style={{ display: 'none' }}
                                    onChange={handleUserImageSelect}
                                />

                                {imageUploadError && (
                                    <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: 8 }}>⚠️ {imageUploadError}</p>
                                )}
                            </div>
                        )}

                        <FormRenderer
                            schema={inputSchema}
                            values={formValues}
                            onChange={setFormValues}
                        />
                        <div className="template-form-buttons">
                            <Link to="/" className="btn btn-outline" style={{ flex: '0 0 auto' }}>← Back to Templates</Link>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleContinue}>
                                Continue to Payment →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
