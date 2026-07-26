import { useState, useRef } from 'react';
import { insforge } from '../lib/insforge';
import { AI_MODELS } from '../lib/aiModels';

const emptyField = { label: '', key: '', type: 'text', required: false, placeholder: '', options: [] };

function VeoSettings({ form, updateField, errors, fileInputRef, handleImageUpload, removeReferenceImage, uploadProgress }) {
    return (
        <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, marginTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>🎬 Veo Two-Step Pipeline Settings</h4>
            
            <div className="form-group">
                <label className="form-label">Step 1: Image Prompt Skeleton <span className="required">*</span></label>
                <textarea
                    className="form-textarea" value={form.imagePromptSkeleton}
                    onChange={(e) => updateField('imagePromptSkeleton', e.target.value)} rows={3}
                />
                {errors.imagePromptSkeleton && <small style={{ color: 'var(--danger)' }}>{errors.imagePromptSkeleton}</small>}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={form.allowUserImageUpload} onChange={(e) => updateField('allowUserImageUpload', e.target.checked)} />
                <label className="form-label" style={{ marginBottom: 0 }}>Allow User Image Upload?</label>
            </div>

            {form.allowUserImageUpload && (
                <div className="form-group">
                    <label className="form-label">Max User Image Uploads</label>
                    <input className="form-input" type="number" min="1" value={form.maxUserUploads} onChange={(e) => updateField('maxUserUploads', e.target.value)} style={{ width: 100 }} />
                </div>
            )}

            {!form.allowUserImageUpload && (
                <div className="form-group">
                    <label className="form-label">Step 1: Reference Image (Optional base)</label>
                {form.referenceImageUrl ? (
                    <div>
                        <img src={form.referenceImageUrl} alt="Ref" style={{ maxHeight: 100, display: 'block', marginBottom: 8 }} />
                        <button className="btn btn-sm btn-danger" type="button" onClick={removeReferenceImage}>Remove Image</button>
                    </div>
                ) : (
                    <div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                        {uploadProgress && <small style={{ display: 'block', marginTop: 4 }}>{uploadProgress}</small>}
                    </div>
                )}
            </div>
            )}

            <div className="form-group">
                <label className="form-label">Step 2: Video Prompt Skeleton <span className="required">*</span></label>
                <textarea
                    className="form-textarea" value={form.videoPromptSkeleton}
                    onChange={(e) => updateField('videoPromptSkeleton', e.target.value)} rows={3}
                />
                {errors.videoPromptSkeleton && <small style={{ color: 'var(--danger)' }}>{errors.videoPromptSkeleton}</small>}
            </div>
        </div>
    );
}

