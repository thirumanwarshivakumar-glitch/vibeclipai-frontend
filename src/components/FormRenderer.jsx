export default function FormRenderer({ schema, values, onChange }) {
    const handleChange = (key, value) => {
        onChange({ ...values, [key]: value });
    };

    return (
        <div className="form-renderer">
            {schema.map((field) => (
                <div className="form-group" key={field.key}>
                    <label className="form-label" htmlFor={`field-${field.key}`}>
                        {field.label}
                        {field.required && <span className="required">*</span>}
                    </label>

                    {field.type === 'text' && (
                        <input
                            id={`field-${field.key}`}
                            type="text"
                            className="form-input"
                            placeholder={field.placeholder}
                            value={values[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            required={field.required}
                        />
                    )}

                    {field.type === 'number' && (
                        <input
                            id={`field-${field.key}`}
                            type="number"
                            className="form-input"
                            placeholder={field.placeholder}
                            value={values[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            required={field.required}
                        />
                    )}

                    {field.type === 'date' && (
                        <input
                            id={`field-${field.key}`}
                            type="date"
                            className="form-input"
                            value={values[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            required={field.required}
                        />
                    )}

                    {field.type === 'textarea' && (
                        <textarea
                            id={`field-${field.key}`}
                            className="form-textarea"
                            placeholder={field.placeholder}
                            value={values[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            required={field.required}
                            rows={4}
                        />
                    )}

                    {field.type === 'dropdown' && (
                        <select
                            id={`field-${field.key}`}
                            className="form-select"
                            value={values[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            required={field.required}
                        >
                            <option value="">{field.placeholder || 'Select an option'}</option>
                            {field.options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    )}
                </div>
            ))}
        </div>
    );
}
