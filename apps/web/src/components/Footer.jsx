
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Github, X, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <>
      <Helmet>
        <meta name="base:app_id" content="69bf08ba1465da0849435af2" />
      </Helmet>
      <footer className="border-t border-border/50 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200">
                <img 
                  src="https://horizons-cdn.hostinger.com/c39b4b4c-cce3-4597-b59b-2cc69cfe80ed/b2bd7621770a2a1eb770c2fa7581485a.png" 
                  alt="Bloxology logo"
                  className="h-8 sm:h-9 w-auto"
                />
                <span className="text-xl font-bold text-[var(--text-primary)]">Bloxology</span>
              </Link>
              <p className="text-sm text-[var(--text-muted)] max-w-xs">
                Multi-chain crypto platform supporting 8 blockchain networks with secure wallet integration.
              </p>
            </div>

            <div className="space-y-4">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Quick Links</span>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200">
                  Terms of Service
                </a>
                <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200">
                  Documentation
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Connect</span>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg glass-card hover:glass-card-strong flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 active:scale-[0.98]"
                  aria-label="GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="https://x.com/Bloxologysite"
                  className="w-10 h-10 rounded-lg glass-card hover:glass-card-strong flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 active:scale-[0.98]"
                  aria-label="X"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <X className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg glass-card hover:glass-card-strong flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 active:scale-[0.98]"
                  aria-label="Discord"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50">
            <p className="text-sm text-[var(--text-muted)] text-center">
              © 2026 Bloxology. Built for the multi-chain future.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
