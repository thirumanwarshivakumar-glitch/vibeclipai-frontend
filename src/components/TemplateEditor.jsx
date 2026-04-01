import { useState, useRef } from 'react';
import { insforge } from '../lib/insforge';

const emptyField = { label: '', key: '', type: 'text', required: false, placeholder: '', options: [] };

export default function TemplateEditor({ template, onSave, onClose }) {
    const [form, setForm] = useState(
        template
             ? {
                ...template,
                templateType: template.templateType || template.template_type || 'video',
                allowUserImageUpload: template.allow_user_image_upload ?? template.allowUserImageUpload ?? false,
                imagePromptSkeleton: template.imagePromptSkeleton || template.image_prompt_skeleton || '',
                videoPromptSkeleton: template.videoPromptSkeleton || template.video_prompt_skeleton || '',
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
                imagePromptSkeleton: '',
                videoPromptSkeleton: '',
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

    // Reference image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert('Image must be under 10MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPEG, PNG, WebP)');
            return;
        }

        setUploading(true);
        setUploadProgress('Uploading reference image...');

        try {
            const ext = file.name.split('.').pop();
            const templateId = template?.id || 'new-' + Date.now();
            const path = `${templateId}/reference.${ext}`;

            const { data, error } = await insforge.storage
                .from('template-previews')
                .upload(path, file);

            if (error) throw new Error(error.message);

            updateField('referenceImageUrl', data.url);
            setUploadProgress('✅ Reference image uploaded!');
        } catch (err) {
            console.error('Image upload failed:', err);
            setUploadProgress('❌ Upload failed: ' + err.message);
        } finally {
            setUploading(false);
            // Clear file input
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
        // Video Prompt Skeleton only required for video templates
        if (form.templateType !== 'image' && !form.videoPromptSkeleton?.trim()) {
            errs.videoPromptSkeleton = 'Video prompt skeleton is required for video templates';
        }
        setErrors(errs);
        return errs;
    };

    const handleSave = () => {
        const errs = validate();
        if (Object.keys(errs).length === 0) {
            onSave({ ...form, price: Number(form.price) });
        } else {
            const firstError = Object.values(errs).filter(Boolean)[0];
            alert('Cannot save template: ' + (firstError || 'Please check all required fields.'));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{template ? 'Edit Template' : 'Add Template'}</h2>
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
                            placeholder="e.g. Royal Wedding Invitation"
                        />
                        {errors.name && <small style={{ color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.name}</small>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Describe what the template does"
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Template Type <span className="required">*</span></label>
                        <select
                            className="form-select"
                            value={form.templateType || 'video'}
                            onChange={(e) => updateField('templateType', e.target.value)}
                        >
                            <option value="video">🎬 Video Template</option>
                            <option value="image">🖼️ Image Template</option>
                        </select>
                        <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'block', marginTop: 4 }}>
                            This determines which tab the template appears under on the Templates page.
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            {form.tags.map((tag) => (
                                <span key={tag} className="tag" style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)}>
                                    {tag} ✕
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="form-input"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder="Type tag and press Enter"
                            />
                            <button className="btn btn-secondary btn-sm" onClick={addTag} type="button">Add</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Price (₹) <span className="required">*</span></label>
                        <input
                            className="form-input"
                            type="number"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => updateField('price', e.target.value)}
                            placeholder="9.99"
                        />
                        {errors.price && <small style={{ color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.price}</small>}
                    </div>

                    {/* Favorite Toggle */}
                    <div className="form-group">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 16px',
                            marginBottom: 0,
                        }}>
                            <div>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, marginBottom: 2 }}>⭐ Show on Home Page (Favorite)</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0 }}>
                                    If ON, this template will appear in the "Make Every Moment Cinematic" section on the home page.
                                </p>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', flexShrink: 0, marginLeft: 16 }}>
                                <div
                                    onClick={() => updateField('isFavorite', !form.isFavorite)}
                                    style={{
                                        width: 44,
                                        height: 24,
                                        borderRadius: 12,
                                        background: form.isFavorite ? 'var(--accent-primary)' : 'var(--border-color)',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s ease',
                                        flexShrink: 0,
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 3,
                                        left: form.isFavorite ? 23 : 3,
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        background: 'white',
                                        transition: 'left 0.2s ease',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: form.isFavorite ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                                    {form.isFavorite ? 'ON' : 'OFF'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Reference Image Section — with User Upload Toggle */}
                    <div className="form-group">
                        <label className="form-label">
                            Reference Image
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 8, fontWeight: 400 }}>
                                (Used by AI as visual reference for generation)
                            </span>
                        </label>

                        {/* Toggle: Let user upload vs admin uploads */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 16px',
                            marginBottom: 16,
                        }}>
                            <div>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, marginBottom: 2 }}>📸 User Uploads Their Own Image</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0 }}>
                                    If ON, customer must upload their own photo at checkout. Admin image below is skipped.
                                </p>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', flexShrink: 0, marginLeft: 16 }}>
                                <div
                                    onClick={() => updateField('allowUserImageUpload', !form.allowUserImageUpload)}
                                    style={{
                                        width: 44,
                                        height: 24,
                                        borderRadius: 12,
                                        background: form.allowUserImageUpload ? 'var(--accent-primary)' : 'var(--border-color)',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s ease',
                                        flexShrink: 0,
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 3,
                                        left: form.allowUserImageUpload ? 23 : 3,
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        background: 'white',
                                        transition: 'left 0.2s ease',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: form.allowUserImageUpload ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                                    {form.allowUserImageUpload ? 'ON' : 'OFF'}
                                </span>
                            </label>
                        </div>

                        {/* Show admin upload only when user upload is OFF */}
                        {form.allowUserImageUpload ? (
                            <div style={{
                                padding: '16px',
                                background: 'rgba(108,92,231,0.06)',
                                border: '1px dashed var(--accent-primary)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center',
                                color: 'var(--accent-primary)',
                                fontSize: '0.85rem',
                            }}>
                                📸 Customer will upload their own reference image at checkout.
                                No admin image needed for this template.
                            </div>
                        ) : (
                            <>
                                {form.referenceImageUrl ? (
                                    <div style={{
                                        position: 'relative',
                                        border: '2px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        overflow: 'hidden',
                                        maxWidth: 280,
                                        background: '#000',
                                    }}>
                                        <img
                                            src={form.referenceImageUrl}
                                            alt="Reference"
                                            style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }}
                                        />
                                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}
                                                onClick={() => fileInputRef.current?.click()}
                                                type="button"
                                            >
                                                🔄 Replace
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: 'rgba(220,53,69,0.85)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}
                                                onClick={removeReferenceImage}
                                                type="button"
                                            >
                                                ✕ Remove
                                            </button>
                                        </div>
                                        <div style={{ padding: '6px 12px', background: 'rgba(108,92,231,0.1)', fontSize: '0.75rem', color: 'var(--accent-primary)', textAlign: 'center' }}>
                                            ✅ Reference image attached
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px 16px', textAlign: 'center', cursor: uploading ? 'wait' : 'pointer', transition: 'all 0.2s ease', background: 'var(--bg-secondary)' }}
                                        onClick={() => !uploading && fileInputRef.current?.click()}
                                    >
                                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🖼️</div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                            {uploading ? uploadProgress : 'Click to upload a reference image'}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                            JPEG, PNG, WebP — Max 10MB
                                        </p>
                                    </div>
                                )}

                                {uploadProgress && !form.referenceImageUrl && (
                                    <small style={{ display: 'block', marginTop: 6, color: uploadProgress.includes('❌') ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                                        {uploadProgress}
                                    </small>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    style={{ display: 'none' }}
                                    onChange={handleImageUpload}
                                />

                                {/* URL alternative */}
                                <div style={{ marginTop: 8 }}>
                                    <input
                                        className="form-input"
                                        value={form.referenceImageUrl || ''}
                                        onChange={(e) => updateField('referenceImageUrl', e.target.value)}
                                        placeholder="Or paste image URL directly (https://...)"
                                        style={{ fontSize: '0.8rem' }}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Image Prompt Skeleton (Kie.ai) <span className="required">*</span></label>
                        <textarea
                            className="form-textarea"
                            value={form.imagePromptSkeleton}
                            onChange={(e) => updateField('imagePromptSkeleton', e.target.value)}
                            placeholder={'Write the Kie.ai Nano Banana 2 prompt template. Focus on the final visual look of the image.'}
                            rows={4}
                        />
                        {errors.imagePromptSkeleton && <small style={{ color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.imagePromptSkeleton}</small>}
                        <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'block', marginTop: 4 }}>
                            💡 Use <code>{'{Name}'}</code>, etc. This prompt is used to generate the <strong>Preview Image</strong>.
                        </small>
                    </div>

                    {form.templateType !== 'image' && (
                        <div className="form-group">
                            <label className="form-label">Video Prompt Skeleton (Veo 3.1) <span className="required">*</span></label>
                            <textarea
                                className="form-textarea"
                                value={form.videoPromptSkeleton}
                                onChange={(e) => updateField('videoPromptSkeleton', e.target.value)}
                                placeholder={'Write the Veo 3.1 prompt template. Mention "ATTACHED IMAGE" to use the generated image above.'}
                                rows={6}
                            />
                            {errors.videoPromptSkeleton && <small style={{ color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.videoPromptSkeleton}</small>}
                            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'block', marginTop: 4 }}>
                                💡 This prompt is used for the <strong>Final Video</strong>. It automatically receives the image generated by the prompt above.
                            </small>
                        </div>
                    )}

                    {/* Input Schema Builder */}
                    <div style={{ marginTop: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <label className="form-label" style={{ margin: 0 }}>Input Schema Fields</label>
                            <button className="btn btn-secondary btn-sm" onClick={addSchemaField} type="button">+ Add Field</button>
                        </div>

                        {form.inputSchema.map((field, index) => (
                            <div className="schema-field" key={index}>
                                {form.inputSchema.length > 1 && (
                                    <button className="schema-remove-btn" onClick={() => removeSchemaField(index)} type="button">✕</button>
                                )}
                                <div className="schema-field-row">
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Label</label>
                                        <input
                                            className="form-input"
                                            value={field.label}
                                            onChange={(e) => updateSchemaField(index, 'label', e.target.value)}
                                            placeholder="Field Label"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Key</label>
                                        <input
                                            className="form-input"
                                            value={field.key}
                                            onChange={(e) => updateSchemaField(index, 'key', e.target.value)}
                                            placeholder="fieldKey"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Type</label>
                                        <select
                                            className="form-select"
                                            value={field.type}
                                            onChange={(e) => updateSchemaField(index, 'type', e.target.value)}
                                        >
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                            <option value="date">Date</option>
                                            <option value="textarea">Textarea</option>
                                            <option value="dropdown">Dropdown</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Required</label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 0' }}>
                                            <input
                                                type="checkbox"
                                                checked={field.required}
                                                onChange={(e) => updateSchemaField(index, 'required', e.target.checked)}
                                            />
                                            Yes
                                        </label>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Placeholder</label>
                                    <input
                                        className="form-input"
                                        value={field.placeholder}
                                        onChange={(e) => updateSchemaField(index, 'placeholder', e.target.value)}
                                        placeholder="Placeholder text"
                                    />
                                </div>
                                {field.type === 'dropdown' && (
                                    <div className="schema-field-options" style={{ marginTop: 12 }}>
                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Options (comma-separated)</label>
                                        <input
                                            className="form-input"
                                            value={field.options.join(', ')}
                                            onChange={(e) => updateSchemaField(index, 'options', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                                            placeholder="Option 1, Option 2, Option 3"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>Save Template</button>
                </div>
            </div>
        </div>
    );
}
