import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@insforge/react';
import TemplateEditor from '../components/TemplateEditor';
import VideoUploader from '../components/VideoUploader';
import HeroVideoUploader from '../components/HeroVideoUploader';
import {
    fetchAllTemplatesAdmin,
    createTemplate,
    updateTemplate,
    toggleTemplateStatus,
} from '../lib/api';

export default function AdminPage() {
    const { user, isLoaded } = useUser();
    const [templatesList, setTemplatesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showEditor, setShowEditor] = useState(false);
    const [videoUploadTemplate, setVideoUploadTemplate] = useState(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'settings'

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await fetchAllTemplatesAdmin();
            setTemplatesList(data || []);
        } catch (err) {
            console.error('Failed to load templates:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const filtered = templatesList.filter(
        (t) =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            (t.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    );

    const handleAdd = () => {
        setEditingTemplate(null);
        setShowEditor(true);
    };

    const handleEdit = (template) => {
        setEditingTemplate({
            ...template,
            imagePromptSkeleton: template.image_prompt_skeleton || '',
            videoPromptSkeleton: template.video_prompt_skeleton || '',
            inputSchema: template.input_schema || [],
            referenceImageUrl: template.reference_image_url || '',
        });
        setShowEditor(true);
    };

    const handleDuplicate = async (template) => {
        setSaving(true);
        try {
            await createTemplate({
                name: `${template.name} (Copy)`,
                description: template.description,
                tags: template.tags || [],
                price: template.price,
                imagePromptSkeleton: template.image_prompt_skeleton || '',
                videoPromptSkeleton: template.video_prompt_skeleton || '',
                inputSchema: template.input_schema || [],
                status: 'draft',
            });
            await loadTemplates();
        } catch (err) {
            console.error('Failed to duplicate:', err);
            alert('Failed to duplicate template.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
        try {
            await toggleTemplateStatus(id, newStatus);
            await loadTemplates();
        } catch (err) {
            console.error('Failed to toggle status:', err);
            alert('Failed to update template status.');
        }
    };

    const handleSave = async (formData) => {
        setSaving(true);
        try {
            if (editingTemplate?.id) {
                await updateTemplate(editingTemplate.id, formData);
            } else {
                await createTemplate(formData);
            }
            setShowEditor(false);
            await loadTemplates();
        } catch (err) {
            console.error('Failed to save template:', err);
            alert('Failed to save template.');
        } finally {
            setSaving(false);
        }
    };

    const handleVideoUploadComplete = (updatedTemplate) => {
        setTemplatesList((prev) =>
            prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
        );
        setVideoUploadTemplate(updatedTemplate);
    };

    const getCategoryTag = (tags) => {
        const categories = ['Wedding', 'Birthday', 'Cinematic', 'Fun'];
        return (tags || []).find((t) => categories.includes(t)) || (tags || [])[0] || 'General';
    };

    if (!isLoaded) {
        return <div className="page" style={{ textAlign: 'center', padding: 100 }}>Loading...</div>;
    }

    if (user?.email !== 'thirumanwarshivakumar@gmail.com') {
        return (
            <div className="page" style={{ textAlign: 'center', padding: 100 }}>
                <h1>Access Denied</h1>
                <p>You do not have permission to view this page.</p>
                <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="page" id="admin-page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Template Manager</h1>
                    <p className="page-subtitle">Manage your video invitation templates</p>
                </div>

                <div className="admin-tabs" style={{ display: 'flex', gap: 20, marginBottom: 30, borderBottom: '1px solid var(--border-color)' }}>
                    <button 
                        className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
                        onClick={() => setActiveTab('templates')}
                        style={{
                            padding: '12px 20px',
                            border: 'none',
                            background: 'none',
                            color: activeTab === 'templates' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                            borderBottom: activeTab === 'templates' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Templates
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                        style={{
                            padding: '12px 20px',
                            border: 'none',
                            background: 'none',
                            color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                            borderBottom: activeTab === 'settings' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Site Settings
                    </button>
                </div>

                {activeTab === 'settings' && (
                    <div className="admin-settings-section">
                        <HeroVideoUploader />
                    </div>
                )}

                {activeTab === 'templates' && (
                    <>
                        <div className="admin-toolbar">
                            <div className="admin-search">
                                <span>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <button className="btn btn-primary" onClick={handleAdd}>
                                + Add Template
                            </button>
                        </div>

                        <div className="admin-table-wrapper">
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>
                                    <div className="spinner" style={{ margin: '0 auto 16px', borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)', width: 32, height: 32 }}></div>
                                    Loading templates...
                                </div>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Preview</th>
                                            <th>Category</th>
                                            <th>Type</th>
                                            <th>Price</th>
                                            <th>Status</th>
                                            <th>Updated</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                                                    No templates found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((t) => (
                                                <tr key={t.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                            {t.description}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {t.preview_video_url ? (
                                                            <div style={{
                                                                width: 80,
                                                                height: 50,
                                                                borderRadius: 'var(--radius-sm)',
                                                                overflow: 'hidden',
                                                                background: '#000',
                                                                position: 'relative',
                                                                cursor: 'pointer',
                                                            }}
                                                                 onClick={() => setVideoUploadTemplate(t)}
                                                            >
                                                                {t.preview_video_url.match(/\.(mp4|webm|mov|avi)$/i) ? (
                                                                    <video
                                                                        src={t.preview_video_url}
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        muted
                                                                        preload="metadata"
                                                                    />
                                                                ) : (
                                                                    <img 
                                                                        src={t.preview_video_url} 
                                                                        alt="Preview" 
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                                    />
                                                                )}
                                                                {t.preview_video_url.match(/\.(mp4|webm|mov|avi)$/i) && (
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        inset: 0,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        background: 'rgba(0,0,0,0.3)',
                                                                        color: 'white',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 600,
                                                                    }}>
                                                                        ▶
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                                                onClick={() => setVideoUploadTemplate(t)}
                                                            >
                                                                📎 Upload
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="tag">{getCategoryTag(t.tags)}</span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem' }}>
                                                        {t.template_type === 'image' ? '🖼️ Image' : '🎬 Video'}
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>₹{Number(t.price).toFixed(2)}</td>
                                                    <td>
                                                        <span className={`tag ${t.status === 'active' ? 'tag-success' : t.status === 'draft' ? 'tag-warning' : 'tag-danger'}`}>
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                                        {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td>
                                                        <div className="admin-actions">
                                                            <button
                                                                className="admin-action-btn"
                                                                title="Edit"
                                                                onClick={() => handleEdit(t)}
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                className="admin-action-btn"
                                                                title="Upload Preview Media"
                                                                onClick={() => setVideoUploadTemplate(t)}
                                                            >
                                                                🎬
                                                            </button>
                                                            <button
                                                                className="admin-action-btn"
                                                                title="Duplicate"
                                                                onClick={() => handleDuplicate(t)}
                                                                disabled={saving}
                                                            >
                                                                📋
                                                            </button>
                                                            <button
                                                                className={`admin-action-btn${t.status === 'active' ? ' danger' : ''}`}
                                                                title={t.status === 'active' ? 'Disable' : 'Enable'}
                                                                onClick={() => handleToggleStatus(t.id, t.status)}
                                                            >
                                                                {t.status === 'active' ? '⏸️' : '▶️'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Template Editor Modal */}
            {showEditor && (
                <TemplateEditor
                    template={editingTemplate}
                    onSave={handleSave}
                    onClose={() => setShowEditor(false)}
                />
            )}

            {/* Media Upload Modal */}
            {videoUploadTemplate && (
                <div className="modal-overlay" onClick={() => setVideoUploadTemplate(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Preview Media</h2>
                            <button className="modal-close" onClick={() => setVideoUploadTemplate(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                                Upload a sample preview media for <strong>{videoUploadTemplate.name}</strong>. This will be shown to users browsing templates.
                            </p>
                            <VideoUploader
                                template={videoUploadTemplate}
                                onUploadComplete={handleVideoUploadComplete}
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setVideoUploadTemplate(null)}>Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
