import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import WelcomeEmailHandler from './components/WelcomeEmailHandler';
import Footer from './components/Footer';

// GA4 Route-Change Pageview Tracker
function PageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      // Sanitize URL: Strip sensitive query params (e.g. orderId, tokens) from tracking
      const cleanPath = location.pathname;
      window.gtag('event', 'page_view', {
        page_path: cleanPath,
        page_title: document.title,
        page_location: `${window.location.origin}${cleanPath}`,
      });
    }
  }, [location.pathname]);

  return null;
}

// Lazy-loaded page components
const HomePage = lazy(() => import('./pages/HomePage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const TemplateDetailPage = lazy(() => import('./pages/TemplateDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const RefundPage = lazy(() => import('./pages/RefundPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const MerchantDeclarationPage = lazy(() => import('./pages/MerchantDeclarationPage'));

export default function App() {
  return (
    <BrowserRouter>
      <PageTracking />
      <div className="noise-overlay"></div>
      <Header />
      <WelcomeEmailHandler />
      <Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center bg-[#0a0a0c]">
          <div className="w-8 h-8 border-2 border-violet-600/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      }>
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
        </Routes>
      </Suspense>
      <Footer />
    </BrowserRouter>
  );
}
