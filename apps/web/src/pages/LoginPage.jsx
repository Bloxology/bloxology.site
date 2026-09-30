
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Wallet, Shield, Zap } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WalletConnector from '@/components/WalletConnector.jsx';

const LoginPage = () => {
  const { isConnected } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isConnected) {
      navigate(from, { replace: true });
    }
  }, [isConnected, navigate, from]);

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
                
                <WalletConnector onSuccess={() => navigate(from, { replace: true })} />

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
