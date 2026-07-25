import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, Edit2, Trash2, Video, Image as ImageIcon, Search, Settings, LayoutGrid } from 'lucide-react';
import VideoTemplateEditor from '../components/VideoTemplateEditor';
import ImageTemplateEditor from '../components/ImageTemplateEditor';
import VideoUploader from '../components/VideoUploader';
import HeroVideoUploader from '../components/HeroVideoUploader';
import {
    fetchAllTemplatesAdmin,
    createTemplate,
    updateTemplate,
    toggleTemplateStatus,
    deleteTemplate,
} from '../lib/api';

export default function AdminPage() {
    const { user, isLoaded } = useUser();
    const [templatesList, setTemplatesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [editorType, setEditorType] = useState(null); // 'video' or 'image'
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
        if (isLoaded && user?.email === 'thirumanwarshivakumar@gmail.com') {
            loadTemplates();
        }
    }, [isLoaded, user]);

    const filtered = templatesList.filter(
        (t) =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            (t.category || '').toLowerCase().includes(search.toLowerCase()) ||
            (t.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    );

    const handleAddVideo = () => {
        setEditingTemplate(null);
        setEditorType('video');
    };

    const handleAddImage = () => {
        setEditingTemplate(null);
        setEditorType('image');
    };

    const handleEdit = (template) => {
        setEditingTemplate({
            ...template,
            imagePromptSkeleton: template.image_prompt_skeleton || '',
            videoPromptSkeleton: template.video_prompt_skeleton || '',
            inputSchema: template.input_schema || [],
            referenceImageUrl: template.reference_image_url || '',
        });
        setEditorType(template.template_type === 'image' ? 'image' : 'video');
    };

    const handleDuplicate = async (template) => {
        setSaving(true);
        try {
            await createTemplate({
                name: `${template.name} (Copy)`,
                template_type: template.template_type || template.templateType || 'image',
                description: template.description,
                category: template.category || '',
                tags: template.tags || [],
                price: template.price,
                imagePromptSkeleton: template.image_prompt_skeleton || '',
                videoPromptSkeleton: template.video_prompt_skeleton || '',
                inputSchema: template.input_schema || [],
                status: 'draft',
                ai_model: template.ai_model || (template.template_type === 'image' ? 'midjourney' : 'veo_3_1'),
                generation_mode: template.generation_mode || (template.template_type === 'image' ? 'text-to-image' : 'text-to-video'),
                default_aspect_ratio: template.default_aspect_ratio || '16:9',
                reference_images: template.reference_images || '[]',
                reference_image_url: template.reference_image_url || '',
                max_user_uploads: template.max_user_uploads || 1,
                music_prompt: template.music_prompt || '',
                negative_prompt: template.negative_prompt || '',
                quality: template.quality || 'high',
                video_duration: template.video_duration || '5',
                video_fps: template.video_fps || '24',
                seed: null,
                currency: template.currency || 'INR',
                allow_user_image_upload: template.allow_user_image_upload !== undefined ? template.allow_user_image_upload : (template.template_type === 'image'),
                allow_user_video_upload: template.allow_user_video_upload !== undefined ? template.allow_user_video_upload : (template.template_type === 'video'),
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

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
            return;
        }
        try {
            await deleteTemplate(id);
            await loadTemplates();
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Failed to delete template.');
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
            setEditorType(null);
            await loadTemplates();
        } catch (err) {
            console.error('Failed to save template:', err);
            alert('Failed to save template: ' + err.message);
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

    if (!isLoaded) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (user?.email !== 'thirumanwarshivakumar@gmail.com') {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center text-center">
                <div className="glass-panel p-10 rounded-[2rem] max-w-md w-full">
                    <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-zinc-400 mb-6">You do not have administrative privileges.</p>
                    <Link to="/">
                        <button className="glass-button w-full px-6 py-3 rounded-full text-white font-semibold">Back to Home</button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-24 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Admin Dashboard</h1>
                        <p className="text-zinc-400">Manage templates, categories, and settings</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-white/10 mb-8">
                    <button 
                        className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors relative ${activeTab === 'templates' ? 'text-[#7C3AED]' : 'text-zinc-400 hover:text-white'}`}
                        onClick={() => setActiveTab('templates')}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Templates
                        {activeTab === 'templates' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED]" />
                        )}
                    </button>
                    <button 
                        className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors relative ${activeTab === 'settings' ? 'text-[#7C3AED]' : 'text-zinc-400 hover:text-white'}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings className="w-4 h-4" />
                        Settings & Video Config
                        {activeTab === 'settings' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED]" />
                        )}
                    </button>
                </div>

                {activeTab === 'templates' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="relative w-full sm:max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, category, or tag..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button className="glass-button px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 flex-1 sm:flex-none" onClick={handleAddVideo}>
                                    <Video className="w-4 h-4" /> Add Video
                                </button>
                                <button className="glass-button px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 flex-1 sm:flex-none" onClick={handleAddImage}>
                                    <ImageIcon className="w-4 h-4" /> Add Image
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-zinc-500">Loading templates...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {filtered.map((t) => (
                                        <motion.div
                                            key={t.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="glass-panel rounded-2xl overflow-hidden flex flex-col group"
                                        >
                                            <div className="relative h-40 bg-zinc-900 overflow-hidden">
                                                {t.preview_video_url ? (
                                                    t.template_type === 'image' ? (
                                                        <img
                                                            src={t.preview_video_url}
                                                            alt={t.name}
                                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                        />
                                                    ) : (
                                                        <video
                                                            src={t.preview_video_url}
                                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                            muted loop playsInline
                                                            onMouseEnter={(e) => e.target.play().catch(()=>{})}
                                                            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                                                        />
                                                    )
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/50">
                                                        {t.template_type === 'image' ? <ImageIcon className="w-8 h-8 mb-2" /> : <Video className="w-8 h-8 mb-2" />}
                                                        <span className="text-xs font-medium">No Preview</span>
                                                    </div>
                                                )}
                                                
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${t.template_type === 'image' ? 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/30' : 'bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30'}`}>
                                                        {t.template_type}
                                                    </span>
                                                    {t.is_favorite && (
                                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                                            Trending
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${t.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></span>
                                                </div>

                                                {/* Upload Preview Button Overlay */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => setVideoUploadTemplate(t)}
                                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-semibold backdrop-blur-md transition-colors flex items-center gap-2"
                                                    >
                                                        <Video className="w-4 h-4" />
                                                        Upload Preview
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-5 flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-lg leading-tight truncate pr-2">{t.name}</h3>
                                                    <span className="text-sm font-semibold text-[#EC4899] whitespace-nowrap">
                                                        {Number(t.price) === 0 ? 'Free' : `₹${t.price}`}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-xs text-zinc-400 mb-3 truncate">
                                                    Cat: <span className="text-zinc-300">{t.category || 'General'}</span>
                                                </p>

                                                <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                                                    <button onClick={() => handleEdit(t)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors">
                                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button onClick={() => handleDuplicate(t)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors">
                                                        <Copy className="w-3.5 h-3.5" /> Copy
                                                    </button>
                                                </div>

                                                <div className="mt-2 flex gap-2">
                                                    <button 
                                                        onClick={() => handleToggleStatus(t.id, t.status)} 
                                                        className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${t.status === 'active' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20'}`}
                                                    >
                                                        {t.status === 'active' ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button onClick={() => handleDelete(t.id, t.name)} className="w-10 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg flex items-center justify-center text-red-400 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {filtered.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-zinc-500">
                                        No templates found matching your search.
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="glass-panel p-8 rounded-2xl max-w-2xl">
                            <h3 className="text-xl font-bold mb-2 text-[#EC4899]">Hero Video Configuration</h3>
                            <p className="text-zinc-400 mb-6 text-sm">Upload the background video for the main landing page.</p>
                            <HeroVideoUploader />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Editor Modals */}
            {editorType === 'video' && (
                <VideoTemplateEditor
                    template={editingTemplate}
                    onSave={handleSave}
                    onClose={() => setEditorType(null)}
                />
            )}
            
            {editorType === 'image' && (
                <ImageTemplateEditor
                    template={editingTemplate}
                    onSave={handleSave}
                    onClose={() => setEditorType(null)}
                />
            )}

            {/* Video Uploader Modal */}
            {videoUploadTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="glass-panel p-8 rounded-2xl max-w-md w-full relative">
                        <button onClick={() => setVideoUploadTemplate(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
                            ✕
                        </button>
                        <h2 className="text-xl font-bold mb-2">Upload Preview {videoUploadTemplate.template_type === 'image' ? 'Image' : 'Video'}</h2>
                        <p className="text-sm text-zinc-400 mb-6">Upload a preview {videoUploadTemplate.template_type === 'image' ? 'image' : 'video'} for <strong className="text-white">{videoUploadTemplate.name}</strong></p>
                        
                        <VideoUploader
                            template={videoUploadTemplate}
                            onUploadComplete={handleVideoUploadComplete}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
