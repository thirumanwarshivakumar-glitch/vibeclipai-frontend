import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { insforge } from '../lib/insforge';

export default function SignUpPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await insforge.auth.signUp({
                email,
                password,
                name,
            });

            if (authError) {
                throw authError;
            }

            if (data?.requireEmailVerification) {
                setSuccess(true);
            } else if (data?.accessToken) {
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const [verificationCode, setVerificationCode] = useState('');
    const [verifying, setVerifying] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setVerifying(true);
        setError('');

        try {
            const { data, error: verifyError } = await insforge.auth.verifyEmail({
                email,
                otp: verificationCode
            });

            if (verifyError) {
                throw verifyError;
            }

            if (data?.accessToken) {
                window.location.href = '/';
            }
        } catch (err) {
            setError(err.message || 'Failed to verify email');
        } finally {
            setVerifying(false);
        }
    };

    if (success) {
        return (
            <div className="page-wrapper" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container" style={{ maxWidth: '440px' }}>
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(0, 184, 148, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <span style={{ fontSize: '2rem' }}>📧</span>
                        </div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Verify your email</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            We've sent a 6-digit verification code to <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{email}</span>.
                            Please enter it below to activate your account.
                        </p>

                        <form onSubmit={handleVerify}>
                            {error && (
                                <div style={{ backgroundColor: '#fff5f5', borderLeft: '4px solid #f56565', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
                                    <p style={{ fontSize: '0.875rem', color: '#c53030' }}>{error}</p>
                                </div>
                            )}

                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label className="form-label" htmlFor="code">Verification Code</label>
                                <input
                                    id="code"
                                    type="text"
                                    className="form-input"
                                    placeholder="123456"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    maxLength={6}
                                    required
                                    style={{ letterSpacing: '2px', textAlign: 'center', fontSize: '1.25rem' }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={verifying || verificationCode.length < 6}
                                style={{ width: '100%', padding: '14px', marginTop: '12px' }}
                            >
                                {verifying ? 'Verifying...' : 'Verify Code'}
                            </button>
                        </form>
                        
                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1.5px solid var(--border-color)' }}>
                            <button 
                                onClick={() => { setSuccess(false); setVerificationCode(''); setError(''); }}
                                className="btn"
                                style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--text-secondary)' }}
                            >
                                Back to Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="container" style={{ maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Link to="/" className="logo" style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'inline-block' }}>
                        VibeClipAI
                    </Link>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Create your account
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Join VibeClipAI and start creating amazing videos
                    </p>
                </div>

                <div className="card" style={{ padding: '40px' }}>
                    <form className="space-y-6" onSubmit={handleSignUp}>
                        {error && (
                            <div style={{ backgroundColor: '#fff5f5', borderLeft: '4px solid #f56565', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                                <p style={{ fontSize: '0.875rem', color: '#c53030' }}>{error}</p>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                className="form-input"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '14px', marginTop: '12px' }}
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <div style={{ marginTop: '32px', textAlign: 'center', paddingTop: '24px', borderTop: '1.5px solid var(--border-color)' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
