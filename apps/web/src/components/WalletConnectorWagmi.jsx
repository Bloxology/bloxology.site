import React, { useState } from 'react';
import { Loader2, Wallet, AlertCircle } from 'lucide-react';
import { useConnect, useAccount } from 'wagmi';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SignatureRequestFlowWagmi from './SignatureRequestFlowWagmi.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';

const WalletConnectorWagmi = ({ onSuccess }) => {
  const { connectAsync, connectors, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { connectWallet, error, clearError } = useWallet();
  const [localError, setLocalError] = useState(null);
  const [needsSignature, setNeedsSignature] = useState(false);

  const handleConnectWallet = async (walletConnector) => {
    clearError();
    setLocalError(null);

    // If wallet is already connected, proceed directly to ownership signature.
    if (isConnected && address) {
      setNeedsSignature(true);
      return;
    }

    try {
      await connectAsync({ connector: walletConnector });
      setNeedsSignature(true);
    } catch (err) {
      const message = err?.message || 'Failed to connect wallet';
      if (message.toLowerCase().includes('already connected')) {
        setNeedsSignature(true);
        return;
      }
      if (message.toLowerCase().includes('provider not found') || message.toLowerCase().includes('connector not found')) {
        setLocalError('No wallet provider detected in this browser. Open the site in MetaMask/Coinbase Wallet browser, or install the extension and refresh.');
      } else {
        setLocalError(message);
      }
    }
  };

  const handleSignatureSuccess = async (signatureData) => {
    try {
      const response = await apiServerClient.fetch('/auth/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signatureData)
      });

      let data = null;
      const rawBody = await response.text();
      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch (parseError) {
          throw new Error(`Unexpected server response (${response.status}): ${rawBody.slice(0, 120)}`);
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Signature verification failed (HTTP ${response.status})`);
      }

      if (!data || !data.address || !data.jwtToken) {
        throw new Error('Invalid response from server during signature verification');
      }

      connectWallet(data.address, data.walletType, data.jwtToken);
      toast.success('Wallet connected successfully');
      setNeedsSignature(false);
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('Verification error:', err);
      setLocalError(err.message || 'Failed to verify signature');
      setNeedsSignature(false);
    }
  };

  const displayError = localError || error;

  if (needsSignature && address) {
    return (
      <SignatureRequestFlowWagmi 
        address={address}
        onSignatureSuccess={handleSignatureSuccess}
        onCancel={() => {
          setNeedsSignature(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {displayError && (
        <Alert variant="destructive" className="glass-card border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => handleConnectWallet(connector)}
            disabled={isPending}
            className="w-full flex items-center gap-4 p-4 rounded-xl glass-card border border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group text-left disabled:opacity-50"
          >
            <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              {connector.name === 'MetaMask' ? (
                <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M29.4 11.4L22.5 2.5L16 7.2L9.5 2.5L2.6 11.4L4.8 21.8L1.5 28.5L10.2 26.8L16 30.5L21.8 26.8L30.5 28.5L27.2 21.8L29.4 11.4Z" fill="#E2761B"/>
                </svg>
              ) : (
                <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white rounded-full" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[var(--text-primary)]">{connector.name}</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {connector.name === 'Injected' ? 'Connect using browser wallet extension' : `Connect using ${connector.name}`}
              </p>
            </div>
            {isPending && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </button>
        ))}
      </div>

      <Button
        disabled={isPending || isConnected}
        size="lg"
        className="w-full h-16 text-lg font-semibold crypto-gradient hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Connecting...
          </>
        ) : isConnected ? (
          <>
            <Wallet className="mr-2 h-5 w-5" />
            Connected
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-5 w-5" />
            Select Wallet Above
          </>
        )}
      </Button>
    </div>
  );
};

export default WalletConnectorWagmi;
