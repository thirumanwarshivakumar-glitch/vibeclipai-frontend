import { useState, useEffect } from 'react';
import TemplateCard from '../components/TemplateCard';
import { fetchTemplates } from '../lib/api';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('video');

    useEffect(() => {
        fetchTemplates()
            .then((data) => {
                setTemplates(data || []);
            })
            .catch((err) => {
                console.error('Failed to fetch templates:', err);
            })
            .finally(() => setLoading(false));
    }, []);

    // Filter templates based on active tab and templateType (default to 'video' for older database rows that lack this column)
    const filteredTemplates = templates.filter(t => (t.template_type || t.templateType || 'video') === activeTab);

    return (
        <div className="page" id="templates-page">
            {/* HERO HEADER FOR TEMPLATES */}
            <section className="section templates-hero-header">
                <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <div className="hero-badge" style={{ display: 'inline-block', marginBottom: '16px' }}>✨ Premium Collection</div>
                    <h1 className="section-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
                        Create <span className="gradient-text">Stunning Designs</span>
                    </h1>
                    <p className="section-subtitle">Loved by 10,000+ creators. Premium name reveals, wedding cards & celebration videos — starting at just ₹199.00.</p>
                </div>
            </section>

            {/* MAIN CONTENT AREA */}
            <section className="section" style={{ background: 'var(--bg-secondary)', minHeight: '60vh', padding: '40px 0 100px' }}>
                <div className="container">

                    {/* CATEGORY TABS */}
                    <div className="tabs-container">
                        <button
                            className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
                            onClick={() => setActiveTab('video')}
                        >
                            <span className="tab-icon" style={{ opacity: activeTab === 'video' ? 1 : 0.6 }}>🎬</span> Video Templates
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'image' ? 'active' : ''}`}
                            onClick={() => setActiveTab('image')}
                        >
                            <span className="tab-icon" style={{ opacity: activeTab === 'image' ? 1 : 0.6 }}>🖼️</span> Image Templates
                        </button>
                    </div>

                    {/* TEMPLATE GRID */}
                    {loading ? (
                        <div className="templates-empty-state glass-card">
                            <div className="spinner" style={{ margin: '0 auto 16px', borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)', width: 40, height: 40 }}></div>
                            <h3 style={{ marginBottom: 8 }}>Fetching Templates...</h3>
                            <p style={{ color: 'var(--text-tertiary)' }}>Please wait while we load our premium collection.</p>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="templates-empty-state glass-card">
                            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📭</div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No {activeTab} templates found</h3>
                            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                                We are currently designing new premium templates for this category. Check back soon for beautiful new additions.
                            </p>
                        </div>
                    ) : (
                        <div className="templates-page-grid">
                            {filteredTemplates.map((t) => (
                                <TemplateCard key={t.id} template={t} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
