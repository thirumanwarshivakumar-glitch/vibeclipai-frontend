import { useState, useRef } from 'react';
import { uploadPreviewVideo, removePreviewVideo } from '../lib/api';

export default function VideoUploader({ template, onUploadComplete }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const videoUrl = template?.preview_video_url;
    const videoKey = template?.preview_video_key;

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a video or image file (MP4, WebM, MOV, AVI, JPG, PNG, WEBP).');
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
            const updated = await uploadPreviewVideo(template.id, file);
            setProgress('Upload complete!');
            if (onUploadComplete) onUploadComplete(updated);
        } catch (err) {
            setError(err.message || 'Upload failed');
            setProgress('');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = async () => {
        if (!videoKey) return;
        if (!confirm('Remove this preview media?')) return;

        setUploading(true);
        setError(null);
        try {
            const updated = await removePreviewVideo(template.id, videoKey);
            if (onUploadComplete) onUploadComplete(updated);
        } catch (err) {
            setError(err.message || 'Failed to remove video');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="video-uploader">
            <label className="form-label" style={{ marginBottom: 12 }}>
                Sample Preview Media
            </label>

            {/* Current video preview */}
            {videoUrl && (
                <div style={{
                    marginBottom: 16,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    background: '#000',
                }}>
                    {videoUrl.match(/\.(mp4|webm|mov|avi)$/i) ? (
                        <video
                            src={videoUrl}
                            controls
                            style={{ width: '100%', maxHeight: 240, display: 'block' }}
                            preload="metadata"
                        />
                    ) : (
                        <img 
                            src={videoUrl} 
                            alt="Template Preview" 
                            style={{ width: '100%', maxHeight: 240, objectFit: 'contain', display: 'block' }} 
                        />
                    )}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.8rem',
                    }}>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            ✓ Preview media uploaded
                        </span>
                        <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)', fontSize: '0.8rem' }}
                            onClick={handleRemove}
                            disabled={uploading}
                        >
                            🗑️ Remove
                        </button>
                    </div>
                </div>
            )}

            {/* Upload area */}
            <div
                style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: videoUrl ? '16px' : '32px 16px',
                    textAlign: 'center',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-fast)',
                    background: 'var(--bg-secondary)',
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
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,image/jpeg,image/png,image/webp"
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
                            width: 28,
                            height: 28,
                        }}></div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                            {progress}
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎬🖼️</div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                            {videoUrl ? 'Replace preview media' : 'Upload sample media'}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            Drag & drop or click to browse · MP4, WebM, MOV, JPG, PNG, WEBP · Max 100MB
                        </p>
                    </>
                )}
            </div>

            {error && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: 8 }}>
                    ⚠️ {error}
                </p>
            )}
        </div>
    );
}
