
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowDownUp, Settings, Info } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';
import { getTransactionUrl } from '@/utils/etherscanLinks.js';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import TokenSelector from '@/components/TokenSelector.jsx';
import TransactionStatus from '@/components/TransactionStatus.jsx';
import FeeDisplay from '@/components/FeeDisplay.jsx';

const DEFAULT_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  { symbol: 'WBTC', name: 'Wrapped BTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' }
];

const SwapPage = () => {
  const { wallet, isConnected } = useWallet();
  const { selectedNetwork, customTokens } = useNetwork();
  
  const [fromToken, setFromToken] = useState(DEFAULT_TOKENS[0].address);
  const [toToken, setToToken] = useState(DEFAULT_TOKENS[1].address);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  
  const [quote, setQuote] = useState(null);
  const [txStatus, setTxStatus] = useState('idle'); // idle, pending, success, error
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const [history, setHistory] = useState([]);

  const allTokens = [...DEFAULT_TOKENS, ...customTokens];

  useEffect(() => {
    const savedHistory = localStorage.getItem('swap_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse swap history');
      }
    }
  }, []);

  const saveToHistory = (record) => {
    const newHistory = [record, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('swap_history', JSON.stringify(newHistory));
  };

  const handleSwapDirection = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setQuote(null);
    setTxStatus('idle');
  };

  // Simulate quote fetching when amount changes
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0 || fromToken === toToken) {
      setQuote(null);
      return;
    }

    const timer = setTimeout(() => {
      // Mock quote calculation for UI responsiveness before actual swap
      const mockRate = 1.05; // Mock rate
      const estOut = (parseFloat(amount) * mockRate).toFixed(6);
      setQuote({
        estimatedOutput: estOut,
        swapRate: mockRate,
        fee: (parseFloat(amount) * 0.003).toFixed(6)
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [amount, fromToken, toToken]);

  const handleSwap = async (e) => {
    e.preventDefault();
    if (!isConnected || !wallet) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (fromToken === toToken) {
      toast.error('Select different tokens to swap');
      return;
    }

    setTxStatus('pending');
    setTxHash(null);
    setTxError(null);

    try {
      const networkName = selectedNetwork?.name.split(' ')[0].toLowerCase() || 'ethereum';
      
      const response = await apiServerClient.fetch('/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount,
          slippage: parseFloat(slippage),
          walletAddress: wallet,
          network: networkName
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Swap failed');
      }

      setTxStatus('pending'); // Will auto-transition to success in TransactionStatus component
      setTxHash(data.transactionHash);
      
      const fromSymbol = allTokens.find(t => t.address === fromToken)?.symbol || 'Unknown';
      const toSymbol = allTokens.find(t => t.address === toToken)?.symbol || 'Unknown';
      
      saveToHistory({
        id: Date.now(),
        type: 'Swap',
        details: `Swapped ${amount} ${fromSymbol} for ${parseFloat(data.estimatedOutput).toFixed(4)} ${toSymbol}`,
        hash: data.transactionHash,
        date: new Date().toISOString(),
        network: selectedNetwork.name
      });

      toast.success('Swap transaction submitted!');
      setAmount('');
      setQuote(null);

    } catch (err) {
      console.error('Swap error:', err);
      setTxStatus('error');
      setTxError(err.message);
      toast.error(err.message || 'Failed to execute swap');
    }
  };

  const toTokenSymbol = allTokens.find(t => t.address === toToken)?.symbol || '';

  return (
    <>
      <Helmet>
        <title>Swap Tokens - Bloxology</title>
        <meta name="description" content="Swap tokens instantly with low fees and minimal slippage." />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Swap Interface */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-4xl font-bold text-balance mb-2" style={{ letterSpacing: '-0.02em' }}>
                Swap Tokens
              </h1>
              <p className="text-lg text-[var(--text-secondary)] font-medium mb-8">
                Trade instantly across {selectedNetwork?.name || 'multiple networks'}
              </p>

              <Card className="glass-card-strong border-primary/20 shadow-2xl shadow-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/30">
                  <CardTitle className="text-xl text-[var(--text-primary)]">Exchange</CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 glass-card-strong border-border/50 p-4" align="end">
                      <div className="space-y-4">
                        <h4 className="font-medium text-[var(--text-primary)]">Transaction Settings</h4>
                        <div className="space-y-2">
                          <Label className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                            Slippage Tolerance <Info className="h-3 w-3" />
                          </Label>
                          <div className="flex gap-2">
                            {['0.1', '0.5', '1.0'].map(val => (
                              <Button
                                key={val}
                                type="button"
                                variant={slippage === val ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSlippage(val)}
                                className={slippage === val ? 'bg-primary text-white' : 'glass-card'}
                              >
                                {val}%
                              </Button>
                            ))}
                            <div className="relative flex-1">
                              <Input
                                value={slippage}
                                onChange={(e) => setSlippage(e.target.value)}
                                className="pr-6 h-9 input-high-contrast text-right"
                              />
                              <span className="absolute right-2 top-2 text-xs text-[var(--text-muted)]">%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSwap} className="space-y-2">
                    
                    {/* From Section */}
                    <div className="glass-card p-4 rounded-2xl space-y-4 border border-border/30 bg-black/20">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-[var(--text-secondary)]">You Pay</Label>
                        <span className="text-xs text-[var(--text-muted)]">Balance: 0.00</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="w-[160px] sm:w-[200px] shrink-0">
                          <TokenSelector 
                            tokens={allTokens}
                            selectedToken={fromToken}
                            onTokenChange={setFromToken}
                            disabled={txStatus === 'pending'}
                          />
                        </div>
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={txStatus === 'pending'}
                          className="text-3xl sm:text-4xl font-bold bg-transparent border-none shadow-none px-0 text-right focus-visible:ring-0 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/30 h-auto"
                        />
                      </div>
                    </div>

                    {/* Swap Direction Button */}
                    <div className="flex justify-center -my-5 relative z-10">
                      <Button
                        type="button"
                        onClick={handleSwapDirection}
                        disabled={txStatus === 'pending'}
                        variant="outline"
                        size="icon"
                        className="rounded-xl glass-card-strong border-border/50 text-[var(--text-primary)] hover:text-primary hover:border-primary/50 transition-all duration-200 h-12 w-12 shadow-lg"
                      >
                        <ArrowDownUp className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* To Section */}
                    <div className="glass-card p-4 rounded-2xl space-y-4 border border-border/30 bg-black/20">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-[var(--text-secondary)]">You Receive</Label>
                        <span className="text-xs text-[var(--text-muted)]">Balance: 0.00</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="w-[160px] sm:w-[200px] shrink-0">
                          <TokenSelector 
                            tokens={allTokens}
                            selectedToken={toToken}
                            onTokenChange={setToToken}
                            disabled={txStatus === 'pending'}
                          />
                        </div>
                        <div className="flex-1 text-right">
                          <span className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] truncate block">
                            {quote ? quote.estimatedOutput : '0.0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quote Details */}
                    {quote && amount && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-4 pb-2"
                      >
                        <FeeDisplay 
                          title="Transaction Estimate"
                          feeAmount={quote.fee}
                          feePercent={0.3}
                          totalAmount={quote.estimatedOutput}
                          netAmount={parseFloat(quote.estimatedOutput) - parseFloat(quote.fee)}
                          feeRecipient="Protocol Treasury"
                          symbol={toTokenSymbol}
                        />
                      </motion.div>
                    )}

                    <TransactionStatus 
                      status={txStatus} 
                      hash={txHash} 
                      network={selectedNetwork} 
                      error={txError}
                      message={txStatus === 'pending' ? 'Swapping tokens...' : 'Swap successful!'}
                    />

                    <Button
                      type="submit"
                      disabled={!amount || txStatus === 'pending' || fromToken === toToken || !isConnected}
                      className="w-full h-14 mt-6 text-lg font-bold crypto-gradient text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20 active:scale-[0.98]"
                    >
                      {!isConnected ? 'Connect Wallet to Swap' : 
                       txStatus === 'pending' ? 'Processing...' : 
                       fromToken === toToken ? 'Select different tokens' : 
                       !amount ? 'Enter an amount' : 'Swap Tokens'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar / History */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="glass-card border-border/50 h-full">
                <CardHeader>
                  <CardTitle className="text-lg text-[var(--text-primary)]">Recent Swaps</CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                      <ArrowDownUp className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No recent swaps found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl glass-card bg-black/20 border border-border/30 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-[var(--text-primary)]">{item.type}</span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[var(--text-secondary)] mb-2">{item.details}</p>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">{item.network}</span>
                            <a 
                              href={getTransactionUrl(item.hash, selectedNetwork)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--text-muted)] hover:text-primary transition-colors"
                            >
                              View TX ↗
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

        </div>
      </div>
    </>
  );
};

export default SwapPage;
