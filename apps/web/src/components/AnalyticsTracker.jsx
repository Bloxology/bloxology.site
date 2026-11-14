import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { initAnalytics, trackPageView, getSearchConsoleVerification } from '@/lib/analytics.js';

const AnalyticsTracker = () => {
  const { pathname, search } = useLocation();
  const verification = getSearchConsoleVerification();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    // Defer so Helmet has updated document.title for the new route.
    const id = setTimeout(() => trackPageView(pathname + search), 0);
    return () => clearTimeout(id);
  }, [pathname, search]);

  return verification ? (
    <Helmet>
      <meta name="google-site-verification" content={verification} />
    </Helmet>
  ) : null;
};

export default AnalyticsTracker;
