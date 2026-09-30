
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
        <title>Bloxology - Multi-Chain Crypto Platform</title>
        <meta
          name="description"
          content="Connect your wallet to Bloxology and access 7 blockchain networks including Ethereum, Base, Polygon, Solana, Kava, Sonic, and Flow."
        />
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
