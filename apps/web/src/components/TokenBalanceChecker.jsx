
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Wallet, RefreshCw, Coins } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { formatBalance } from '@/utils/formatBalance.js';
import { useBaseAuth, useNetwork } from '@/contexts/BaseAuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const TokenBalanceChecker = ({ selectedNetwork }) => {
  const { wallet, jwtToken } = useWallet();
  const { activeAddress } = useBaseAuth();
  const { customTokens } = useNetwork();
  const effectiveWallet = activeAddress || wallet;
  const [nativeBalance, setNativeBalance] = useState(null);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showZeroCustomTokens, setShowZeroCustomTokens] = useState(true);

  const loadCustomTokenBalances = async (walletAddress, chainId) => {
    const networkCustomTokens = customTokens.filter((t) => t.chainId === Number(chainId));

    if (networkCustomTokens.length === 0) {
      return [];
    }

    const results = await Promise.all(
      networkCustomTokens.map(async (token) => {
        try {
          const endpoint = `/etherscan/token-balance?contractAddress=${token.address}&walletAddress=${walletAddress}&chainId=${chainId}`;
          const response = await apiServerClient.fetch(endpoint);
          const data = await response.json();

          if (!response.ok || !data?.success || !data?.data) {
            return null;
          }

          const rawBalance = data.data.balance || '0';
          const decimals = Number(token.decimals ?? 18);
          const balanceBigInt = BigInt(rawBalance);
          const divisorBigInt = BigInt(10) ** BigInt(decimals);
          const whole = balanceBigInt / divisorBigInt;
          const fraction = (balanceBigInt % divisorBigInt).toString().padStart(decimals, '0');
          const normalized = `${whole.toString()}.${fraction}`;

          return {
            address: token.address.toLowerCase(),
            symbol: token.symbol || 'TOKEN',
            name: token.name || token.symbol || 'Custom Token',
            balance: normalized,
            balanceFormatted: normalized,
            decimals,
            isCustom: true,
          };
        } catch (customTokenErr) {
          console.error('[TokenBalanceChecker] Custom token fetch error:', token.address, customTokenErr.message);
          return {
            address: token.address.toLowerCase(),
            symbol: token.symbol || 'TOKEN',
            name: token.name || token.symbol || 'Custom Token',
            balance: '0',
            balanceFormatted: '0.000000000',
            decimals: Number(token.decimals ?? 18),
            isCustom: true,
          };
        }
      })
    );

    return results.filter(Boolean);
  };

  // Log state updates when nativeBalance and tokenBalances states are updated with final values
  useEffect(() => {
    console.log('[TokenBalanceChecker] State Updated - nativeBalance:', nativeBalance);
    console.log('[TokenBalanceChecker] State Updated - tokenBalances:', tokenBalances);
  }, [nativeBalance, tokenBalances]);

  useEffect(() => {
    console.log('[TokenBalanceChecker] Component mounted or props changed.');
    console.log('[TokenBalanceChecker] Current Wallet Address:', effectiveWallet || 'None');
    console.log('[TokenBalanceChecker] Selected Network Object:', selectedNetwork);
  }, [effectiveWallet, selectedNetwork]);

  const fetchBalances = async () => {
    console.log('[TokenBalanceChecker] Validating inputs before fetch request:');
    console.log(`  - Wallet Address (null/undefined check): ${effectiveWallet === null ? 'null' : effectiveWallet === undefined ? 'undefined' : effectiveWallet}`);
    console.log(`  - Selected Network (null check): ${selectedNetwork === null ? 'null' : selectedNetwork === undefined ? 'undefined' : selectedNetwork?.name}`);
    console.log(`  - Chain ID (null/undefined check): ${selectedNetwork?.id === null ? 'null' : selectedNetwork?.id === undefined ? 'undefined' : selectedNetwork?.id}`);

    // 1. Validate Wallet Address
    if (!effectiveWallet) {
      console.warn('[TokenBalanceChecker] Fetch aborted: No wallet address provided.');
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/i.test(effectiveWallet)) {
      console.warn(`[TokenBalanceChecker] Fetch aborted: Invalid wallet address format: ${effectiveWallet}`);
      setError('Invalid wallet address format. Must be a valid Ethereum address.');
      return;
    }

    // 2. Validate Network
    if (!selectedNetwork || !selectedNetwork.id) {
      console.warn('[TokenBalanceChecker] Fetch aborted: No valid network selected.', selectedNetwork);
      setError('Invalid network configuration.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const chainId = String(selectedNetwork.id);
      const endpoint = `/balance?address=${effectiveWallet}&chainId=${chainId}`;
      
      console.log(`[TokenBalanceChecker] Initiating API Call...`);
      console.log(`[TokenBalanceChecker] Request URL being called: /hcgi/api${endpoint}`);
      console.log(`[TokenBalanceChecker] Request Parameters: { address: '${effectiveWallet}', chainId: '${chainId}' }`);

      const headers = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};
      const response = await apiServerClient.fetch(endpoint, { headers });
      
      console.log(`[TokenBalanceChecker] API Response Object:`, response);
      console.log(`[TokenBalanceChecker] Response Status Code:`, response.status);
      console.log(`[TokenBalanceChecker] Response OK Status:`, response.ok);

      let data;
      try {
        data = await response.json();
        console.log(`[TokenBalanceChecker] Parsed JSON Data Structure:`, data);
      } catch (parseErr) {
        console.error('[TokenBalanceChecker] JSON Parse Error:', parseErr.message);
        console.error('[TokenBalanceChecker] JSON Parse Error Stack:', parseErr.stack);
        throw new Error('Failed to parse API response as JSON');
      }

      if (!response.ok) {
        console.error(`[TokenBalanceChecker] Response Error (response.ok is false):`, data);
        throw new Error(data.error?.message || data.error || `HTTP Error ${response.status}: Failed to fetch balances`);
      }

      // Log Native balance details
      if (data.data?.native) {
        console.log(`[TokenBalanceChecker] Native Balance Details Present:`, {
          address: data.data.native.address,
          balanceWei: data.data.native.balanceWei,
          balanceEth: data.data.native.balanceEth
        });
      } else {
        console.log(`[TokenBalanceChecker] Native Balance Details: Not present or null`);
      }

      // Log Token balances array
      const explorerTokens = Array.isArray(data.data?.tokens) ? data.data.tokens : [];
      const customTokenBalances = await loadCustomTokenBalances(effectiveWallet, chainId);

      const tokenMap = new Map();
      explorerTokens.forEach((token) => {
        tokenMap.set((token.address || token.symbol || '').toLowerCase(), token);
      });
      customTokenBalances.forEach((token) => {
        tokenMap.set((token.address || token.symbol || '').toLowerCase(), token);
      });

      const tokensArray = Array.from(tokenMap.values());
      console.log(`[TokenBalanceChecker] Token Balances Array Count:`, tokensArray.length);
      console.log(`[TokenBalanceChecker] Token Balances Structure:`, tokensArray);

      // Log state setter calls
      const newNativeBalance = data.data?.native ?? null;
      console.log(`[TokenBalanceChecker] Calling setNativeBalance with:`, newNativeBalance);
      setNativeBalance(newNativeBalance);

      console.log(`[TokenBalanceChecker] Calling setTokenBalances with:`, tokensArray);
      setTokenBalances(tokensArray);
      
    } catch (err) {
      console.error('[TokenBalanceChecker] Fetch Error Type:', err.name);
      console.error('[TokenBalanceChecker] Full Error Message:', err.message);
      console.error('[TokenBalanceChecker] Error Stack Trace:', err.stack);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log('[TokenBalanceChecker] Fetch operation completed.');
    }
  };

  useEffect(() => {
    if (effectiveWallet && selectedNetwork) {
      fetchBalances();
    } else {
      console.log('[TokenBalanceChecker] Missing dependencies for fetch. Resetting states.');
      console.log('[TokenBalanceChecker] Calling setNativeBalance with: null');
      setNativeBalance(null);
      console.log('[TokenBalanceChecker] Calling setTokenBalances with: []');
      setTokenBalances([]);
    }
  }, [effectiveWallet, selectedNetwork?.id]);

  if (!effectiveWallet || !selectedNetwork) return null;

  const currencySymbol = selectedNetwork?.currencySymbol || 'ETH';
  const visibleTokenBalances = tokenBalances.filter((token) => {
    if (!token.isCustom || showZeroCustomTokens) {
      return true;
    }

    const numericBalance = Number(token.balance ?? token.balanceFormatted ?? '0');
    return Number.isFinite(numericBalance) && numericBalance > 0;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedNetwork.name} Balances</h2>
          <p className="text-[var(--text-secondary)] font-medium">Real-time balances for active address</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowZeroCustomTokens((prev) => !prev)}
            variant="outline"
            className="glass-card hover:glass-card-strong text-[var(--text-primary)]"
          >
            {showZeroCustomTokens ? 'Hide Zero Custom' : 'Show Zero Custom'}
          </Button>
          <Button 
            onClick={fetchBalances} 
            disabled={loading}
            variant="outline" 
            className="glass-card hover:glass-card-strong text-[var(--text-primary)]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="glass-card border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card-strong border-primary/30 md:col-span-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 rounded-full bg-primary/20 text-primary mb-2">
              <Wallet className="h-8 w-8" />
            </div>
            <p className="text-[var(--text-secondary)] font-medium text-lg">Native Balance</p>
            {loading ? (
              <Skeleton className="h-12 w-48 mt-2 bg-white/10" />
            ) : (
              <h3 className="text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {nativeBalance ? formatBalance(nativeBalance.balanceEth) : '0'} {currencySymbol}
              </h3>
            )}
          </CardContent>
        </Card>

        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="glass-card border-border/50 h-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-24 bg-white/10" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 bg-white/10" />
              </CardContent>
            </Card>
          ))
        ) : (
          visibleTokenBalances.map((token, index) => (
            <motion.div
              key={token.symbol + index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="glass-card border-border/50 h-full hover:glass-card-strong transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg text-[var(--text-primary)]">
                    <span className="font-bold">{token.symbol}</span>
                    <div className="flex items-center gap-2">
                      {token.isCustom && (
                        <span className="text-xs font-medium text-primary bg-primary/15 px-2 py-1 rounded-md border border-primary/30">
                          Custom
                        </span>
                      )}
                      <span className="text-xs font-medium text-[var(--text-muted)] bg-white/5 px-2 py-1 rounded-md">
                        ERC-20
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-[var(--text-primary)] truncate" title={token.balance}>
                      {formatBalance(token.balance)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}

        {!loading && visibleTokenBalances.length === 0 && !error && (
          <div className="md:col-span-3 text-center py-12 text-[var(--text-secondary)] font-medium glass-card rounded-xl flex flex-col items-center">
            <Coins className="h-10 w-10 text-muted-foreground mb-3" />
            <p>No token balances to show on this network.</p>
            <p className="text-sm text-muted-foreground mt-1">Add custom tokens or enable zero-balance custom tokens.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenBalanceChecker;
