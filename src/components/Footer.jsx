import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer" id="footer">
            <div className="footer-inner">
                <div className="footer-left">
                    <span className="footer-logo">VibeClipAI</span>
                    <span className="footer-copyright">© 2026 VibeClipAI. All rights reserved.</span>
                </div>
                <div className="footer-links">
                    <Link to="/terms" className="footer-link">Terms & Conditions</Link>
                    <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                    <Link to="/refund-policy" className="footer-link">Refund Policy</Link>
                    <Link to="/contact" className="footer-link">Contact Us</Link>
                    <Link to="/merchant-declaration" className="footer-link">Merchant Declaration</Link>
                    <a href="mailto:support@vibeclipai.com" className="footer-link">Support</a>
                </div>
            </div>
        </footer>
    );
}
