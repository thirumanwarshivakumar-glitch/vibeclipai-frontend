import { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import TemplateCard from '../components/TemplateCard';
import StepItem from '../components/StepItem';
import { fetchTemplates, getSiteConfig } from '../lib/api';

export default function HomePage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [heroVideoUrl, setHeroVideoUrl] = useState(null);

    const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start', dragFree: true }, [
        AutoScroll({ playOnInit: true, speed: 1, stopOnInteraction: false, stopOnMouseEnter: true })
    ]);

    useEffect(() => {
        // Fetch hero video
        getSiteConfig('hero_video_url').then(setHeroVideoUrl).catch(console.error);

        fetchTemplates({ isFavorite: true })
            .then((data) => {
                setTemplates(data || []);
            })
            .catch((err) => {
                console.error('Failed to fetch templates:', err);
            })
            .finally(() => setLoading(false));
    }, []);

    // Duplicate templates to ensure there are enough slides to fill a seamless loop
    const displayTemplates = templates.length > 0 ? [...templates, ...templates, ...templates, ...templates] : [];

    return (
        <div className="page" id="home-page">
            {/* HERO */}
            <section className="hero">
                <div className="hero-inner">
                    <div className="hero-content">
                        <div className="hero-badge">✨ Powered by Veo 3 AI</div>
                        <h1>
                            Create Stunning{' '}
                            <span className="gradient-text">AI-Powered Videos</span>{' '}
                            in Minutes
                        </h1>
                        <p className="hero-subtitle">
                            Pick a template, personalize, pay, and get your video link by email. No editing skills needed — our AI does the magic.
                        </p>
                        <div className="hero-buttons">
                            <a href="#templates" className="btn btn-primary btn-lg">Browse Templates</a>
                            <a href="#how-it-works" className="btn btn-outline btn-lg">See How It Works</a>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="video-preview-frame">
                            {heroVideoUrl ? (
                                <video 
                                    src={heroVideoUrl} 
                                    autoPlay 
                                    muted 
                                    loop 
                                    playsInline 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <>
                                    <div className="play-icon">▶</div>
                                    <div className="video-preview-label">
                                        <small style={{ opacity: 0.8 }}>Preview</small>
                                        <div>AI-Generated Wedding Invitation</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* TEMPLATES */}
            <section className="section" id="templates" style={{ background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <h2 className="section-title">Make Every Moment Cinematic</h2>
                    <p className="section-subtitle">Loved by 10,000+ creators. Premium name reveals, wedding cards & celebration videos — starting at just ₹199.00.</p>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>
                            <div className="spinner" style={{ margin: '0 auto 16px', borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)', width: 32, height: 32 }}></div>
                            Loading templates...
                        </div>
                    ) : templates.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)', fontSize: '1.2rem' }}>
                            No templates available
                        </div>
                    ) : (
                        <div className="embla" ref={emblaRef}>
                            <div className="embla__container">
                                {displayTemplates.map((t, index) => (
                                    <div className="embla__slide" key={`${t.id}-${index}`}>
                                        <TemplateCard template={t} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="section" id="how-it-works">
                <div className="container">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">Four simple steps to create your personalized AI invitation video.</p>
                    <div className="steps-grid">
                        <StepItem number={1} icon="🎨" title="Choose Template" description="Browse our collection of AI-powered video templates." />
                        <StepItem number={2} icon="✏️" title="Fill Details" description="Enter names, dates, venue, and your personal message." />
                        <StepItem number={3} icon="💳" title="Pay Securely" description="Quick checkout via Razorpay. No hidden fees." />
                        <StepItem number={4} icon="📧" title="Receive Email" description="Get your video download link delivered to your inbox." />
                    </div>
                </div>
            </section>

        </div>
    );
}
