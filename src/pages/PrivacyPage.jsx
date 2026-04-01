import { Link } from 'react-router-dom';

export default function PrivacyPage() {
    return (
        <div className="page" id="privacy-page">
            <section className="section" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '40px' }}>Privacy Policy</h1>
                    
                    <div className="glass-card" style={{ padding: '40px' }}>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <p style={{ marginBottom: '24px' }}>VibeClipAI is committed to protecting your privacy. This policy explains how we collect, use, and protect your data.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>1. Information We Collect</h3>
                            <p style={{ marginBottom: '16px' }}>We collect information you provide directly to us, such as your email address and any text or photos you upload for template personalization.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>2. Payment Data</h3>
                            <p style={{ marginBottom: '16px' }}>All payment transactions are handled by Razorpay. VibeClipAI does not store your card details, CVV, or other highly sensitive financial information. Razorpay uses industry-standard encryption to secure your transactions.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>3. How We Use Your Data</h3>
                            <p style={{ marginBottom: '16px' }}>We use your data to generate the digital products you order, deliver them to your email, and provide customer support. We may occasionally send you product updates if you choose to receive them.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>4. Third-Party Services</h3>
                            <p style={{ marginBottom: '16px' }}>We share only necessary data with third parties such as Razorpay (for payments) and cloud providers (for AI generation and file storage). We do not sell your personal data to advertisers.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>5. User Rights</h3>
                            <p style={{ marginBottom: '16px' }}>You have the right to access, update, or delete your personal information. If you wish to request the deletion of your account or data, please contact our support team.</p>

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
