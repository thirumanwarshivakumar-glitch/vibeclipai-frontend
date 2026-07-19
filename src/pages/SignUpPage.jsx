import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, ArrowLeft, ShieldCheck } from 'lucide-react';
import { insforge } from '../lib/insforge';
import {
    AmbientBlobs, LogoMark, AuthInput, PasswordInput,
    AuthButton, OAuthButton, Divider, ErrorBanner,
    GoogleIcon, GitHubIcon, PasswordStrength,
    cardEntrance, shakeVariants,
} from '../components/auth/AuthComponents';

/* ─── OTP digit input ────────────────────────────────────────── */
function OTPInput({ value, onChange }) {
    const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

    function handleKey(i, e) {
        const v = e.target.value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = v;
        onChange(next.join(''));
        if (v && i < 5) {
            const nextInput = e.target.parentElement.children[i + 1];
            if (nextInput) nextInput.focus();
        }
    }

    function handleKeyDown(i, e) {
        if (e.key === 'Backspace' && !digits[i] && i > 0) {
            const prev = e.target.parentElement.children[i - 1];
            if (prev) prev.focus();
        }
    }

    function handlePaste(e) {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted.padEnd(6, '').slice(0, 6));
        e.preventDefault();
    }

    return (
        <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
            {digits.map((d, i) => (
                <motion.input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={d}
                    inputMode="numeric"
                    onChange={e => handleKey(i, e)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`w-11 h-12 text-center text-lg font-bold rounded-xl border text-white bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition-all duration-150 ${d ? 'border-violet-500/50 bg-violet-500/8' : 'border-white/10'}`}
                />
            ))}
        </div>
    );
}

/* ─── Verification screen ────────────────────────────────────── */
function VerifyScreen({ email, onBack, loading, error, code, setCode, onSubmit }) {
    return (
        <motion.div key="verify" {...cardEntrance} className="relative z-10 w-full max-w-[420px]">
            <div className="absolute inset-0 -top-8 bg-violet-600/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

                <div className="px-8 pt-8 pb-6">
                    <div className="flex flex-col items-center gap-4 mb-8">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center"
                        >
                            <ShieldCheck className="w-7 h-7 text-green-400" />
                        </motion.div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Verify your email</h1>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                We sent a 6-digit code to{' '}
                                <span className="font-semibold text-white">{email}</span>
                            </p>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} className="flex flex-col gap-5">
                        <AnimatePresence mode="wait">
                            {error && <ErrorBanner message={error} />}
                        </AnimatePresence>

                        <OTPInput value={code} onChange={setCode} />

                        <p className="text-center text-xs text-zinc-600">
                            Enter the code to activate your account.
                        </p>

                        <AuthButton
                            loading={loading}
                            disabled={code.replace(/\s/g, '').length < 6}
                        >
                            Verify & Continue
                        </AuthButton>
                    </form>
                </div>

                <div className="px-8 py-4 border-t border-white/6 bg-white/[0.02]">
                    <button
                        onClick={onBack}
                        className="w-full flex items-center justify-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Sign Up
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Sign Up Page ───────────────────────────────────────────── */
export default function SignUpPage() {
    const navigate = useNavigate();
    const [name, setName]         = useState('');
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState(false);
    const [shake, setShake]       = useState(false);

    const [verificationCode, setVerificationCode] = useState('');
    const [verifying, setVerifying]               = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) {
            setError('Please fill in all fields.');
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }

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
            setShake(true);
            setTimeout(() => setShake(false), 600);
        } finally {
            setLoading(false);
        }
    };

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

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0c] px-4 py-20">
                <AmbientBlobs />
                <div className="noise-overlay" />
                <AnimatePresence mode="wait">
                    <VerifyScreen
                        email={email}
                        onBack={() => { setSuccess(false); setVerificationCode(''); setError(''); }}
                        loading={verifying}
                        error={error}
                        code={verificationCode}
                        setCode={setVerificationCode}
                        onSubmit={handleVerify}
                    />
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0c] px-4 py-20">
            <AmbientBlobs />
            <div className="noise-overlay" />

            <motion.div {...cardEntrance} className="relative z-10 w-full max-w-[420px]">
                {/* Spotlight glow */}
                <div className="absolute inset-0 -top-8 bg-violet-600/12 blur-3xl rounded-full pointer-events-none" />

                <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
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
                                    Create your account
                                </h1>
                                <p className="text-sm text-zinc-500">
                                    Start creating AI videos in minutes
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
                            onSubmit={handleSignUp}
                            className="flex flex-col gap-4 mt-5"
                        >
                            {error && <ErrorBanner message={error} />}

                            <AuthInput
                                id="name"
                                type="text"
                                label="Full Name"
                                placeholder="John Doe"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                icon={User}
                                disabled={loading}
                                autoComplete="name"
                            />

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

                            <div className="flex flex-col gap-1">
                                <PasswordInput
                                    id="password"
                                    label="Password"
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={loading}
                                    autoComplete="new-password"
                                />
                                <PasswordStrength password={password} />
                            </div>

                            <div className="mt-1">
                                <AuthButton loading={loading}>
                                    Create Account
                                </AuthButton>
                            </div>

                            <p className="text-center text-[11px] text-zinc-700 leading-relaxed">
                                By creating an account you agree to our{' '}
                                <Link to="/terms" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">
                                    Terms of Service
                                </Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">
                                    Privacy Policy
                                </Link>
                            </p>
                        </motion.form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t border-white/6 bg-white/[0.02]">
                        <p className="text-center text-xs text-zinc-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                                Sign in
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
                    {['🔒 SSL Encrypted', '✦ Free to start', '⚡ No credit card'].map(item => (
                        <span key={item}>{item}</span>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
}
