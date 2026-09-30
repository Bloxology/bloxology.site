
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { useBaseAuth, useNetwork } from '@/contexts/BaseAuthContext.jsx';
import { getWalletProvider, switchNetwork } from '@/utils/walletIntegration.js';
import { toast } from 'sonner';
import AddressSwitcher from '@/components/AddressSwitcher.jsx';
import CustomCoinPortfolio from '@/components/CustomCoinPortfolio.jsx';
import NetworkSelector from '@/components/NetworkSelector.jsx';
import TransactionHistory from '@/components/TransactionHistory.jsx';

const DashboardPage = () => {
  const { wallet, walletType } = useWallet();
  const { activeAddress } = useBaseAuth();
  const { selectedNetwork, setSelectedNetwork } = useNetwork();
  const [isSwitching, setIsSwitching] = useState(false);
  const displayAddress = activeAddress || wallet;

  // Note: We removed the inline !isConnected check here because 
  // ProtectedRoute already handles the authentication verification and redirection.
  // This prevents conflicting protection logic and double-rendering issues.

  const handleNetworkChange = async (network) => {
    if (network.id === selectedNetwork.id) return;
    
    setIsSwitching(true);
    try {
      const provider = getWalletProvider(walletType);
      if (provider) {
        await switchNetwork(provider, network);
      }
      setSelectedNetwork(network);
      toast.success(`Switched to ${network.name}`);
    } catch (error) {
      console.error('Network switch failed:', error);
      toast.error(error.message || 'Failed to switch network');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Bloxology</title>
        <meta name="description" content="View your crypto portfolio and manage your assets" />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
                Dashboard
              </h1>
              <p className="text-lg text-[var(--text-secondary)] font-medium">
                Overview of your connected accounts and assets
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mt-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Connected: {displayAddress?.slice(0, 6)}...{displayAddress?.slice(-4)} ({walletType})
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Network:</span>
              <NetworkSelector 
                selectedNetwork={selectedNetwork} 
                onNetworkChange={handleNetworkChange}
                disabled={isSwitching}
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <AddressSwitcher />
            </div>
            <div className="lg:col-span-3 space-y-8">
              <CustomCoinPortfolio selectedNetwork={selectedNetwork} />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <TransactionHistory 
                  currentNetwork={selectedNetwork} 
                  walletAddress={displayAddress} 
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
