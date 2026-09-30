
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { WalletProvider } from '@/contexts/WalletContext.jsx';
import { BaseAuthProvider } from '@/contexts/BaseAuthContext.jsx';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';

// Pages
import HomePage from '@/pages/HomePage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import SwapPage from '@/pages/SwapPage.jsx';
import LiquidityPage from '@/pages/LiquidityPage.jsx';
import LockPage from '@/pages/LockPage.jsx';
import TransactionDetailsPage from '@/pages/TransactionDetailsPage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import HelpPage from '@/pages/HelpPage.jsx';
import AboutPage from '@/pages/AboutPage.jsx';
import ContactPage from '@/pages/ContactPage.jsx';
import DebugTokensPage from '@/pages/DebugTokensPage.jsx';

function App() {
  return (
    <WalletProvider>
      <BaseAuthProvider>
        <Router>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pt-16">
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  
                  {/* Development/Debug Routes - Publicly accessible for testing */}
                  <Route path="/debug-tokens" element={<DebugTokensPage />} />

                  {/* Protected Routes */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/swap" 
                    element={
                      <ProtectedRoute>
                        <SwapPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/liquidity" 
                    element={
                      <ProtectedRoute>
                        <LiquidityPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/lock" 
                    element={
                      <ProtectedRoute>
                        <LockPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/transaction/:hash" 
                    element={
                      <ProtectedRoute>
                        <TransactionDetailsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Catch-all 404 Route */}
                  <Route path="*" element={
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                      <h1 className="text-6xl font-extrabold text-[var(--text-primary)] mb-4">404</h1>
                      <p className="text-xl text-[var(--text-secondary)] mb-8">Page not found</p>
                      <a href="/" className="text-primary hover:underline font-medium">Back to home</a>
                    </div>
                  } />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
          <Toaster />
        </Router>
      </BaseAuthProvider>
    </WalletProvider>
  );
}

export default App;
