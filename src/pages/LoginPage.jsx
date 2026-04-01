import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { insforge } from '../lib/insforge';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await insforge.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                throw authError;
            }

            if (data?.accessToken) {
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        try {
            await insforge.auth.signInWithOAuth({
                provider,
                redirectTo: window.location.origin,
            });
        } catch (err) {
            setError(`Failed to sign in with ${provider}`);
        }
    };

    return (
        <div className="page-wrapper" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="container" style={{ maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Link to="/" className="logo" style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'inline-block' }}>
                        VibeClipAI
                    </Link>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Welcome back
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Enter your credentials to access your account
                    </p>
                </div>

                <div className="card" style={{ padding: '40px' }}>
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div style={{ backgroundColor: '#fff5f5', borderLeft: '4px solid #f56565', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                                <p style={{ fontSize: '0.875rem', color: '#c53030' }}>{error}</p>
                            </div>
                        )}

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
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '46px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-tertiary)' }}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                                <input type="checkbox" style={{ width: '16px', height: '16px' }} />
                                Remember me
                            </label>
                            <a href="#" style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '14px' }}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div style={{ margin: '32px 0', textAlign: 'center', position: 'relative' }}>
                        <div style={{ borderTop: '1.5px solid var(--border-color)', position: 'absolute', top: '50%', left: 0, right: 0 }}></div>
                        <span style={{ position: 'relative', background: 'var(--bg-card)', padding: '0 12px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                            Or continue with
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button
                            onClick={() => handleSocialLogin('google')}
                            className="btn btn-ghost"
                            style={{ border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        >
                            Google
                        </button>
                        <button
                            onClick={() => handleSocialLogin('github')}
                            className="btn btn-ghost"
                            style={{ border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        >
                            GitHub
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
