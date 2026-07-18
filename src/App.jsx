import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import WelcomeEmailHandler from './components/WelcomeEmailHandler';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TemplatesPage from './pages/TemplatesPage';
import TemplateDetailPage from './pages/TemplateDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import SuccessPage from './pages/SuccessPage';
import AdminPage from './pages/AdminPage';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RefundPage from './pages/RefundPage';
import ContactPage from './pages/ContactPage';
import MerchantDeclarationPage from './pages/MerchantDeclarationPage';
// ─── Design Preview (remove after approval) ───────────────────
import LoginPreview from '../design-preview/auth/LoginPreview';
import SignUpPreview from '../design-preview/auth/SignUpPreview';


export default function App() {
  return (
    <BrowserRouter>
      <div className="noise-overlay"></div>
      <Header />
      <WelcomeEmailHandler />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/template/:id" element={<TemplateDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund-policy" element={<RefundPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/merchant-declaration" element={<MerchantDeclarationPage />} />
        {/* ── Design Preview routes (remove after approval) ── */}
        <Route path="/preview/login" element={<LoginPreview />} />
        <Route path="/preview/signup" element={<SignUpPreview />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
