
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, LogOut, RefreshCw, Wallet, Activity, Layers, ArrowRightLeft } from 'lucide-react';
import { useBaseAuth, useNetwork } from '@/contexts/BaseAuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ConnectedWalletDashboard = () => {
  const { 
    activeAddress, 
    availableAddresses, 
    switchAddress, 
    disconnect,
    isConnected
  } = useBaseAuth();
  const { selectedNetwork } = useNetwork();
  
  const [copied, setCopied] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPortfolio = async () => {
    if (!activeAddress) return;
    
    setLoading(true);
    try {
      const response = await apiServerClient.fetch(`/base/wallet-balances?walletAddress=${activeAddress}&chainId=${selectedNetwork.id}`);
      const result = await response.json();
      
      if (result.success) {
        const balances = result.data.balances || [];
        const total = balances.reduce((sum, token) => sum + (parseFloat(token.value) || 0), 0);
        setPortfolioData({ balances, total });
      }
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 60000); // Update every 60s
    return () => clearInterval(interval);
  }, [activeAddress, selectedNetwork.id]);

  if (!isConnected || !activeAddress) return null;

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCopyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl space-y-6"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column: Accounts List */}
          <div className="w-full md:w-1/3 space-y-4">
            <Card className="glass-card-strong border-border/50 shadow-xl h-full">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                  <Wallet className="h-5 w-5 text-primary" />
                  Your Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {availableAddresses.map((account) => {
                  const isActive = account.address.toLowerCase() === activeAddress.toLowerCase();
                  return (
                    <div 
                      key={account.address}
                      className={cn(
                        "p-3 rounded-xl border transition-all duration-200",
                        isActive 
                          ? "bg-primary/10 border-primary/30 shadow-sm" 
                          : "glass-card border-border/30 hover:border-primary/20"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[var(--text-primary)]">{account.label}</span>
                            {isActive && (
                              <span className="text-[9px] uppercase tracking-wider font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                            {truncateAddress(account.address)}
                            <button 
                              onClick={() => handleCopyAddress(account.address)}
                              className="text-[var(--text-muted)] hover:text-primary transition-colors"
                            >
                              {copied === account.address ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between mt-3">
                        <div>
                          <span className="text-xs text-[var(--text-muted)]">Balance</span>
                          <p className="text-sm font-bold text-accent">{account.balance} ETH</p>
                        </div>
                        {!isActive && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => switchAddress(account.address)}
                            className="h-7 text-xs bg-white/5 hover:bg-primary/20 hover:text-primary"
                          >
                            <ArrowRightLeft className="h-3 w-3 mr-1" /> Switch
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <Button
                  onClick={disconnect}
                  variant="destructive"
                  className="w-full mt-4 font-bold transition-all duration-200"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect All
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Active Account Details */}
          <div className="w-full md:w-2/3 space-y-6">
            <Card className="glass-card-strong border-border/50 shadow-xl">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                    <Activity className="h-5 w-5 text-primary" />
                    Active Portfolio
                  </CardTitle>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-bold text-primary">{selectedNetwork.name}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Total Value
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchPortfolio}
                    disabled={loading}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="glass-card rounded-2xl p-8 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex items-center justify-center">
                  {loading && !portfolioData ? (
                    <div className="flex flex-col items-center text-[var(--text-muted)]">
                      <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                      <span className="text-sm">Scanning blockchain...</span>
                    </div>
                  ) : (
                    <p className="text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      {portfolioData ? formatCurrency(portfolioData.total) : '$0.00'}
                    </p>
                  )}
                </div>

                {portfolioData && portfolioData.balances.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Assets</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {portfolioData.balances.map((token) => (
                        <div key={token.token} className="glass-card p-4 rounded-xl flex justify-between items-center hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm border border-white/5">
                              {token.token.slice(0,1)}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">{token.token}</p>
                              <p className="text-xs text-[var(--text-secondary)] font-medium">{parseFloat(token.balance).toFixed(4)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[var(--text-primary)]">{formatCurrency(token.value)}</p>
                            <p className="text-xs text-[var(--text-secondary)] font-medium">@{formatCurrency(token.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  !loading && (
                    <div className="glass-card rounded-xl p-8 text-center space-y-3 border-dashed">
                      <Layers className="h-8 w-8 text-[var(--text-muted)] mx-auto" />
                      <p className="text-[var(--text-secondary)] font-medium">
                        No assets found for this address on {selectedNetwork.name}.
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ConnectedWalletDashboard;
