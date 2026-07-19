import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@insforge/react';

export default function Header() {
  const { user, isLoaded } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <>
      {/* Navigation */}
      <nav id="navbar" className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 nav-glass">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-14 lg:h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white/90">VibeClips</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400/80 bg-violet-500/10 px-1.5 py-0.5 rounded-full">AI</span>
            </Link>

            <div className="hidden lg:flex items-center gap-7">
              <Link to="/" className="nav-link text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200">Home</Link>
              <Link to="/templates" className="nav-link text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200">Templates</Link>
              <a href="/#trending" className="nav-link text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200">Trending</a>
              <a href="/#how-it-works" className="nav-link text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200">How It Works</a>
              <a href="/#features" className="nav-link text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200">Features</a>
              
              <SignedIn>
                {user?.email === 'thirumanwarshivakumar@gmail.com' && (
                  <>
                    <Link to="/admin" className="nav-link text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200">Admin</Link>
                    <Link to="/admin/orders" className="nav-link text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200">Orders</Link>
                  </>
                )}
                {user?.email !== 'thirumanwarshivakumar@gmail.com' && (
                  <Link to="/orders" className="nav-link text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200">Orders</Link>
                )}
              </SignedIn>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              {!isLoaded ? (
                <div className="w-16 h-6 rounded-full bg-white/5 animate-pulse" />
              ) : (
                <>
                  <SignedOut>
                    <Link to="/login" className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">Sign In</Link>
                    <Link to="/signup" className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-full transition-all duration-200">
                      Get Started
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </>
              )}
            </div>

            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-white/70" aria-label="Open menu">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu fixed inset-0 z-[60] bg-ink-950/98 backdrop-blur-xl ${mobileOpen ? 'open' : ''}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold text-white">VibeClips</span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-white/70" aria-label="Close menu">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <Link to="/" className="py-3 text-xl font-semibold text-white/80 hover:text-violet-400 transition-colors">Home</Link>
            <Link to="/templates" className="py-3 text-xl font-semibold text-white/80 hover:text-violet-400 transition-colors">Templates</Link>
            <a href="/#how-it-works" className="py-3 text-xl font-semibold text-white/80 hover:text-violet-400 transition-colors">How It Works</a>
            <a href="/#features" className="py-3 text-xl font-semibold text-white/80 hover:text-violet-400 transition-colors">Features</a>
            <SignedIn>
              {user?.email === 'thirumanwarshivakumar@gmail.com' && (
                <>
                  <Link to="/admin" className="py-3 text-xl font-semibold text-white/80 hover:text-violet-400 transition-colors">Admin</Link>
                  <Link to="/admin/orders" className="py-3 text-xl font-semibold text-white/80 hover:text-violet-400 transition-colors">Orders</Link>
                </>
              )}
              {user?.email !== 'thirumanwarshivakumar@gmail.com' && (
                <Link to="/orders" className="py-3 text-xl font-semibold text-white/80 hover:text-violet-400 transition-colors">Orders</Link>
              )}
            </SignedIn>
          </div>
          <div className="mt-auto flex flex-col gap-3">
            {!isLoaded ? (
              <div className="h-10 rounded-full bg-white/5 animate-pulse" />
            ) : (
              <>
                <SignedOut>
                  <Link to="/login" className="text-center py-2.5 text-[13px] font-medium text-white/50 hover:text-white transition-colors">Sign In</Link>
                  <Link to="/signup" className="text-center py-2.5 text-[13px] font-semibold text-white bg-white/10 rounded-full hover:bg-white/15 transition-colors">Get Started</Link>
                </SignedOut>
                <SignedIn>
                  <div className="flex justify-center py-2.5">
                    <UserButton />
                  </div>
                </SignedIn>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
