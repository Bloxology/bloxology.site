
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getTransactionUrl } from '@/utils/etherscanLinks.js';
import TransactionStatusBadge from './TransactionStatusBadge.jsx';

const normaliseDisplayError = (value, network) => {
  if (!value || typeof value !== 'string') {
    return value;
  }

  const lower = value.toLowerCase();
  if (
    lower.includes("failed to execute 'json' on 'response'") ||
    lower.includes('unexpected end of json input') ||
    lower.includes('json parse error') ||
    lower.includes('json rpc error')
  ) {
    const onNetwork = network ? ` on ${network}` : '';
    return `Your wallet's RPC returned an empty response${onNetwork}. Make sure your wallet is switched correctly and try again.`;
  }

  return value;
};

const TransactionStatus = ({ status, hash, network, message, error }) => {
  const [currentStatus, setCurrentStatus] = useState(status);

  // Sync prop status to local state
  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  // Simulate auto-updating status for UI feedback if pending
  useEffect(() => {
    if (currentStatus === 'pending' && hash) {
      const timer = setTimeout(() => {
        // In a real app, we would poll the backend or RPC here.
        // For this demo, we'll transition to success after 10 seconds if it's still pending.
        setCurrentStatus('success');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentStatus, hash]);

  if (!currentStatus || currentStatus === 'idle') return null;

  const explorerUrl = getTransactionUrl(hash, network);
  const displayError = normaliseDisplayError(error || message || 'An error occurred.', network);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full mt-4"
      >
        <Alert className={`glass-card border-l-4 ${
          currentStatus === 'pending' ? 'border-l-primary bg-primary/5' :
          currentStatus === 'success' ? 'border-l-green-500 bg-green-500/5' :
          'border-l-destructive bg-destructive/5'
        }`}>
          <div className="flex items-start justify-between w-full">
            <div className="flex-1">
              <AlertTitle className="font-bold flex items-center gap-2 mb-1">
                <TransactionStatusBadge status={currentStatus} />
                {currentStatus === 'pending' && 'Transaction Pending'}
                {currentStatus === 'success' && 'Transaction Successful'}
                {currentStatus === 'error' && 'Transaction Failed'}
              </AlertTitle>
              <AlertDescription className="text-[var(--text-secondary)] text-sm mt-2">
                {currentStatus === 'error' ? displayError : 
                 currentStatus === 'pending' ? (message || 'Waiting for network confirmation...') :
                 (message || 'Your transaction has been confirmed.')}
              </AlertDescription>
            </div>
            
            {hash && (
              <a 
                href={explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 hover:underline bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                View Explorer <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionStatus;
