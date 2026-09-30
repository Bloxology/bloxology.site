
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Wallet, Droplets, ArrowLeftRight, Lock, LineChart, Shield, Zap, Globe, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FEATURES = [
  {
    icon: LineChart,
    title: 'Price Chart',
    description: 'Real-time price tracking with interactive charts and customizable alerts'
  },
  {
    icon: Wallet,
    title: 'Token Balance Checker',
    description: 'Check token balances across multiple blockchain networks'
  },
  {
    icon: Droplets,
    title: 'Liquidity Pool',
    description: 'Add and remove liquidity from decentralized pools'
  },
  {
    icon: ArrowLeftRight,
    title: 'Token Swap',
    description: 'Swap tokens instantly with competitive rates and low slippage'
  },
  {
    icon: Lock,
    title: 'Token Locker',
    description: 'Lock tokens with time-based release schedules'
  },
  {
    icon: Shield,
    title: 'Secure',
    description: 'Non-custodial architecture keeps your assets under your control'
  },
  {
    icon: Zap,
    title: 'Fast',
    description: 'Optimized for speed with instant transaction processing'
  },
  {
    icon: Globe,
    title: 'Multi-Chain',
    description: 'Support for 8 major blockchain networks'
  }
];

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About - Bloxology</title>
        <meta name="description" content="Learn about Bloxology, the comprehensive multi-chain DeFi platform" />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-4"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl crypto-gradient flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                <Wallet className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
              About Bloxology
            </h1>
            <p className="text-xl text-[var(--text-secondary)] font-medium max-w-2xl mx-auto">
              A comprehensive multi-chain DeFi platform built for the next generation of decentralized finance
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)]">Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-[var(--text-secondary)] font-medium leading-relaxed">
                <p>
                  Bloxology is designed to make decentralized finance accessible to everyone. We believe that financial tools should be open, transparent, and available to anyone with an internet connection.
                </p>
                <p>
                  Our platform brings together essential DeFi tools in one unified interface, supporting multiple blockchain networks to give you the freedom to operate wherever your assets are.
                </p>
                <p>
                  Built with security and user experience at the forefront, Bloxology provides professional-grade tools without compromising on simplicity or safety.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Brand Identity & Logo Design Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="glass-card border-primary/30 shadow-[0_0_40px_rgba(59,130,246,0.1)] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                  <Palette className="h-5 w-5 text-primary" />
                  Brand Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                  The Bloxology logo represents the intersection of blockchain technology and seamless user experience. 
                  Our design philosophy embraces the dark, neon-lit aesthetics of cyberpunk and Web3 culture, utilizing 
                  glassmorphism to create depth and clarity. The interconnected blocks symbolize our multi-chain approach 
                  and the foundational building blocks of decentralized finance.
                </p>
                
                <div className="relative w-full rounded-xl overflow-hidden border border-primary/20 bg-black/40 shadow-lg aspect-video">
                  <iframe 
                    loading="lazy" 
                    className="absolute top-0 left-0 w-full h-full border-none"
                    src="https://www.canva.com/design/DAHEy0CsOM8/XOzGWKOVCvabqQYfovJG5Q/watch?embed" 
                    allowFullScreen="allowfullscreen" 
                    allow="fullscreen"
                    title="Bloxology Logo Design"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                    >
                      <Card className="glass-card border-border/50 h-full hover:glass-card-strong transition-all duration-200">
                        <CardContent className="p-6 space-y-3">
                          <div className="w-12 h-12 rounded-lg crypto-gradient flex items-center justify-center">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-bold text-lg text-[var(--text-primary)]">{feature.title}</h3>
                          <p className="text-sm text-[var(--text-secondary)] font-medium">{feature.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)]">Supported Networks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Ethereum', 'Base', 'Polygon', 'Solana', 'Kava', 'Sonic', 'Flow'].map((network, index) => (
                    <div key={index} className="glass-card p-3 rounded-lg text-center">
                      <span className="font-bold text-[var(--text-primary)]">{network}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)]">Version Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[var(--text-secondary)] font-medium">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="font-mono text-[var(--text-primary)] font-bold">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Release Date</span>
                  <span className="text-[var(--text-primary)] font-bold">March 2026</span>
                </div>
                <div className="flex justify-between">
                  <span>License</span>
                  <span className="text-[var(--text-primary)] font-bold">MIT</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="text-center space-y-4"
          >
            <p className="text-[var(--text-secondary)] font-medium">
              Built with React, TailwindCSS, and powered by decentralized protocols
            </p>
            <div className="flex justify-center gap-4 text-sm text-[var(--text-secondary)] font-medium">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
