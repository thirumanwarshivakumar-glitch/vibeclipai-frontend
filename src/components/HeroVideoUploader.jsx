import { useState, useRef, useEffect } from 'react';
import { uploadHeroVideo, removeHeroVideo, getSiteConfig } from '../lib/api';

export default function HeroVideoUploader() {
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchUrl = async () => {
            try {
                const url = await getSiteConfig('hero_video_url');
                setVideoUrl(url);
            } catch (err) {
                console.error('Failed to fetch hero video:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUrl();
    }, []);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a video file (MP4, WebM, MOV, AVI).');
            return;
        }

        // Validate size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            setError('File size must be under 100MB.');
            return;
        }

        setUploading(true);
        setError(null);
        setProgress('Uploading...');

        try {
            const result = await uploadHeroVideo(file);
            setProgress('Upload complete!');
            setVideoUrl(result.url);
        } catch (err) {
            setError(err.message || 'Upload failed');
            setProgress('');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = async () => {
        if (!confirm('Remove the hero preview video?')) return;

        setUploading(true);
        setError(null);
        try {
            await removeHeroVideo();
            setVideoUrl(null);
        } catch (err) {
            setError(err.message || 'Failed to remove video');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: 20, textAlign: 'center' }}>Loading Hero Settings...</div>;
    }

    return (
        <div className="hero-video-uploader" style={{
            background: 'var(--bg-secondary)',
            padding: 24,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            marginBottom: 32,
        }}>
            <h3 style={{ marginBottom: 16 }}>Home Page Hero Video</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                This video will be displayed in the "Preview" frame on the home page hero section.
            </p>

            {/* Current video preview */}
            {videoUrl && (
                <div style={{
                    marginBottom: 20,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    background: '#000',
                }}>
                    <video
                        src={videoUrl}
                        controls
                        style={{ width: '100%', maxHeight: 300, display: 'block' }}
                        preload="metadata"
                    />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        background: 'var(--bg-tertiary)',
                        fontSize: '0.85rem',
                    }}>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            ✓ Hero video is active
                        </span>
                        <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={handleRemove}
                            disabled={uploading}
                        >
                            🗑️ Reset to Default
                        </button>
                    </div>
                </div>
            )}

            {/* Upload area */}
            <div
                style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '32px 16px',
                    textAlign: 'center',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-fast)',
                    background: 'var(--bg-primary)',
                    opacity: uploading ? 0.6 : 1,
                }}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    const file = e.dataTransfer.files?.[0];
                    if (file && fileInputRef.current) {
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        fileInputRef.current.files = dt.files;
                        handleFileSelect({ target: { files: dt.files } });
                    }
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    disabled={uploading}
                />

                {uploading ? (
                    <>
                        <div className="spinner" style={{
                            margin: '0 auto 12px',
                            borderColor: 'var(--border-color)',
                            borderTopColor: 'var(--accent-primary)',
                            width: 32,
                            height: 32,
                        }}></div>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                            {progress}
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎬</div>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                            {videoUrl ? 'Replace Home Hero Video' : 'Upload Home Hero Video'}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                            Drag & drop or click to browse · MP4, WebM, MOV · Max 100MB
                        </p>
                    </>
                )}
            </div>

            {error && (
                <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: 12 }}>
                    ⚠️ {error}
                </p>
            )}
        </div>
    );
}
