import { Link } from 'react-router-dom';

export default function RefundPage() {
    return (
        <div className="page" id="refund-page">
            <section className="section" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '40px' }}>Refund & Cancellation Policy</h1>
                    
                    <div className="glass-card" style={{ padding: '40px' }}>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '16px' }}>1. Digital Product Policy</h3>
                            <p style={{ marginBottom: '16px' }}>VibeClipAI sells digital products (AI-generated videos and images). Once the generation process has started or the final product has been delivered to your email, we do not offer refunds as the computational resources have already been consumed.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>2. Conditions for Refund Requests</h3>
                            <p style={{ marginBottom: '16px' }}>Refunds may only be considered in cases where:
                                <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
                                    <li>There was a technical failure on our platform that prevented the delivery of the product.</li>
                                    <li>A payment was charged twice for the same order due to a processing error.</li>
                                </ul>
                            </p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>3. Refund Request Procedure</h3>
                            <p style={{ marginBottom: '16px' }}>To request a refund, please email our support team at support@vibeclipai.com with your Order ID and the reason for your request. We will review your case within 2 business days.</p>

                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', marginTop: '32px' }}>4. Processing Timeline</h3>
                            <p style={{ marginBottom: '16px' }}>If approved, refunds will be initiated through Razorpay to your original payment method. The amount typically reflects in your account within 5-7 business days, depending on your bank's policies.</p>

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
