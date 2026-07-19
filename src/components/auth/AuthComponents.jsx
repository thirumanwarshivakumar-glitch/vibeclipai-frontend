import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Zap } from 'lucide-react';
import { useState } from 'react';

/* ─── Google SVG Icon ──────────────────────────────────────────── */
export function GoogleIcon({ className = 'w-4 h-4' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

/* ─── GitHub Icon ──────────────────────────────────────────────── */
export function GitHubIcon({ className = 'w-4 h-4' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
    );
}

/* ─── Logo Mark ────────────────────────────────────────────────── */
export function LogoMark() {
    return (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="w-5 h-5 text-white" />
        </div>
    );
}

/* ─── Icon-prefixed Input ──────────────────────────────────────── */
export function AuthInput({ id, type = 'text', label, placeholder, value, onChange, icon: Icon, error, disabled, autoComplete, rightElement }) {
    const [focused, setFocused] = useState(false);
    const hasError = !!error;

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {label}
            </label>
            <motion.div
                animate={{
                    boxShadow: hasError
                        ? '0 0 0 2px rgba(239,68,68,0.5)'
                        : focused
                            ? '0 0 0 2px rgba(124,58,237,0.5)'
                            : '0 0 0 1px rgba(255,255,255,0.08)',
                }}
                transition={{ duration: 0.15 }}
                className="relative flex items-center rounded-xl overflow-hidden bg-white/[0.04]"
            >
                {Icon && (
                     <div className={`absolute left-3.5 flex items-center pointer-events-none transition-colors duration-150 ${focused ? 'text-violet-400' : hasError ? 'text-red-400' : 'text-zinc-600'}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    className={`w-full bg-transparent text-white placeholder-zinc-600 text-sm py-3 pr-4 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${Icon ? 'pl-10' : 'pl-4'}`}
                />
                {rightElement && (
                    <div className="absolute right-3.5 flex items-center">{rightElement}</div>
                )}
            </motion.div>
            {hasError && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
}

/* ─── Password Input (with toggle) ────────────────────────────── */
export function PasswordInput({ id, label = 'Password', placeholder = '••••••••', value, onChange, error, disabled, autoComplete }) {
    const [show, setShow] = useState(false);
    return (
        <AuthInput
            id={id}
            type={show ? 'text' : 'password'}
            label={label}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            icon={Lock}
            error={error}
            disabled={disabled}
            autoComplete={autoComplete}
            rightElement={
                <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer p-0.5"
                    tabIndex={-1}
                    aria-label={show ? 'Hide password' : 'Show password'}
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            }
        />
    );
}

/* ─── Primary Submit Button ────────────────────────────────────── */
export function AuthButton({ children, loading, disabled, type = 'submit', onClick }) {
    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={loading || disabled}
            whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.975 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative w-full py-3 px-6 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden"
        >
            {loading ? (
                <>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <span>Please wait…</span>
                </>
            ) : children}
        </motion.button>
    );
}

/* ─── OAuth Button ─────────────────────────────────────────────── */
export function OAuthButton({ provider, icon: Icon, onClick, disabled }) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: disabled ? 1 : 0.97 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full border border-white/10 bg-white/[0.04] text-sm font-medium text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
        >
            <Icon className="w-4 h-4" />
            {provider}
        </motion.button>
    );
}

/* ─── Divider ──────────────────────────────────────────────────── */
export function Divider({ label = 'or continue with' }) {
    return (
        <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider whitespace-nowrap">{label}</span>
            <div className="flex-1 h-px bg-white/8" />
        </div>
    );
}

/* ─── Error Banner ─────────────────────────────────────────────── */
export function ErrorBanner({ message }) {
    if (!message) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8 text-sm text-red-400"
        >
            <span className="mt-0.5 text-red-500 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </span>
            {message}
        </motion.div>
    );
}

/* ─── Card container entrance animation ───────────────────────── */
export const cardEntrance = {
    initial: { opacity: 0, y: 24, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: 'spring', stiffness: 280, damping: 28, delay: 0.05 },
};

/* ─── Shake animation (for validation error) ───────────────────── */
export const shakeVariants = {
    idle: { x: 0 },
    shake: { x: [0, -8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.45, ease: 'easeOut' } },
};

/* ─── Ambient glow blobs ───────────────────────────────────────── */
export function AmbientBlobs() {
    return (
        <>
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/8 blur-[100px]" />
                <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-cyan-600/6 blur-[80px]" />
            </div>
        </>
    );
}

/* ─── Password Strength Indicator ──────────────────────────────── */
export function PasswordStrength({ password }) {
    if (!password) return null;

    function score(p) {
        let s = 0;
        if (p.length >= 8) s++;
        if (p.length >= 12) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    }

    const s = score(password);
    const levels = [
        { label: 'Too short', color: 'bg-red-500' },
        { label: 'Weak', color: 'bg-orange-500' },
        { label: 'Fair', color: 'bg-yellow-500' },
        { label: 'Good', color: 'bg-blue-400' },
        { label: 'Strong', color: 'bg-green-500' },
        { label: 'Very strong', color: 'bg-emerald-400' },
    ];
    const level = levels[Math.min(s, 5)];

    return (
        <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex gap-1">
                {[0,1,2,3,4].map(i => (
                    <motion.div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < s ? level.color : 'bg-white/10'}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.04 }}
                    />
                ))}
            </div>
            <p className={`text-[11px] font-medium ${s <= 1 ? 'text-red-400' : s <= 2 ? 'text-orange-400' : s <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                {level.label}
            </p>
        </div>
    );
}
