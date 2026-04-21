
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Wallet, Shield, Zap } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WalletConnectorWagmi from '@/components/WalletConnectorWagmi.jsx';
import { Button } from '@/components/ui/button';

const COINBASE_STATE_KEY = 'coinbase_oauth_state';

const parseJsonResponse = async (response) => {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    throw new Error(`Unexpected server response (HTTP ${response.status})`);
  }
};

const LoginPage = () => {
  const { isConnected, connectWallet } = useWallet();
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleCoinbaseOAuthStart = () => {
    const clientId = import.meta.env.VITE_COINBASE_OAUTH_CLIENT_ID;
    if (!clientId) {
      toast.error('Coinbase OAuth client id is missing. Set VITE_COINBASE_OAUTH_CLIENT_ID in apps/web/.env');
      return;
    }

    const redirectUri = `${window.location.origin}/login`;
    const state = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(COINBASE_STATE_KEY, state);

    const authorizeUrl = new URL('https://www.coinbase.com/oauth/authorize');
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', 'wallet:user:read');
    authorizeUrl.searchParams.set('state', state);

    window.location.assign(authorizeUrl.toString());
  };

  useEffect(() => {
    if (isConnected) {
      navigate(from, { replace: true });
    }
  }, [isConnected, navigate, from]);

  useEffect(() => {
    const runOAuthCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const oauthError = params.get('error');
      const returnedState = params.get('state');

      if (!code && !oauthError) return;

      if (oauthError) {
        toast.error(`Coinbase OAuth failed: ${oauthError}`);
        navigate('/login', { replace: true, state: location.state });
        return;
      }

      const expectedState = localStorage.getItem(COINBASE_STATE_KEY);
      if (!returnedState || !expectedState || returnedState !== expectedState) {
        toast.error('Coinbase OAuth state mismatch. Please try again.');
        navigate('/login', { replace: true, state: location.state });
        return;
      }

      setIsOAuthLoading(true);

      try {
        const redirectUri = `${window.location.origin}/login`;
        const response = await apiServerClient.fetch('/auth/coinbase/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri }),
        });

        const data = await parseJsonResponse(response);

        if (!response.ok || !data?.success || !data?.jwtToken || !data?.address) {
          throw new Error(data?.error || 'Failed to complete Coinbase OAuth login');
        }

        connectWallet(data.address, data.walletType || 'coinbase-oauth', data.jwtToken);
        toast.success('Signed in with Coinbase');
        navigate(from, { replace: true });
      } catch (err) {
        toast.error(err?.message || 'Coinbase OAuth login failed');
        navigate('/login', { replace: true, state: location.state });
      } finally {
        localStorage.removeItem(COINBASE_STATE_KEY);
        setIsOAuthLoading(false);
      }
    };

    runOAuthCallback();
  }, [location.search, location.state, navigate, from, connectWallet]);

  return (
    <>
      <Helmet>
        <title>Login - Bloxology</title>
        <meta name="description" content="Connect your wallet to access Bloxology dashboard." />
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card-strong border-primary/20 shadow-2xl shadow-primary/10">
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold text-[var(--text-primary)]">
                  Connect Wallet
                </CardTitle>
                <CardDescription className="text-base text-[var(--text-secondary)]">
                  Securely connect your wallet to access the DeFi suite.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                <WalletConnectorWagmi onSuccess={() => navigate(from, { replace: true })} />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[var(--background)] px-2 text-[var(--text-secondary)]">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCoinbaseOAuthStart}
                  disabled={isOAuthLoading}
                  className="w-full h-12"
                >
                  {isOAuthLoading ? 'Completing Coinbase OAuth...' : 'Continue with Coinbase OAuth'}
                </Button>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
                  <div className="flex flex-col items-center text-center space-y-2 p-4 glass-card rounded-xl">
                    <Shield className="h-6 w-6 text-green-500" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Secure Access</span>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-2 p-4 glass-card rounded-xl">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Fast Connection</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
