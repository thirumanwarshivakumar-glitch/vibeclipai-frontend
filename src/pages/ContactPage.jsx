import { Link } from 'react-router-dom';

export default function ContactPage() {
    return (
        <div className="page" id="contact-page">
            <section className="section" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '40px' }}>Contact Us</h1>
                    
                    <div className="glass-card" style={{ padding: '40px' }}>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <p style={{ marginBottom: '32px' }}>If you have any questions about your order, payments, or have any service-related issues, please reach out to us using the details below.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                                <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Business Name</h4>
                                    <p>VibeClipAI</p>
                                </div>
                                <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Support Email</h4>
                                    <a href="mailto:support@vibeclipai.com" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>support@vibeclipai.com</a>
                                </div>
                                <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Country</h4>
                                    <p>India</p>
                                </div>
                            </div>

                            <p style={{ marginBottom: '16px' }}>Our support team typically responds to all inquiries within 24-48 hours. Please include your Order ID for faster resolution of payment-realted queries.</p>
                            
                            <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                                Last Updated: March 14, 2026
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '32px', textAlign: 'center' }}>
                        <Link to="/" className="btn btn-outline">Back to Home</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
