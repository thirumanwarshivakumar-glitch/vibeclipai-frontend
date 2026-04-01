import { Link } from 'react-router-dom';

export default function MerchantDeclarationPage() {
    return (
        <div className="page" id="merchant-declaration-page">
            <section className="section" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '40px' }}>Merchant Declaration</h1>
                    
                    <div className="glass-card" style={{ padding: '40px' }}>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <p style={{ marginBottom: '24px' }}>This declaration is made to confirm the nature of our business and compliance with payment processing policies.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>Nature of Business</h3>
                            <p style={{ marginBottom: '16px' }}>VibeClipAI is a technology platform that sells digital, AI-generated content. Users select pre-designed templates and provide inputs which result in a customized digital product delivered over the internet.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>Payment Processing</h3>
                            <p style={{ marginBottom: '16px' }}>All customer payments are processed through Razorpay. We do not accept cash payments or offline bank transfers for retail orders.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>Acceptable Use Compliance</h3>
                            <p style={{ marginBottom: '16px' }}>We confirm that VibeClipAI complies with Razorpay’s acceptable use policies. We do not sell any restricted products or services as defined by the Payment Gateway provider or applicable Indian laws.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>Digital Transformation Confirmation</h3>
                            <p style={{ marginBottom: '16px' }}>We confirm that all generated content is for legitimate artistic or functional purposes and does not violate the intellectual property or privacy of third parties.</p>

                            <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                                Declared on: March 14, 2026
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
