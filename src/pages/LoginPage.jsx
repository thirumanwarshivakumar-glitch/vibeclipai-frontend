import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { insforge } from '../lib/insforge';
import {
    AmbientBlobs, LogoMark, AuthInput, PasswordInput,
    AuthButton, OAuthButton, Divider, ErrorBanner,
    GoogleIcon, GitHubIcon, cardEntrance, shakeVariants,
} from '../components/auth/AuthComponents';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [shake, setShake]       = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in both fields.');
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }

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
                window.location.href = '/';
            }
        } catch (err) {
            setError(err.message || 'Invalid email or password');
            setShake(true);
            setTimeout(() => setShake(false), 600);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        setLoading(true);
        setError('');
        try {
            await insforge.auth.signInWithOAuth({
                provider,
                redirectTo: window.location.origin,
            });
        } catch (err) {
            setError(`Failed to sign in with ${provider}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0c] px-4 py-20">
            <AmbientBlobs />

            {/* Noise texture overlay */}
            <div className="noise-overlay" />

            {/* Card */}
            <motion.div
                {...cardEntrance}
                className="relative z-10 w-full max-w-[420px]"
            >
                {/* Spotlight glow behind card */}
                <div className="absolute inset-0 -top-8 bg-violet-600/12 blur-3xl rounded-full pointer-events-none" />

                <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
                    {/* Top gradient border accent */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

                    <div className="px-8 pt-8 pb-6">
                        {/* Header */}
                        <div className="flex flex-col items-center gap-4 mb-8">
                            <motion.div
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                            >
                                <LogoMark />
                            </motion.div>
                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
                                    Welcome back
                                </h1>
                                <p className="text-sm text-zinc-500">
                                    Sign in to your VibeClipAI account
                                </p>
                            </div>
                        </div>

                        {/* OAuth buttons */}
                        <div className="flex gap-3 mb-5">
                            <OAuthButton
                                provider="Google"
                                icon={GoogleIcon}
                                onClick={() => handleSocialLogin('google')}
                                disabled={loading}
                            />
                            <OAuthButton
                                provider="GitHub"
                                icon={GitHubIcon}
                                onClick={() => handleSocialLogin('github')}
                                disabled={loading}
                            />
                        </div>

                        <Divider />

                        {/* Form */}
                        <motion.form
                            variants={shakeVariants}
                            animate={shake ? 'shake' : 'idle'}
                            onSubmit={handleLogin}
                            className="flex flex-col gap-4 mt-5"
                        >
                            {error && <ErrorBanner message={error} />}

                            <AuthInput
                                id="email"
                                type="email"
                                label="Email Address"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                icon={Mail}
                                disabled={loading}
                                autoComplete="email"
                            />

                            <PasswordInput
                                id="password"
                                label="Password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={loading}
                                autoComplete="current-password"
                            />

                            {/* Remember + Forgot row */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 rounded border border-white/20 bg-white/5 accent-violet-600 cursor-pointer"
                                    />
                                    <span className="group-hover:text-zinc-300 transition-colors">Remember me</span>
                                </label>
                                <a href="#" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                    Forgot password?
                                </a>
                            </div>

                            <div className="mt-1">
                                <AuthButton loading={loading}>
                                    Sign In
                                </AuthButton>
                            </div>
                        </motion.form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t border-white/6 bg-white/[0.02]">
                        <p className="text-center text-xs text-zinc-600">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                                Sign up for free
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 flex items-center justify-center gap-5 text-[11px] text-zinc-700"
                >
                    {['🔒 SSL Encrypted', '✦ No spam ever', '⚡ Instant access'].map(item => (
                        <span key={item}>{item}</span>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
}