function KlingSettings({ form, updateField, errors, fileVideoInputRef, handleReferenceVideoUpload, removeReferenceVideo, videoUploadProgress, fileInputRef, handleImageUpload, removeReferenceImage, uploadProgress }) {
    return (
        <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, marginTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>🎬 Kling Motion Control Settings</h4>
            
            <div className="form-group">
                <label className="form-label">Video Prompt Skeleton <span className="required">*</span></label>
                <textarea
                    className="form-textarea" value={form.videoPromptSkeleton}
                    onChange={(e) => updateField('videoPromptSkeleton', e.target.value)} rows={3}
                />
                {errors.videoPromptSkeleton && <small style={{ color: 'var(--danger)' }}>{errors.videoPromptSkeleton}</small>}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={form.allowUserVideoUpload} onChange={(e) => updateField('allowUserVideoUpload', e.target.checked)} />
                <label className="form-label" style={{ marginBottom: 0 }}>Require User Video Upload?</label>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={form.allowUserImageUpload} onChange={(e) => updateField('allowUserImageUpload', e.target.checked)} />
                <label className="form-label" style={{ marginBottom: 0 }}>Allow User Image Upload?</label>
            </div>

            {form.allowUserImageUpload && (
                <div className="form-group">
                    <label className="form-label">Max User Image Uploads</label>
                    <input className="form-input" type="number" min="1" value={form.maxUserUploads} onChange={(e) => updateField('maxUserUploads', e.target.value)} style={{ width: 100 }} />
                </div>
            )}

            {!form.allowUserImageUpload && (
                <div className="form-group">
                    <label className="form-label">Admin Reference Image</label>
                    {form.referenceImageUrl ? (
                        <div>
                            <img src={form.referenceImageUrl} alt="Ref" style={{ maxHeight: 100, display: 'block', marginBottom: 8 }} />
                            <button className="btn btn-sm btn-danger" type="button" onClick={removeReferenceImage}>Remove Image</button>
                        </div>
                    ) : (
                        <div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                            {uploadProgress && <small style={{ display: 'block', marginTop: 4 }}>{uploadProgress}</small>}
                        </div>
                    )}
                </div>
            )}

            {!form.allowUserVideoUpload && (
                <div className="form-group">
                    <label className="form-label">Admin Reference Video (Motion Reference)</label>
                    {form.referenceVideoUrl ? (
                        <div style={{ marginBottom: 8 }}>
                            <video src={form.referenceVideoUrl} controls style={{ maxHeight: 150, display: 'block', marginBottom: 8 }} />
                            <button className="btn btn-sm btn-danger" type="button" onClick={removeReferenceVideo}>Remove Video</button>
                        </div>
                    ) : (
                        <div>
                            <input type="file" ref={fileVideoInputRef} onChange={handleReferenceVideoUpload} accept="video/*" />
                            {videoUploadProgress && <small style={{ display: 'block', marginTop: 4 }}>{videoUploadProgress}</small>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function SeedanceSettings({ form, updateField, errors, fileVideoInputRef, handleReferenceVideoUpload, removeReferenceVideo, videoUploadProgress, fileInputRef, handleImageUpload, removeReferenceImage, uploadProgress }) {
    return (
        <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, marginTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>💃 Seedance Generation Settings</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>
                Configure music, image, and dance reference inputs for Seedance 2.0 Fast.
            </p>

            <div className="form-group">
                <label className="form-label">Dance Prompt Skeleton <span className="required">*</span></label>
                <textarea
                    className="form-textarea" value={form.videoPromptSkeleton}
                    onChange={(e) => updateField('videoPromptSkeleton', e.target.value)} rows={3}
                />
                {errors.videoPromptSkeleton && <small style={{ color: 'var(--danger)' }}>{errors.videoPromptSkeleton}</small>}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={form.allowUserVideoUpload} onChange={(e) => updateField('allowUserVideoUpload', e.target.checked)} />
                <label className="form-label" style={{ marginBottom: 0 }}>Require User Video Upload?</label>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={form.allowUserImageUpload} onChange={(e) => updateField('allowUserImageUpload', e.target.checked)} />
                <label className="form-label" style={{ marginBottom: 0 }}>Allow User Image Upload?</label>
            </div>

            {form.allowUserImageUpload && (
                <div className="form-group">
                    <label className="form-label">Max User Image Uploads</label>
                    <input className="form-input" type="number" min="1" value={form.maxUserUploads} onChange={(e) => updateField('maxUserUploads', e.target.value)} style={{ width: 100 }} />
                </div>
            )}

            {!form.allowUserImageUpload && (
                <div className="form-group">
                    <label className="form-label">Admin Reference Image</label>
                    {form.referenceImageUrl ? (
                        <div>
                            <img src={form.referenceImageUrl} alt="Ref" style={{ maxHeight: 100, display: 'block', marginBottom: 8 }} />
                            <button className="btn btn-sm btn-danger" type="button" onClick={removeReferenceImage}>Remove Image</button>
                        </div>
                    ) : (
                        <div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                            {uploadProgress && <small style={{ display: 'block', marginTop: 4 }}>{uploadProgress}</small>}
                        </div>
                    )}
                </div>
            )}

            {!form.allowUserVideoUpload && (
                <div className="form-group">
                    <label className="form-label">Admin Reference Video (Motion Reference)</label>
                    {form.referenceVideoUrl ? (
                        <div style={{ marginBottom: 8 }}>
                            <video src={form.referenceVideoUrl} controls style={{ maxHeight: 150, display: 'block', marginBottom: 8 }} />
                            <button className="btn btn-sm btn-danger" type="button" onClick={removeReferenceVideo}>Remove Video</button>
                        </div>
                    ) : (
                        <div>
                            <input type="file" ref={fileVideoInputRef} onChange={handleReferenceVideoUpload} accept="video/*" />
                            {videoUploadProgress && <small style={{ display: 'block', marginTop: 4 }}>{videoUploadProgress}</small>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function VideoTemplateEditor({ template, onSave, onClose }) {
    // Filter to only show video models
    const availableModels = Object.entries(AI_MODELS).filter(([_, config]) => config.category === 'video');

    const [form, setForm] = useState(
        template
             ? {
                ...template,
                description: template.description || '',
                category: template.category || '',
                tags: template.tags || [],
                templateType: 'video',
                allowUserImageUpload: template.allow_user_image_upload ?? template.allowUserImageUpload ?? false,
                allowUserVideoUpload: template.allow_user_video_upload ?? template.allowUserVideoUpload ?? false,
                maxUserUploads: template.max_user_uploads ?? template.maxUserUploads ?? 1,
                imagePromptSkeleton: template.imagePromptSkeleton || template.image_prompt_skeleton || '',
                videoPromptSkeleton: template.videoPromptSkeleton || template.video_prompt_skeleton || '',
                captionSkeleton: template.caption_skeleton || template.captionSkeleton || '',
                referenceImageUrl: template.reference_image_url || template.referenceImageUrl || '',
                referenceVideoUrl: template.reference_video_url || template.referenceVideoUrl || '',
                inputSchema: template.inputSchema || template.input_schema || [{ ...emptyField }],
                isFavorite: template.is_favorite ?? template.isFavorite ?? false,
            }
            : {
                name: '',
                description: '',
                tags: [],
                price: '',
                templateType: 'video',
                allowUserImageUpload: false,
                allowUserVideoUpload: false,
                maxUserUploads: 1,
                imagePromptSkeleton: '',
                videoPromptSkeleton: '',
                captionSkeleton: '',
                referenceImageUrl: '',
                referenceVideoUrl: '',
                inputSchema: [{ ...emptyField }],
                isFavorite: false,
            }
    );

    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState({});
    
    // Upload state
    const [uploadProgress, setUploadProgress] = useState('');
    const [videoUploadProgress, setVideoUploadProgress] = useState('');
    const fileInputRef = useRef(null);
    const fileVideoInputRef = useRef(null);

    // Model State
    const [aiModel, setAiModel] = useState(template?.ai_model || availableModels[0][0]);
    const [generationMode, setGenerationMode] = useState(template?.generation_mode || AI_MODELS[aiModel]?.modes[0]?.toLowerCase().replace(/ /g, '-') || 'text-to-video');
    const [defaultAspectRatio, setDefaultAspectRatio] = useState(template?.default_aspect_ratio || AI_MODELS[aiModel]?.aspectRatios[0] || '16:9');
    
    const [videoDuration, setVideoDuration] = useState(template?.video_duration || '5');
    const [videoFps, setVideoFps] = useState(template?.video_fps || '24');
    const [currency, setCurrency] = useState(template?.currency || 'INR');

    const handleAiModelChange = (newModel) => {
        setAiModel(newModel);
        const modelConfig = AI_MODELS[newModel];
        const firstMode = modelConfig.modes[0]?.toLowerCase().replace(/ /g, '-') || '';
        setGenerationMode(firstMode);
        setDefaultAspectRatio(modelConfig.aspectRatios[0] || '');
    };

    const updateField = (key, value) => {
        setForm({ ...form, [key]: value });
        if (errors[key]) setErrors({ ...errors, [key]: null });
    };

    const addTag = () => {
        if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
            updateField('tags', [...form.tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tag) => updateField('tags', form.tags.filter((t) => t !== tag));

    const updateSchemaField = (index, key, value) => {
        const updated = [...form.inputSchema];
        updated[index] = { ...updated[index], [key]: value };
        setForm({ ...form, inputSchema: updated });
    };

    const addSchemaField = () => {
        setForm({ ...form, inputSchema: [...form.inputSchema, { ...emptyField }] });
    };

    const removeSchemaField = (index) => {
        if (form.inputSchema.length > 1) {
            setForm({ ...form, inputSchema: form.inputSchema.filter((_, i) => i !== index) });
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadProgress('Uploading...');
        try {
            const ext = file.name.split('.').pop();
            const templateId = template?.id || 'new-' + Date.now();
            const path = `${templateId}/reference.${ext}`;
            const { data, error } = await insforge.storage.from('template-previews').upload(path, file);
            if (error) throw new Error(error.message);
            updateField('referenceImageUrl', data.url);
            setUploadProgress('');
        } catch (err) {
            setUploadProgress('❌ Upload failed: ' + err.message);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeReferenceImage = () => updateField('referenceImageUrl', '');

    const handleReferenceVideoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setVideoUploadProgress('Uploading video...');
        try {
            const ext = file.name.split('.').pop();
            const templateId = template?.id || 'new-' + Date.now();
            const path = `${templateId}/reference-video.${ext}`;
            const { data, error } = await insforge.storage.from('template-previews').upload(path, file);
            if (error) throw new Error(error.message);
            updateField('referenceVideoUrl', data.url);
            setVideoUploadProgress('');
        } catch (err) {
            setVideoUploadProgress('❌ Upload failed: ' + err.message);
        } finally {
            if (fileVideoInputRef.current) fileVideoInputRef.current.value = '';
        }
    };

    const removeReferenceVideo = () => updateField('referenceVideoUrl', '');

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Template name is required';
        if (!form.price || isNaN(Number(form.price))) errs.price = 'Valid price is required';
        
        const workflow = AI_MODELS[aiModel]?.workflow || 'veo_two_step'; // fallback
        if (workflow === 'veo_two_step') {
            if (!form.imagePromptSkeleton?.trim()) errs.imagePromptSkeleton = 'Image prompt skeleton is required';
            if (!form.videoPromptSkeleton?.trim()) errs.videoPromptSkeleton = 'Video prompt skeleton is required';
        } else {
            if (!form.videoPromptSkeleton?.trim()) errs.videoPromptSkeleton = 'Video prompt skeleton is required';
        }

        setErrors(errs);
        return errs;
    };

    const handleSave = () => {
        const errs = validate();
        if (Object.keys(errs).length === 0) {
            let finalTags = form.tags || [];
            if (tagInput.trim() && !finalTags.includes(tagInput.trim())) {
                finalTags = [...finalTags, tagInput.trim()];
            }

            const {
                templateType,
                allowUserImageUpload,
                allowUserVideoUpload,
                maxUserUploads,
                imagePromptSkeleton,
                videoPromptSkeleton,
                captionSkeleton,
                referenceImageUrl,
                referenceVideoUrl,
                inputSchema,
                isFavorite,
                previewVideoUrl,
                tags,
                ...restForm
            } = form;

            onSave({
                ...restForm,
                category: form.category,
                tags: finalTags,
                template_type: templateType,
                preview_video_url: previewVideoUrl,
                price: Number(form.price),
                ai_model: aiModel,
                generation_mode: generationMode,
                default_aspect_ratio: defaultAspectRatio,
                video_duration: videoDuration,
                video_fps: videoFps,
                currency: currency,
                allow_user_image_upload: allowUserImageUpload,
                allow_user_video_upload: allowUserVideoUpload,
                max_user_uploads: Number(maxUserUploads),
                reference_video_url: referenceVideoUrl,
                reference_image_url: referenceImageUrl,
                image_prompt_skeleton: imagePromptSkeleton,
                video_prompt_skeleton: videoPromptSkeleton,
                caption_skeleton: captionSkeleton,
                input_schema: inputSchema,
                is_favorite: isFavorite,
            });
        } else {
            const firstError = Object.values(errs).filter(Boolean)[0];
            alert('Cannot save template: ' + (firstError || 'Please check all required fields.'));
        }
    };

    const workflow = AI_MODELS[aiModel]?.workflow || 'veo_two_step'; // fallback to legacy Veo if workflow missing

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{template ? 'Edit Video Template' : 'Add Video Template'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* Basic Info */}
                    <div className="form-group">
                        <label className="form-label">Template Name <span className="required">*</span></label>
                        <input className="form-input" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
                        {errors.name && <small style={{ color: 'var(--danger)' }}>{errors.name}</small>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={2} />
                    </div>

                    {/* AI Model Config */}
                    <div className="form-group">
                        <label className="form-label">AI Model <span className="required">*</span></label>
                        <select className="form-select" value={aiModel} onChange={(e) => handleAiModelChange(e.target.value)}>
                            {availableModels.map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Render Model-Specific Settings (Strategy Pattern) */}
                    {workflow === 'veo_two_step' && <VeoSettings form={form} updateField={updateField} errors={errors} fileInputRef={fileInputRef} handleImageUpload={handleImageUpload} removeReferenceImage={removeReferenceImage} uploadProgress={uploadProgress} />}
                    {workflow === 'kling_motion' && <KlingSettings form={form} updateField={updateField} errors={errors} fileVideoInputRef={fileVideoInputRef} handleReferenceVideoUpload={handleReferenceVideoUpload} removeReferenceVideo={removeReferenceVideo} videoUploadProgress={videoUploadProgress} fileInputRef={fileInputRef} handleImageUpload={handleImageUpload} removeReferenceImage={removeReferenceImage} uploadProgress={uploadProgress} />}
                    {workflow === 'seedance_motion' && <SeedanceSettings form={form} updateField={updateField} errors={errors} fileVideoInputRef={fileVideoInputRef} handleReferenceVideoUpload={handleReferenceVideoUpload} removeReferenceVideo={removeReferenceVideo} videoUploadProgress={videoUploadProgress} fileInputRef={fileInputRef} handleImageUpload={handleImageUpload} removeReferenceImage={removeReferenceImage} uploadProgress={uploadProgress} />}

                    {/* Video Output Settings */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Aspect Ratio</label>
                            <select className="form-select" value={defaultAspectRatio} onChange={(e) => setDefaultAspectRatio(e.target.value)}>
                                {AI_MODELS[aiModel]?.aspectRatios.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Duration (s)</label>
                            <input className="form-input" value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">FPS</label>
                            <input className="form-input" value={videoFps} onChange={(e) => setVideoFps(e.target.value)} />
                        </div>
                    </div>

                    {/* User Input Schema */}
                    <div className="form-group">
                        <label className="form-label">User Inputs (Variables)</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                            Define variables to use in your prompt (e.g., Key "USER_NAME" maps to {"{USER_NAME}"} in your prompt).
                        </p>
                        {form.inputSchema.map((field, index) => (
                            <div key={index} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                <input className="form-input" placeholder="Label (e.g. User Name)" value={field.label} onChange={(e) => updateSchemaField(index, 'label', e.target.value)} style={{ flex: 1, minWidth: 120 }} />
                                <input className="form-input" placeholder="Key (e.g. USER_NAME)" value={field.key} onChange={(e) => updateSchemaField(index, 'key', e.target.value)} style={{ flex: 1, minWidth: 120 }} />
                                <select className="form-select" value={field.type} onChange={(e) => updateSchemaField(index, 'type', e.target.value)} style={{ width: 100 }}>
                                    <option value="text">Text</option>
                                    <option value="textarea">Textarea</option>
                                    <option value="number">Number</option>
                                </select>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', marginTop: 8 }}>
                                    <input type="checkbox" checked={field.required} onChange={(e) => updateSchemaField(index, 'required', e.target.checked)} /> Req?
                                </label>
                                <button className="btn btn-danger btn-sm" type="button" onClick={() => removeSchemaField(index)} style={{ marginTop: 4 }}>✕</button>
                            </div>
                        ))}
                        <button className="btn btn-secondary btn-sm" type="button" onClick={addSchemaField}>+ Add Input Field</button>
                    </div>

                    {/* Caption Skeleton */}
                    <div className="form-group">
                        <label className="form-label">Caption Skeleton (Social Media)</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                            Define the default social media copy for this template (use variables like {"{BRIDE_NAME}"}, {"{MARRIAGE_DATE}"}, {"{COUPLE_NAMES}"}).
                        </p>
                        <textarea
                            className="form-textarea"
                            value={form.captionSkeleton}
                            onChange={(e) => updateField('captionSkeleton', e.target.value)}
                            rows={4}
                            placeholder="e.g. ✨ Our official Save The Date! 💍&#10;{BRIDE_NAME} & {GROOM_NAME} | {MARRIAGE_DATE} 🗓️&#10;&#10;Created with VibeClipAI ✨"
                        />
                    </div>

                    {/* Category & Tags & Pricing */}
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <input className="form-input" placeholder="e.g. Wedding, Corporate..." value={form.category} onChange={(e) => updateField('category', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            {form.tags.map((tag) => <span key={tag} className="tag" style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)}>{tag} ✕</span>)}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input className="form-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Type tag and press Enter" />
                            <button className="btn btn-secondary btn-sm" onClick={addTag} type="button">Add</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Price <span className="required">*</span></label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: 130 }}>
                                <option value="INR">₹ INR</option>
                                <option value="USD">$ USD</option>
                            </select>
                            <input className="form-input" type="number" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} style={{ flex: 1 }} />
                        </div>
                        {errors.price && <small style={{ color: 'var(--danger)' }}>{errors.price}</small>}
                    </div>

                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>Save Video Template</button>
                </div>
            </div>
        </div>
    );
}
