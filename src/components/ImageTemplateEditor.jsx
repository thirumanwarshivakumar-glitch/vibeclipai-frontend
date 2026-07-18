import { useState, useRef } from 'react';
import { insforge } from '../lib/insforge';
import { AI_MODELS } from '../lib/aiModels';

const emptyField = { label: '', key: '', type: 'text', required: false, placeholder: '', options: [] };

export default function ImageTemplateEditor({ template, onSave, onClose }) {
    const [form, setForm] = useState(
        template
             ? {
                ...template,
                description: template.description || '',
                category: template.category || '',
                tags: template.tags || [],
                templateType: 'image',
                allowUserImageUpload: template.allow_user_image_upload ?? template.allowUserImageUpload ?? false,
                imagePromptSkeleton: template.imagePromptSkeleton || template.image_prompt_skeleton || '',
                inputSchema: template.inputSchema || template.input_schema || [{ ...emptyField }],
                isFavorite: template.is_favorite ?? template.isFavorite ?? false,
                referenceImageUrl: template.reference_image_url || template.referenceImageUrl || '',
            }
            : {
                name: '',
                description: '',
                category: '',
                tags: [],
                price: '',
                templateType: 'image',
                allowUserImageUpload: false,
                imagePromptSkeleton: '',
                inputSchema: [{ ...emptyField }],
                referenceImageUrl: '',
                isFavorite: false,
            }
    );

    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState({});
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const fileInputRef = useRef(null);

    // Filter to only show image models
    const availableModels = Object.entries(AI_MODELS).filter(([_, config]) => config.category === 'image');
    
    // AI Model Configuration state
    const [aiModel, setAiModel] = useState(template?.ai_model || availableModels[0][0]);
    const [generationMode, setGenerationMode] = useState(template?.generation_mode || AI_MODELS[aiModel]?.modes[0]?.toLowerCase().replace(/ /g, '-') || 'text-to-image');
    const [defaultAspectRatio, setDefaultAspectRatio] = useState(template?.default_aspect_ratio || AI_MODELS[aiModel]?.aspectRatios[0] || '1:1');

    const [currency, setCurrency] = useState(template?.currency || 'INR');
    
    const [referenceImages, setReferenceImages] = useState(() => {
        const raw = template?.reference_images;
        if (!raw) return [];
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
        } catch { return []; }
    });
    const [maxUserUploads, setMaxUserUploads] = useState(template?.max_user_uploads || 1);

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

    const removeTag = (tag) => {
        updateField('tags', form.tags.filter((t) => t !== tag));
    };

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

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) { alert('Image must be under 10MB'); return; }
        if (!file.type.startsWith('image/')) { alert('Please select an image file (JPEG, PNG, WebP)'); return; }

        setUploading(true);
        setUploadProgress('Uploading reference image...');

        try {
            const ext = file.name.split('.').pop();
            const templateId = template?.id || 'new-' + Date.now();
            const path = `${templateId}/reference.${ext}`;

            const { data, error } = await insforge.storage.from('template-previews').upload(path, file);
            if (error) throw new Error(error.message);

            updateField('referenceImageUrl', data.url);
            setUploadProgress('✅ Reference image uploaded!');
        } catch (err) {
            setUploadProgress('❌ Upload failed: ' + err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeReferenceImage = () => {
        updateField('referenceImageUrl', '');
        setUploadProgress('');
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Template name is required';
        if (!form.price || isNaN(Number(form.price))) errs.price = 'Valid price is required';
        if (!form.imagePromptSkeleton?.trim()) errs.imagePromptSkeleton = 'Image prompt skeleton is required';
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
                imagePromptSkeleton,
                inputSchema,
                referenceImageUrl,
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
                reference_images: JSON.stringify(referenceImages),
                max_user_uploads: maxUserUploads,
                currency: currency,
                allow_user_image_upload: allowUserImageUpload,
                image_prompt_skeleton: imagePromptSkeleton,
                input_schema: inputSchema,
                reference_image_url: referenceImageUrl,
                is_favorite: isFavorite,
                // Ensure no video fields are populated
                video_prompt_skeleton: null,
                allow_user_video_upload: false,
                reference_video_url: null,
            });
        } else {
            const firstError = Object.values(errs).filter(Boolean)[0];
            alert('Cannot save template: ' + (firstError || 'Please check all required fields.'));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{template ? 'Edit Image Template' : 'Add Image Template'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* Basic Info */}
                    <div className="form-group">
                        <label className="form-label">Template Name <span className="required">*</span></label>
                        <input
                            className="form-input"
                            value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            placeholder="e.g. 3D Pencil Sketch Effect"
                        />
                        {errors.name && <small style={{ color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.name}</small>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            rows={3}
                        />
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

                    <div className="form-group">
                        <label className="form-label">Generation Mode <span className="required">*</span></label>
                        <select className="form-select" value={generationMode} onChange={(e) => setGenerationMode(e.target.value)}>
                            {AI_MODELS[aiModel]?.modes.map((mode) => (
                                <option key={mode} value={mode.toLowerCase().replace(/ /g, '-')}>{mode}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Default Aspect Ratio</label>
                        <select className="form-select" value={defaultAspectRatio} onChange={(e) => setDefaultAspectRatio(e.target.value)}>
                            {AI_MODELS[aiModel]?.aspectRatios.map((ratio) => (
                                <option key={ratio} value={ratio}>{ratio}</option>
                            ))}
                        </select>
                    </div>

                    {/* Category & Tags and Price */}
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <input className="form-input" placeholder="e.g. Wedding, Corporate..." value={form.category} onChange={(e) => updateField('category', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            {form.tags.map((tag) => (
                                <span key={tag} className="tag" style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)}>{tag} ✕</span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="form-input" value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder="Type tag and press Enter"
                            />
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
                            <input
                                className="form-input" type="number" step="0.01"
                                value={form.price} onChange={(e) => updateField('price', e.target.value)}
                                style={{ flex: 1 }}
                            />
                        </div>
                        {errors.price && <small style={{ color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.price}</small>}
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

                    {/* Image Prompts & Uploads */}
                    <div className="form-group">
                        <label className="form-label">Image Prompt Skeleton <span className="required">*</span></label>
                        <textarea
                            className="form-textarea"
                            value={form.imagePromptSkeleton}
                            onChange={(e) => updateField('imagePromptSkeleton', e.target.value)}
                            rows={4}
                            placeholder="Prompt for generating the image"
                        />
                        {errors.imagePromptSkeleton && <small style={{ color: 'var(--danger)' }}>{errors.imagePromptSkeleton}</small>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Reference Image Upload Config</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                                type="checkbox"
                                checked={form.allowUserImageUpload}
                                onChange={(e) => updateField('allowUserImageUpload', e.target.checked)}
                            />
                            <span>Allow User Image Upload</span>
                        </div>
                    </div>

                    {!form.allowUserImageUpload && (
                        <div className="form-group">
                            <label className="form-label">Admin Reference Image</label>
                            {form.referenceImageUrl ? (
                                <div style={{ marginBottom: 10 }}>
                                    <img src={form.referenceImageUrl} alt="Ref" style={{ maxHeight: 150 }} />
                                    <button className="btn btn-sm btn-danger" onClick={removeReferenceImage}>Remove</button>
                                </div>
                            ) : (
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                            )}
                            {uploadProgress && <small>{uploadProgress}</small>}
                        </div>
                    )}

                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>Save Image Template</button>
                </div>
            </div>
        </div>
    );
}
