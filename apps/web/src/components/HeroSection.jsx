
import React from 'react';
import { motion } from 'framer-motion';
import WalletConnector from '@/components/WalletConnector.jsx';

const HeroSection = ({ onWalletConnected }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1642422669683-01c3c4d56371)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/98 via-background/95 to-background/98" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-balance"
              style={{ letterSpacing: '-0.02em' }}
            >
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent drop-shadow-sm">
                Bloxology
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto text-shadow-sm font-medium"
            >
              Multi-Chain Crypto Platform
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="space-y-6">
              <motion.h2
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-balance"
                style={{
                  letterSpacing: '-0.02em',
                  backgroundImage: 'linear-gradient(to right, hsl(217 91% 60%), hsl(180 100% 50%), hsl(142 76% 36%))',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 10px rgba(34, 197, 255, 0.4))'
                }}
              >
                Connect Your Wallet
              </motion.h2>
              
              <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto text-shadow-sm">
                Choose your preferred wallet to access the multi-chain platform
              </p>
            </div>

            <div className="glass-card-strong rounded-2xl p-8 border-white/10 shadow-2xl">
              <WalletConnector onSuccess={onWalletConnected} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 text-sm text-[var(--text-secondary)] font-medium"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
              <span>8 Networks Supported</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_hsl(var(--secondary))]" />
              <span>Secure Connection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
              <span>Multi-Wallet Support</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
