
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, Loader2, CheckCircle, AlertCircle, Settings, Info } from 'lucide-react';
import { ethers } from 'ethers';
import { formatBalance } from '@/utils/formatBalance.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { useBaseAuth, useNetwork } from '@/contexts/BaseAuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FeeDisplay from '@/components/FeeDisplay.jsx';
import { getBloxologyTokensForChain } from '@/lib/bloxologyTokenList.js';
import { getTransactionUrl } from '@/utils/etherscanLinks.js';
import { FEE_RECIPIENT } from '@/utils/feeCalculator.js';
import { useToast } from '@/hooks/use-toast';

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
];

const QUOTE_FALLBACK_ADDRESS = '0x000000000000000000000000000000000000dEaD';

const isValidTokenEntry = (token) => {
  return Boolean(
    token &&
      typeof token.address === 'string' &&
      token.address.startsWith('0x') &&
      token.address.length === 42 &&
      typeof token.symbol === 'string' &&
      token.symbol.length > 0
  );
};

const TokenSwap = () => {
  const { activeAddress } = useBaseAuth();
  const { selectedNetwork, customTokens, addCustomToken } = useNetwork();
  const { toast } = useToast();
  const defaultTokens = getBloxologyTokensForChain(selectedNetwork.id).filter(isValidTokenEntry);
  const [fromToken, setFromToken] = useState(defaultTokens[0]?.address || '');
  const [toToken, setToToken] = useState(defaultTokens[1]?.address || defaultTokens[0]?.address || '');
  const [amount, setAmount] = useState('');
  
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [quoteErrorCode, setQuoteErrorCode] = useState(null);
  const [providerErrors, setProviderErrors] = useState(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);
  const [isAddTokenLoading, setIsAddTokenLoading] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    address: '',
    name: '',
    symbol: '',
    decimals: ''
  });
  const [fromTokenBalance, setFromTokenBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceUnavailable, setBalanceUnavailable] = useState(false);
  const [slippage, setSlippage] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bloxology_settings'));
      return saved?.slippageTolerance || '0.5';
    } catch { return '0.5'; }
  });

  // Combine default tokens with custom tokens for current network
  const customTokensForNetwork = customTokens.filter(
    (t) => Number(t.chainId) === Number(selectedNetwork.id) && isValidTokenEntry(t)
  );
  const availableTokens = [...defaultTokens, ...customTokensForNetwork].filter(
    (token, index, arr) =>
      arr.findIndex((item) => item.address.toLowerCase() === token.address.toLowerCase()) === index
  );

  const fallbackFromToken = availableTokens[0]?.address || '';
  const fallbackToToken = availableTokens[1]?.address || fallbackFromToken;

  // Reset state when active address or network changes
  useEffect(() => {
    setResult(null);
    setError(null);
    setQuoteErrorCode(null);
    setProviderErrors(null);
    if (!fromToken && fallbackFromToken) {
      setFromToken(fallbackFromToken);
    }
    if (!toToken && fallbackToToken) {
      setToToken(fallbackToToken);
    }
    // Reset to default tokens if custom tokens were removed
    if (fromToken && !availableTokens.find(t => t.address.toLowerCase() === fromToken.toLowerCase())) {
      setFromToken(fallbackFromToken);
    }
    if (toToken && !availableTokens.find(t => t.address.toLowerCase() === toToken.toLowerCase())) {
      setToToken(fallbackToToken);
    }
  }, [activeAddress, selectedNetwork.id, customTokens, fromToken, toToken, fallbackFromToken, fallbackToToken, availableTokens]);

  // Fetch balance for the "from" token
  useEffect(() => {
    const fetchBalance = async () => {
      if (!activeAddress || !fromToken) {
        setFromTokenBalance(null);
        setBalanceUnavailable(false);
        return;
      }

      setLoadingBalance(true);
      setBalanceUnavailable(false);
      try {
        const response = await apiServerClient.fetch(
          `/base/token-balance?walletAddress=${activeAddress}&tokenAddress=${fromToken}&chainId=${selectedNetwork.id}`
        );
        const data = await response.json();
        if (data.success && data.data) {
          setFromTokenBalance(String(data.data.balance ?? '0'));
        } else {
          setFromTokenBalance('0');
          setBalanceUnavailable(true);
        }
      } catch (err) {
        console.error('Failed to fetch token balance:', err);
        setFromTokenBalance('0');
        setBalanceUnavailable(true);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [fromToken, activeAddress, selectedNetwork.id]);

  // Debounced quote fetching
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || parseFloat(amount) <= 0 || fromToken === toToken) {
        setQuote(null);
        return;
      }

      setLoadingQuote(true);
      setError(null);
      setQuoteErrorCode(null);
      setProviderErrors(null);

      try {
        let quoteResult = null;
        const response = await apiServerClient.fetch('/base/token-swap-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Always provide an address so the API can return executable routes.
            // Real swaps still require an actual connected wallet in executeSwap.
            fromAddress: activeAddress || QUOTE_FALLBACK_ADDRESS,
            fromToken,
            toToken,
            amount,
            chainId: selectedNetwork.id
          })
        });

        try {
          quoteResult = await response.json();
        } catch (_) {
          throw new Error('Quote service returned an invalid response. Please try again.');
        }

        if (!response.ok || !quoteResult.success) {
          const providerUnavailable = response.status === 503;
          const apiErrorCode = quoteResult?.errorCode;
          console.error('[TokenSwap] quote fetch failed', {
            status: response.status,
            chainId: selectedNetwork.id,
            fromAddress: activeAddress,
            fromToken,
            toToken,
            amount,
            apiErrorCode,
            apiError: quoteResult?.error,
            payload: quoteResult,
          });

          let errorMessage = quoteResult?.error || 'Failed to fetch quote';
          if (apiErrorCode === 'INSUFFICIENT_BALANCE') {
            errorMessage = 'Insufficient token balance for this swap amount.';
          } else if (apiErrorCode === 'EXECUTION_UNAVAILABLE') {
            errorMessage = 'No executable route available for this amount right now. Try a different amount or token pair.';
            if (quoteResult?.providerErrors) {
              setProviderErrors(quoteResult.providerErrors);
            }
          } else if (apiErrorCode === 'PRICING_UNAVAILABLE') {
            errorMessage = 'Pricing unavailable for this token pair at the moment.';
          }

          const quoteError = new Error(
            providerUnavailable
              ? 'Live swaps are temporarily unavailable. Please try again shortly.'
              : errorMessage
          );
          quoteError.quoteErrorCode = providerUnavailable ? 'PROVIDER_UNAVAILABLE' : apiErrorCode || null;
          throw quoteError;
        }

        const quoteData = quoteResult?.data;
        if (!quoteData?.execution) {
          const executionError = new Error('No executable route available for this amount right now. Try a different amount or token pair.');
          executionError.quoteErrorCode = 'EXECUTION_UNAVAILABLE';
          throw executionError;
        }

        setQuote(quoteData);
        setQuoteErrorCode(null);
        setProviderErrors(null);
      } catch (err) {
        console.error('[TokenSwap] quote request exception', {
          chainId: selectedNetwork.id,
          fromAddress: activeAddress,
          fromToken,
          toToken,
          amount,
          error: err?.message || String(err),
        });
        setError(err.message);
        setQuoteErrorCode(err?.quoteErrorCode || null);
        setQuote(null);
      } finally {
        setLoadingQuote(false);
      }
    };

    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [fromToken, toToken, amount, selectedNetwork.id, activeAddress]);

  const handleSwapDirection = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setQuote(null);
  };

  const handleTokenAddressChange = async (nextAddress) => {
    setTokenForm((prev) => ({ ...prev, address: nextAddress }));

    if (!ethers.isAddress(nextAddress)) {
      return;
    }

    try {
      setIsAddTokenLoading(true);
      const provider = new ethers.JsonRpcProvider(selectedNetwork.rpcUrl);
      const contract = new ethers.Contract(nextAddress, ERC20_ABI, provider);
      const [name, symbol, decimals] = await Promise.all([
        contract.name().catch(() => ''),
        contract.symbol().catch(() => ''),
        contract.decimals().catch(() => 18)
      ]);

      setTokenForm((prev) => ({
        ...prev,
        name: name || prev.name,
        symbol: symbol || prev.symbol,
        decimals: String(decimals)
      }));
    } catch (_) {
      // Keep manual entry available if metadata fetch fails.
    } finally {
      setIsAddTokenLoading(false);
    }
  };

  const handleAddCustomToken = (e) => {
    e.preventDefault();

    if (!ethers.isAddress(tokenForm.address)) {
      toast({
        variant: 'destructive',
        title: 'Invalid address',
        description: 'Enter a valid token contract address.'
      });
      return;
    }

    if (!tokenForm.symbol || !tokenForm.decimals) {
      toast({
        variant: 'destructive',
        title: 'Missing token info',
        description: 'Token symbol and decimals are required.'
      });
      return;
    }

    const newToken = {
      address: tokenForm.address,
      name: tokenForm.name || tokenForm.symbol,
      symbol: tokenForm.symbol,
      decimals: Number(tokenForm.decimals),
      chainId: selectedNetwork.id
    };

    addCustomToken(newToken);
    setIsAddTokenOpen(false);
    setTokenForm({ address: '', name: '', symbol: '', decimals: '' });

    toast({
      title: 'Token saved',
      description: `${newToken.symbol} is now available in this swap list.`
    });
  };

  const executeSwap = async (e) => {
    e.preventDefault();
    if (!quote || !activeAddress) return;

    setIsSwapping(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('Wallet provider not found. Please connect a wallet extension.');
      }

      // Ensure wallet has authorised this session before any provider calls
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (!quote.execution) {
        throw new Error('Live execution data unavailable for this quote. Try another token pair or reconnect wallet.');
      }

      // Pre-flight: check ETH balance covers gas (0.00005 ETH minimum on Base)
      try {
        const MIN_GAS_WEI = BigInt('50000000000000'); // 0.00005 ETH
        const balHex = await window.ethereum.request({ method: 'eth_getBalance', params: [activeAddress, 'latest'] });
        const balWei = BigInt(balHex);
        if (balWei < MIN_GAS_WEI) {
          const balEth = formatBalance(Number(balWei) / 1e18);
          throw new Error(`Insufficient ETH for gas fees. You have ${balEth} ETH on ${selectedNetwork.name} but need at least 0.00005 ETH to send this transaction.`);
        }
      } catch (gasCheckErr) {
        if (gasCheckErr.message?.startsWith('Insufficient ETH')) throw gasCheckErr;
        // eth_getBalance unavailable — skip check and proceed
      }

      let txHash = null;

      if (quote.execution.type === 'transaction' && quote.execution.transaction) {
        const txRequest = {
          from: activeAddress,
          ...quote.execution.transaction,
        };
        txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txRequest],
        });
      } else if (quote.execution.type === 'calls' && Array.isArray(quote.execution.calls)) {
        txHash = await window.ethereum.request({
          method: 'wallet_sendCalls',
          params: [
            {
              version: '1.0',
              chainId: `0x${Number(selectedNetwork.id).toString(16)}`,
              from: activeAddress,
              calls: quote.execution.calls,
            },
          ],
        });
      }

      if (!txHash) {
        throw new Error('Wallet did not return a transaction hash.');
      }

      const feeAmount = 0;
      const netOutput = Number(quote.outputAmount ?? 0);

      setIsSwapping(false);
      setResult({
        message: `Swap submitted on ${selectedNetwork.name}`,
        transactionHash: txHash,
        amountIn: amount,
        grossOut: quote.outputAmount,
        feePaid: feeAmount,
        netOut: netOutput,
        toSymbol: availableTokens.find(t => t.address.toLowerCase() === toToken.toLowerCase())?.symbol || 'Tokens',
        swappedBy: activeAddress
      });
      setAmount('');
      setQuote(null);
    } catch (err) {
      console.error('[TokenSwap] execute swap failed', {
        chainId: selectedNetwork.id,
        fromAddress: activeAddress,
        fromToken,
        toToken,
        amount,
        executionType: quote?.execution?.type,
        error: err?.message || String(err),
      });
      setError(err.message || 'Swap execution failed');
      setIsSwapping(false);
    }
  };

  const toTokenSymbol = availableTokens.find(t => t.address.toLowerCase() === toToken.toLowerCase())?.symbol || '';
  // Temporary: fees are disabled until swap routing stability is fully validated.
  const feeAmount = 0;
  const netOutput = quote ? Number(quote.outputAmount ?? 0) : 0;
  const parsedBalance = Number(fromTokenBalance ?? '0');
  const parsedAmount = Number(amount || '0');
  const hasInsufficientBalance = Number.isFinite(parsedBalance)
    && Number.isFinite(parsedAmount)
    && parsedAmount > 0
    && parsedAmount > parsedBalance;

  const copyDebugReport = async () => {
    const payload = {
      timestamp: new Date().toISOString(),
      chainId: selectedNetwork.id,
      chainName: selectedNetwork.name,
      fromAddress: activeAddress || null,
      fromToken,
      toToken,
      amount,
      fromTokenBalance,
      quoteProvider: quote?.provider || null,
      executionType: quote?.execution?.type || null,
      hasExecution: Boolean(quote?.execution),
      quoteErrorCode: quoteErrorCode || null,
      providerErrors: providerErrors || null,
      error: error || null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast({
        title: 'Debug report copied',
        description: 'Swap diagnostics copied to clipboard.',
      });
    } catch (_) {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Could not copy debug report. Check browser clipboard permissions.',
      });
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="glass-card-strong border-border/50 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl text-[var(--text-primary)]">Swap on {selectedNetwork.name}</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 glass-card-strong p-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Slippage Tolerance</p>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant={slippage === val ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSlippage(val);
                      try {
                        const prev = JSON.parse(localStorage.getItem('bloxology_settings') || '{}');
                        localStorage.setItem('bloxology_settings', JSON.stringify({ ...prev, slippageTolerance: val }));
                      } catch {}
                    }}
                  >
                    {val}%
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={slippage}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || (!isNaN(v) && parseFloat(v) >= 0 && parseFloat(v) <= 50)) {
                      setSlippage(v);
                    }
                  }}
                  onBlur={() => {
                    try {
                      const prev = JSON.parse(localStorage.getItem('bloxology_settings') || '{}');
                      localStorage.setItem('bloxology_settings', JSON.stringify({ ...prev, slippageTolerance: slippage || '0.5' }));
                    } catch {}
                  }}
                  className="h-8 text-sm"
                />
                <span className="text-sm text-[var(--text-secondary)] font-medium">%</span>
              </div>
              {parseFloat(slippage) > 5 && (
                <p className="text-xs text-destructive font-medium">High slippage — you may lose value on this trade.</p>
              )}
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent>
          <form onSubmit={executeSwap} className="space-y-2">
            {/* From Token */}
            <div className="glass-card p-4 rounded-2xl space-y-3 border border-border/30">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-[var(--text-secondary)]">You pay</Label>
                <div className="flex items-center gap-2">
                  {loadingBalance ? (
                    <span className="text-xs text-[var(--text-secondary)]">Loading balance...</span>
                  ) : (
                    <>
                      <span className="text-xs text-[var(--text-secondary)]">
                        Balance: {Number.isFinite(parsedBalance)
                          ? formatBalance(parsedBalance)
                          : '0'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAmount(String(fromTokenBalance ?? '0'))}
                        className="h-6 px-2 text-xs font-semibold text-primary hover:bg-primary/10"
                      >
                        Max
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {balanceUnavailable && (
                <p className="text-[11px] text-amber-300">Balance check unavailable. Showing 0 until RPC responds.</p>
              )}
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-3xl font-bold bg-transparent border-none shadow-none px-0 focus-visible:ring-0 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                <Select value={fromToken} onValueChange={setFromToken}>
                  <SelectTrigger className="w-[120px] rounded-xl bg-primary/10 border-primary/20 text-[var(--text-primary)] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card-strong">
                    {availableTokens.map((token) => (
                      <SelectItem key={token.address} value={token.address} className="font-bold">
                        {token.symbol}
                      </SelectItem>
                    ))}
                    <div className="border-t border-border/40 px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-full justify-start px-2 text-xs font-semibold"
                        onClick={() => setIsAddTokenOpen(true)}
                      >
                        + Add custom token
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center -my-4 relative z-10">
              <Button
                type="button"
                onClick={handleSwapDirection}
                variant="outline"
                size="icon"
                className="rounded-xl glass-card-strong border-border/50 text-[var(--text-primary)] hover:text-primary hover:border-primary/50 transition-all duration-200 h-10 w-10"
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="glass-card p-4 rounded-2xl space-y-3 border border-border/30">
              <Label className="text-xs text-[var(--text-secondary)]">You receive (Gross)</Label>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center">
                  {loadingQuote ? (
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
                  ) : (
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      {quote ? formatBalance(quote.outputAmount) : '0.0'}
                    </span>
                  )}
                </div>
                <Select value={toToken} onValueChange={setToToken}>
                  <SelectTrigger className="w-[120px] rounded-xl bg-primary/10 border-primary/20 text-[var(--text-primary)] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card-strong">
                    {availableTokens.map((token) => (
                      <SelectItem key={token.address} value={token.address} className="font-bold">
                        {token.symbol}
                      </SelectItem>
                    ))}
                    <div className="border-t border-border/40 px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-full justify-start px-2 text-xs font-semibold"
                        onClick={() => setIsAddTokenOpen(true)}
                      >
                        + Add custom token
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="glass-card border-destructive/50 mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium space-y-2">
                  <p>{error}</p>
                  {quoteErrorCode && (
                    <p className="text-xs font-semibold text-destructive/90">Error Code: {quoteErrorCode}</p>
                  )}
                  {providerErrors && (
                    <div className="text-xs text-destructive/80 space-y-1 mt-1">
                      {providerErrors.odos?.length > 0 && (
                        <p><span className="font-semibold">ODOS:</span> {providerErrors.odos[0]}</p>
                      )}
                      {providerErrors.alchemy?.length > 0 && (
                        <p><span className="font-semibold">Alchemy:</span> {providerErrors.alchemy[0]}</p>
                      )}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyDebugReport}
                    className="h-7 text-xs"
                  >
                    Copy debug report
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {!error && hasInsufficientBalance && (
              <Alert variant="destructive" className="glass-card border-destructive/50 mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">Insufficient balance for this amount.</AlertDescription>
              </Alert>
            )}

            {/* Quote Details & Fee Display */}
            {quote && !loadingQuote && !error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-4 space-y-4"
              >
                <div className="space-y-2 px-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">Exchange Rate</span>
                    <span className="text-[var(--text-primary)] font-medium">1 = {quote.exchangeRate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">Network Fee</span>
                    <span className="text-[var(--text-primary)] font-medium">{quote.gasFee} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">Price Impact</span>
                    <span className={`font-medium ${quote.slippage > 1 ? 'text-destructive' : 'text-accent'}`}>
                      {quote.slippage}%
                    </span>
                  </div>
                  {(quote?.pricing?.fromTokenSource === 'coingecko-contract' || quote?.pricing?.toTokenSource === 'coingecko-contract') && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                      <p className="text-xs font-semibold text-amber-300">Estimated pricing is being used for one or both tokens.</p>
                    </div>
                  )}
                  {quote?.provider === 'alchemy' && (
                    <div className="rounded-lg border border-accent/20 bg-accent/10 px-3 py-2">
                      <p className="text-xs font-semibold text-accent">Live executable quote from Alchemy.</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-white/5 px-3 py-2">
                    <Info className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                    <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                      Quote quality: mapped market pairs are live-priced, other contracts use estimated market lookup.
                    </p>
                    <Dialog open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="ml-auto rounded border border-border/40 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)] transition-colors hover:border-primary/40 hover:text-[var(--text-primary)]"
                        >
                          Details
                        </button>
                      </DialogTrigger>
                      <DialogContent className="glass-card-strong border-border/50 sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-[var(--text-primary)]">Quote Pricing Details</DialogTitle>
                          <DialogDescription className="text-[var(--text-secondary)]">
                            Swap quotes combine token market prices and estimated execution assumptions.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 text-sm">
                          <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                            <p className="font-semibold text-[var(--text-primary)]">Mapped market source</p>
                            <p className="text-[var(--text-secondary)]">Direct market mapping for known tokens, typically highest-confidence quotes.</p>
                          </div>
                          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
                            <p className="font-semibold text-amber-300">Estimated market source</p>
                            <p className="text-[var(--text-secondary)]">Resolved by token contract lookup and may differ from executable DEX output at trade time.</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <FeeDisplay 
                  title="Swap Output Breakdown"
                  feeAmount={feeAmount}
                  feePercent={0}
                  totalAmount={quote.outputAmount}
                  netAmount={netOutput}
                  feeRecipient={FEE_RECIPIENT}
                  symbol={toTokenSymbol}
                />
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={!quote || !quote.execution || isSwapping || loadingQuote || fromToken === toToken || !activeAddress || hasInsufficientBalance}
              className="w-full h-14 mt-4 text-lg font-bold crypto-gradient text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Confirming Swap...
                </>
              ) : !activeAddress ? (
                'Connect Wallet'
              ) : fromToken === toToken ? (
                'Select different tokens'
              ) : !amount ? (
                'Enter an amount'
              ) : hasInsufficientBalance ? (
                'Insufficient balance'
              ) : error ? (
                'Quote unavailable'
              ) : loadingQuote ? (
                'Getting quote...'
              ) : (
                'Swap'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isAddTokenOpen} onOpenChange={setIsAddTokenOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Add Custom Token</DialogTitle>
            <DialogDescription>
              Save a token for {selectedNetwork.name}. It will appear in swap choices immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCustomToken} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="swap-add-token-address">Token Contract Address</Label>
              <div className="relative">
                <Input
                  id="swap-add-token-address"
                  value={tokenForm.address}
                  onChange={(e) => handleTokenAddressChange(e.target.value)}
                  placeholder="0x..."
                  className="input-high-contrast pr-10"
                  required
                />
                {isAddTokenLoading && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[var(--text-muted)]" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="swap-add-token-symbol">Symbol</Label>
                <Input
                  id="swap-add-token-symbol"
                  value={tokenForm.symbol}
                  onChange={(e) => setTokenForm((prev) => ({ ...prev, symbol: e.target.value }))}
                  placeholder="USDC"
                  className="input-high-contrast"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swap-add-token-decimals">Decimals</Label>
                <Input
                  id="swap-add-token-decimals"
                  type="number"
                  value={tokenForm.decimals}
                  onChange={(e) => setTokenForm((prev) => ({ ...prev, decimals: e.target.value }))}
                  placeholder="18"
                  className="input-high-contrast"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="swap-add-token-name">Token Name (Optional)</Label>
              <Input
                id="swap-add-token-name"
                value={tokenForm.name}
                onChange={(e) => setTokenForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="USD Coin"
                className="input-high-contrast"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isAddTokenLoading}>
              Save Token
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="glass-card border-accent/50 bg-accent/5">
            <CheckCircle className="h-5 w-5 text-accent" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-bold text-[var(--text-primary)]">{result.message}</p>
                <div className="text-sm space-y-1 text-[var(--text-secondary)] font-medium">
                  <p className="font-mono break-all">
                    <span className="text-[var(--text-primary)]">TX:</span> {result.transactionHash}
                  </p>
                  <p>
                    <a
                      href={getTransactionUrl(result.transactionHash, selectedNetwork)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      View on explorer
                    </a>
                  </p>
                  <p className="font-mono break-all">
                    <span className="text-[var(--text-primary)]">By:</span> {result.swappedBy}
                  </p>
                  <p>Swapped {result.amountIn} for {formatBalance(result.grossOut)} {result.toSymbol}</p>
                  <p className="text-destructive/90">Fee paid: {formatBalance(result.feePaid)} {result.toSymbol}</p>
                  <p className="text-accent font-bold">Net received: {formatBalance(result.netOut)} {result.toSymbol}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
};

export default TokenSwap;
