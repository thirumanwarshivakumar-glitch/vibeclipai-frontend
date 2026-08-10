import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function TermsPage() {
    return (
        <div className="page" id="terms-page">
            <SEO
                title="Terms of Service & Usage Policy"
                description="Read the terms and conditions governing the use of VibeClips AI video generation platform and digital deliverables."
                canonical="https://vibeclipsai.com/terms"
            />
            <section className="section" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '40px' }}>Terms & Conditions</h1>
                    
                    <div className="glass-card" style={{ padding: '40px' }}>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <p style={{ marginBottom: '24px' }}>Welcome to VibeClipAI. By using our website and services, you agree to comply with and be bound by the following terms and conditions.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>1. Description of Services</h3>
                            <p style={{ marginBottom: '16px' }}>VibeClipAI provides an AI-powered platform for generating personalized video and image templates. These include but are not limited to name reveal videos, wedding invitations, and celebration videos.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>2. Usage Terms</h3>
                            <p style={{ marginBottom: '16px' }}>Users are granted a non-exclusive right to use the generated content for personal or commercial purposes. However, the underlying templates and software remain the intellectual property of VibeClipAI.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>3. Payment Processing</h3>
                            <p style={{ marginBottom: '16px' }}>All payments are processed securely through Razorpay. We do not store your credit card or sensitive payment information on our servers. By making a purchase, you agree to Razorpay's terms of service.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>4. Digital Product Delivery</h3>
                            <p style={{ marginBottom: '16px' }}>Upon successful payment, the AI-generated digital product will be delivered to the email address provided during checkout. Delivery usually happens within a few minutes, but may take longer during high server load.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>5. Intellectual Property</h3>
                            <p style={{ marginBottom: '16px' }}>All content included on this site, such as text, graphics, logos, and templates, is the property of VibeClipAI. The AI-generated output based on user inputs is owned by the user, subject to these terms.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>6. Limitations of Liability</h3>
                            <p style={{ marginBottom: '16px' }}>VibeClipAI shall not be liable for any indirect, incidental, or consequential damages arising out of the use or inability to use our services. Products are provided "as-is" without warranties of any kind.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>7. Updates to Terms</h3>
                            <p style={{ marginBottom: '16px' }}>We reserve the right to modify these terms at any time. Your continued use of the site following any changes constitutes your acceptance of the new terms.</p>

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
