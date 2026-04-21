
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext.jsx';
import HeroSection from '@/components/HeroSection.jsx';
import DeFiSuite from '@/components/DeFiSuite.jsx';

const HomePage = () => {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  return (
    <>
      <Helmet>
        <title>Bloxology | Base DeFi App</title>
        <meta
          name="description"
          content="Bloxology is a Base-first DeFi app for token swaps, liquidity tools, token locking, and portfolio management."
        />
        <link rel="canonical" href="https://bloxology.site/" />
        <meta property="og:title" content="Bloxology | Base DeFi App" />
        <meta property="og:description" content="Swap tokens, explore liquidity, lock assets, and manage your portfolio on Base with Bloxology." />
        <meta property="og:url" content="https://bloxology.site/" />
      </Helmet>

      <div className="min-h-screen pt-8">
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <HeroSection />
            </motion.div>
          ) : (
            <motion.div
              key="defi-suite"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DeFiSuite />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default HomePage;
