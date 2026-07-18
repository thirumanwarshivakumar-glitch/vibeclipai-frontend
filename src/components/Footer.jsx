import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] pt-14 pb-8 relative z-10 bg-ink-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-10 mb-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-2 lg:mb-0">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold text-white/90">VibeClips</span>
            </Link>
            <p className="text-[12px] text-white/30 leading-relaxed max-w-[200px]">
              AI-powered video creation for everyone. No editing skills needed.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-3">Product</h4>
            <ul className="space-y-2.5">
              <li><Link to="/templates" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">Templates</Link></li>
              <li><a href="/#features" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">Features</a></li>
              <li><Link to="/templates" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">Pricing</Link></li>
              <li><a href="#" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">API</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-3">Company</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">Careers</a></li>
              <li><Link to="/contact" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-3">Support</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">Help Center</a></li>
              <li><Link to="/privacy" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">Privacy</Link></li>
              <li><Link to="/terms" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">Terms</Link></li>
              <li><Link to="/refund-policy" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link to="/merchant-declaration" className="footer-link text-[12px] text-white/45 hover:text-white transition-colors" style={{ display: 'none' }}>Merchant Declaration</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-3">Follow</h4>
            <div className="flex items-center gap-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-white/25">© 2026 VibeClipAI. All rights reserved.</p>
          <p className="text-[11px] text-white/25">Made with AI in India</p>
        </div>
      </div>
    </footer>
  );
}
