
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { getWalletProvider, generateNonce, requestSignature } from '@/utils/walletIntegration';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SignatureRequestFlow = ({ walletName, onSignatureSuccess, onSignatureError, onCancel }) => {
  const [step, setStep] = useState('connecting'); // connecting, signing, verifying
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(null);

  useEffect(() => {
    const initiateFlow = async () => {
      try {
        setStep('connecting');
        setError(null);
        
        const provider = getWalletProvider(walletName);
        if (!provider) {
          throw new Error(`${walletName === 'metamask' ? 'MetaMask' : 'Coinbase Wallet'} extension not found. Please install it.`);
        }

        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found. Please unlock your wallet.');
        }
        
        const userAddress = accounts[0];
        setAddress(userAddress);
        
        const currentNonce = generateNonce();
        setNonce(currentNonce);
        setStep('signing');

      } catch (err) {
        console.error('Connection error:', err);
        setError(err.message || 'Failed to connect to wallet');
        onSignatureError(err);
      }
    };

    initiateFlow();
  }, [walletName, onSignatureError]);

  const handleSign = async () => {
    try {
      setStep('verifying');
      setError(null);
      
      const provider = getWalletProvider(walletName);
      const message = `Welcome to Bloxology!\n\nClick to sign in and accept the Terms of Service.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet Address:\n${address}\n\nNonce:\n${nonce}`;
      
      const signature = await requestSignature(provider, message, address);
      
      onSignatureSuccess({
        address,
        signature,
        nonce,
        walletType: walletName
      });
      
    } catch (err) {
      console.error('Signing error:', err);
      setStep('signing');
      
      if (err.code === 4001) {
        setError('Signature request was rejected. Please try again.');
      } else {
        setError(err.message || 'Failed to sign message');
      }
      onSignatureError(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card-strong border-primary/20 p-6 rounded-2xl space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Verify Ownership</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Sign a message to prove you own this wallet.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-muted)]">Wallet</span>
            <span className="font-medium text-[var(--text-primary)] capitalize">{walletName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-muted)]">Address</span>
            <span className="font-mono text-[var(--text-primary)]">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connecting...'}
            </span>
          </div>
        </div>

        {step === 'connecting' && (
          <div className="flex items-center justify-center py-4 text-[var(--text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Connecting to wallet...
          </div>
        )}

        {step === 'signing' && (
          <div className="space-y-3">
            <Button 
              onClick={handleSign}
              className="w-full crypto-gradient text-white font-bold h-12"
            >
              Sign Message
            </Button>
            <Button 
              variant="ghost" 
              onClick={onCancel}
              className="w-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </Button>
          </div>
        )}

        {step === 'verifying' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Waiting for signature...</p>
            <p className="text-xs text-[var(--text-muted)] text-center">
              Please check your wallet extension to approve the signature request.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SignatureRequestFlow;
