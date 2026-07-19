import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchTemplates } from "../lib/api";
import Spline from '@splinetool/react-spline';

// ── SplineHero: loading skeleton + error boundary + demo label ──────────────
class SplineBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e) { console.warn('[SplineHero]', e.message); }
  render() {
    if (this.state.err) return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-[11px] uppercase tracking-wider text-white/30 font-semibold">3D Scene Unavailable</p>
      </div>
    );
    return this.props.children;
  }
}

function SplineHero({ scene }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="relative w-full h-full">
      {/* Pulsing loader — hidden once scene fires onLoad */}
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-violet-500/50 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-violet-500/20" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30 animate-pulse">Loading 3D scene…</p>
        </div>
      )}
      <SplineBoundary>
        <Spline
          scene={scene}
          onLoad={() => setReady(true)}
          style={{ width: '100%', height: '100%', display: 'block', opacity: ready ? 1 : 0, transition: 'opacity 0.6s ease' }}
        />
      </SplineBoundary>
    </div>
  );
}
// ───────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates({ isFavorite: true })
      .then((data) => {
        setTemplates(data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch templates:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div id="home-view" className="view-section active">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background orbs */}
        <div className="orb orb-violet" />
        <div className="orb orb-cyan" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          {/* Hero card — dark glassmorphic container */}
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0d0d10] border border-white/[0.06] shadow-2xl shadow-black/70">

            {/* Spotlight beam — animates in, positioned over the right column */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <svg
                className="animate-spotlight absolute z-[1] opacity-0"
                style={{ top: '-30%', right: '-5%', width: '65%', height: '150%' }}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 3787 2842"
                fill="none"
              >
                <g filter="url(#hero-spotlight)">
                  <ellipse
                    cx="1924.71" cy="273.501" rx="1924.71" ry="273.501"
                    transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
                    fill="white" fillOpacity="0.18"
                  />
                </g>
                <defs>
                  <filter id="hero-spotlight" x="0.86" y="0.84" width="3785.16" height="2840.26"
                    filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur" />
                  </filter>
                </defs>
              </svg>
            </div>

            {/* Two-column grid */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1fr] items-center">

              {/* ── LEFT: Text ── */}
              <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-14 py-12 lg:py-16 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 self-center lg:self-start px-3 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/90">Powered by Veo 3 AI</span>
                </div>

                {/* Headline — matches reference size & weight */}
                <h1 className="text-[2.6rem] sm:text-5xl lg:text-[3.6rem] font-bold tracking-tight leading-[1.05] mb-5 font-display">
                  Create Stunning<br />
                  <span className="text-gradient">AI-Powered</span><br />
                  <span className="text-gradient">Videos</span><br />
                  <span className="text-white/60 font-light text-[2rem] sm:text-4xl lg:text-[2.8rem]">in Minutes</span>
                </h1>

                <p className="text-[0.95rem] text-white/40 max-w-sm mx-auto lg:mx-0 mb-8 leading-relaxed">
                  Pick a template, personalize, pay, and get your video link by email. No editing skills needed — our AI does the magic.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-9">
                  <Link
                    to="/templates"
                    className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-full transition-all duration-200 shadow-lg shadow-violet-600/30"
                  >
                    Browse Templates
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 px-7 py-3 text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all duration-200"
                  >
                    See How It Works
                  </a>
                </div>

                {/* Social proof */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                  <div className="flex -space-x-2.5">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" className="w-8 h-8 rounded-full border-2 border-[#0d0d10] object-cover" alt="" />
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" className="w-8 h-8 rounded-full border-2 border-[#0d0d10] object-cover" alt="" />
                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" className="w-8 h-8 rounded-full border-2 border-[#0d0d10] object-cover" alt="" />
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" className="w-8 h-8 rounded-full border-2 border-[#0d0d10] object-cover" alt="" />
                    <div className="w-8 h-8 rounded-full border-2 border-[#0d0d10] bg-violet-500/15 flex items-center justify-center text-[10px] font-bold text-violet-300">+10k</div>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white/70">Loved by 10,000+ creators</p>
                    <p className="text-[11px] text-white/30">Starting at just ₹199 per video</p>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Spline 3D Scene ── */}
              <div className="relative w-full aspect-square lg:aspect-auto lg:h-[540px] overflow-hidden">
                {/* Scene fills the right column edge-to-edge inside the card */}
                <SplineHero scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Trending Templates Carousel */}
      <section id="trending" className="relative py-20 lg:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 mb-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400/80 mb-2 block">Trending Now</span>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/90 font-display">Most Popular Templates</h2>
            </div>
            <Link to="/templates" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-violet-400 hover:text-violet-300 transition-colors">
              View all
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative group max-w-7xl mx-auto">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-ink-900 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-ink-900 to-transparent z-10 pointer-events-none"></div>
          
          <div className="overflow-hidden cursor-grab active:cursor-grabbing px-6 lg:px-10">
            <div className="trending-track">
              {loading ? (
                <div className="text-white/50 text-sm">Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="text-white/50 text-sm">No trending templates available.</div>
              ) : (
                [...templates, ...templates].map((t, idx) => (
                  <div key={`${t.id}-${idx}`} className="template-card w-64 sm:w-72 flex-shrink-0 bg-ink-800/50 border border-white/[0.06] rounded-xl overflow-hidden group">
                    <div className="relative aspect-[4/3] bg-[#111115] overflow-hidden flex items-center justify-center">
                      {(() => {
                        const url = t.preview_image || t.preview_video_url;
                        const isVideo = url && url.match(/\.(mp4|webm|mov|avi|m4v|ogv)(\?.*)?$/i);
                        
                        if (isVideo) {
                          return (
                            <video
                              src={url}
                              muted
                              loop
                              autoPlay
                              playsInline
                              preload="metadata"
                              className="card-image w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                          );
                        }
                        
                        return (
                          <img 
                            src={url} 
                            alt={t.title || t.name} 
                            className="card-image w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" 
                            loading="lazy" 
                          />
                        );
                      })()}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent pointer-events-none"></div>
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 bg-white/10 backdrop-blur-sm rounded-full">
                          {t.category || (t.tags && t.tags[0]) || 'General'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <button onClick={() => navigate(`/template/${t.id}`)} className="play-btn w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                          <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-[13px] font-semibold text-white/90 mb-1 group-hover:text-violet-300 transition-colors truncate">{t.title || t.name}</h3>
                      <p className="text-[11px] text-white/40 line-clamp-2 mb-3 leading-relaxed">{t.description}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[14px] font-bold text-white/90">₹{t.price?.toFixed(2)}</span>
                        <button onClick={() => navigate(`/template/${t.id}`)} className="px-3 py-1.5 text-[11px] font-semibold text-white/90 bg-white/10 hover:bg-white/15 rounded-full transition-colors">
                          Use Template
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400/80 mb-2 block">How It Works</span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/90 font-display">
              From Idea to Video in <span className="text-cyan-400/70 font-light">3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <span className="text-sm font-bold text-violet-400">1</span>
              </div>
              <h3 className="text-[15px] font-semibold text-white/90 mb-1.5">Pick a Template</h3>
              <p className="text-[13px] text-white/40 leading-relaxed max-w-xs mx-auto">
                Browse our curated collection of AI-powered video templates. Filter by occasion or AI engine.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <span className="text-sm font-bold text-cyan-400">2</span>
              </div>
              <h3 className="text-[15px] font-semibold text-white/90 mb-1.5">Personalize & Pay</h3>
              <p className="text-[13px] text-white/40 leading-relaxed max-w-xs mx-auto">
                Upload photos, enter names, and customize details. Secure checkout per video.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <span className="text-sm font-bold text-rose-400">3</span>
              </div>
              <h3 className="text-[15px] font-semibold text-white/90 mb-1.5">Get Your Video</h3>
              <p className="text-[13px] text-white/40 leading-relaxed max-w-xs mx-auto">
                Our AI renders in minutes. Receive a high-quality download link in your email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/80 mb-2 block">Features</span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/90 font-display">
              Why Creators Love <span className="text-gradient">VibeClips</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { color: "violet", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z", title: "Veo 3 AI Engine", desc: "Google's latest Veo 3 for photorealistic video generation with unmatched detail." },
              { color: "cyan", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z", title: "Kling Motion Control", desc: "Animate any character with precise motion matching from reference videos." },
              { color: "rose", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z", title: "Minutes, Not Hours", desc: "Get your finished video delivered in minutes via email." },
              { color: "amber", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z", title: "Zero Editing Skills", desc: "No complex software. Just upload, customize, and let AI create." },
              { color: "violet", icon: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z", title: "4K Quality Output", desc: "Every video renders in stunning 4K with professional color grading." },
              { color: "cyan", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z", title: "Instant Delivery", desc: "Receive your video link directly in your inbox within minutes." },
              { color: "rose", icon: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z", title: "Secure Payments", desc: "UPI, cards, and wallets accepted with bank-grade encryption." },
              { color: "amber", icon: "M15 19.128a9.38 9.38 0 002.625.364 9.375 9.375 0 006.375-2.625 9.375 9.375 0 00-6.375-2.625 9.38 9.38 0 00-2.625.364m-15 0a9.38 9.38 0 002.625-.364 9.375 9.375 0 006.375 2.625 9.375 9.375 0 00-6.375 2.625 9.38 9.38 0 00-2.625-.364m0 0V5.625A2.625 2.625 0 012.625 3h14.75A2.625 2.625 0 0120 5.625v9.75m-15 0V5.625A2.625 2.625 0 015.625 3h14.75A2.625 2.625 0 0120 5.625v9.75", title: "Pay Per Video", desc: "No subscriptions. Only pay for the videos you create, starting at ₹199." }
            ].map((f, i) => (
              <div key={i} className={`group p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-${f.color}-500/20 transition-all duration-300`}>
                <div className={`w-9 h-9 rounded-lg bg-${f.color}-500/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  <svg className={`w-4 h-4 text-${f.color}-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-[13px] font-semibold text-white/90 mb-1">{f.title}</h3>
                <p className="text-[12px] text-white/35 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 lg:py-28 border-t border-white/[0.04] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.03] via-transparent to-cyan-500/[0.03]"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/90 font-display mb-3">
              Ready to Create Your <span className="text-gradient">First AI Video?</span>
            </h2>
            <p className="text-base text-white/40 mb-8 max-w-md mx-auto">
              Join 10,000+ creators. No subscription, no credit card required to browse.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/templates" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-full transition-all duration-200 shadow-lg shadow-violet-600/20">
                Browse All Templates
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-medium text-white/60 hover:text-white border border-white/10 rounded-full transition-all duration-200">
                Watch Demo
                <svg className="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
