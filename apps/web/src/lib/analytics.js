// Analytics / Search Console hooks. All IDs come from build-time env; nothing is hard-coded.
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const GSC_VERIFICATION = import.meta.env.VITE_GSC_VERIFICATION;

const GA_ID_PATTERN = /^G-[A-Z0-9]+$/;

export const getSearchConsoleVerification = () => GSC_VERIFICATION || null;

export const initAnalytics = () => {
  if (typeof document === 'undefined' || !GA_ID || !GA_ID_PATTERN.test(GA_ID)) return;
  if (window.__gaInitialized) return;
  window.__gaInitialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  // SPA: page views are sent manually on route change.
  window.gtag('config', GA_ID, { send_page_view: false });
};

export const trackPageView = (path) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
};

export const trackEvent = (name, params = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
};
