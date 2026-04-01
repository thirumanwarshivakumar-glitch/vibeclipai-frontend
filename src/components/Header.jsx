import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@insforge/react';

export default function Header() {
    const { user } = useUser();
    const [dark, setDark] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }, [dark]);

    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    const isActive = (path) => location.pathname === path;

    return (
        <header className="header" id="header">
            <div className="header-inner">
                <Link to="/" className="logo">VibeClipAI</Link>

                <nav className={`nav${mobileOpen ? ' mobile-open' : ''}`}>
                    <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`}>Home</Link>
                    <Link to="/templates" className={`nav-link${isActive('/templates') ? ' active' : ''}`}>Templates</Link>
                    <a href="/#how-it-works" className="nav-link">How it Works</a>
                    <SignedIn>
                        {user?.email === 'thirumanwarshivakumar@gmail.com' && (
                            <Link to="/admin" className={`nav-link${isActive('/admin') ? ' active' : ''}`}>Admin</Link>
                        )}
                        <Link to="/orders" className={`nav-link${isActive('/orders') ? ' active' : ''}`}>Orders</Link>
                    </SignedIn>

                    <div className="auth-nav-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                        <SignedOut>
                            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                            <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>

                    <button className="theme-toggle" onClick={() => setDark(!dark)} aria-label="Toggle theme" style={{ marginLeft: '8px' }}>
                        {dark ? '☀️' : '🌙'}
                    </button>
                </nav>

                <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </header>
    );
}
