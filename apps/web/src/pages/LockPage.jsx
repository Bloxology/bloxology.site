
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Lock, Shield, Clock, Calendar, ArrowRight } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';
import { getTransactionUrl } from '@/utils/etherscanLinks.js';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import TokenSelector from '@/components/TokenSelector.jsx';
import TransactionStatus from '@/components/TransactionStatus.jsx';

const DEFAULT_TOKENS = [
  { symbol: 'BLOX', name: 'Bloxology Token', address: '0xBLOX000000000000000000000000000000000000' },
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }
];

const DURATIONS = [
  { days: 30, apy: '2%' },
  { days: 60, apy: '5%' },
  { days: 90, apy: '8%' },
  { days: 180, apy: '15%' }
];

const LockPage = () => {
  const { wallet, isConnected } = useWallet();
  const { selectedNetwork, customTokens } = useNetwork();
  
  const [token, setToken] = useState(DEFAULT_TOKENS[0].address);
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('90');
  
  const [txStatus, setTxStatus] = useState('idle');
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const [history, setHistory] = useState([]);

  const allTokens = [...DEFAULT_TOKENS, ...customTokens];

  useEffect(() => {
    const savedHistory = localStorage.getItem('lock_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse lock history');
      }
    }
  }, []);

  const saveToHistory = (record) => {
    const newHistory = [record, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('lock_history', JSON.stringify(newHistory));
  };

  const handleLock = async (e) => {
    e.preventDefault();
    if (!isConnected || !wallet) return toast.error('Connect wallet first');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Enter a valid amount');

    setTxStatus('pending');
    setTxHash(null);
    setTxError(null);

    try {
      const networkName = selectedNetwork?.name.split(' ')[0].toLowerCase() || 'ethereum';
      
      const response = await apiServerClient.fetch('/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          amount,
          duration: parseInt(duration),
          walletAddress: wallet,
          network: networkName
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to lock tokens');

      setTxStatus('pending'); // Will auto-transition to success in TransactionStatus component
      setTxHash(data.transactionHash);
      
      const tokenSymbol = allTokens.find(t => t.address === token)?.symbol || 'Tokens';
      
      saveToHistory({
        id: data.lockId || Date.now(),
        type: 'Lock',
        details: `Locked ${amount} ${tokenSymbol} for ${duration} days`,
        rewards: data.rewards,
        unlockDate: data.unlockDate,
        hash: data.transactionHash,
        date: new Date().toISOString(),
        network: selectedNetwork.name,
        status: 'locked'
      });

      toast.success('Token lock transaction submitted!');
      setAmount('');

    } catch (err) {
      setTxStatus('error');
      setTxError(err.message);
      toast.error(err.message);
    }
  };

  const calculateEstimatedRewards = () => {
    if (!amount || isNaN(amount)) return '0.00';
    const selectedDuration = DURATIONS.find(d => d.days.toString() === duration);
    if (!selectedDuration) return '0.00';
    const apyNum = parseFloat(selectedDuration.apy);
    // Simple mock calculation for UI
    return ((parseFloat(amount) * apyNum) / 100).toFixed(4);
  };

  return (
    <>
      <Helmet>
        <title>Lock Tokens - Bloxology</title>
        <meta name="description" content="Lock your tokens securely to earn high yield rewards." />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Lock Interface */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-4xl font-bold text-balance mb-2" style={{ letterSpacing: '-0.02em' }}>
                Token Locker
              </h1>
              <p className="text-lg text-[var(--text-secondary)] font-medium mb-8">
                Secure your assets and earn rewards over time
              </p>

              <Card className="glass-card-strong border-primary/20 shadow-2xl">
                <CardHeader className="pb-4 border-b border-border/30">
                  <CardTitle className="text-xl text-[var(--text-primary)] flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Create New Lock
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleLock} className="space-y-6">
                    
                    <div className="space-y-3">
                      <Label>Select Token to Lock</Label>
                      <TokenSelector 
                        tokens={allTokens}
                        selectedToken={token}
                        onTokenChange={setToken}
                        disabled={txStatus === 'pending'}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={txStatus === 'pending'}
                        className="input-high-contrast h-14 text-xl font-bold"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label>Lock Duration & Rewards</Label>
                      <RadioGroup value={duration} onValueChange={setDuration} className="grid grid-cols-2 gap-4">
                        {DURATIONS.map((d) => (
                          <div key={d.days}>
                            <RadioGroupItem value={d.days.toString()} id={`d-${d.days}`} className="peer sr-only" />
                            <Label
                              htmlFor={`d-${d.days}`}
                              className="flex flex-col items-center justify-center rounded-xl border-2 border-border/50 bg-black/20 p-4 hover:bg-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                            >
                              <span className="font-bold text-lg text-[var(--text-primary)]">{d.days} Days</span>
                              <span className="text-sm text-accent font-medium mt-1">+{d.apy} Reward</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {amount && parseFloat(amount) > 0 && (
                      <div className="p-4 rounded-xl glass-card bg-accent/5 border border-accent/20 flex justify-between items-center">
                        <span className="text-[var(--text-secondary)] font-medium">Estimated Rewards</span>
                        <span className="text-xl font-bold text-accent flex items-center gap-2">
                          +{calculateEstimatedRewards()} <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    )}

                    <TransactionStatus status={txStatus} hash={txHash} network={selectedNetwork} error={txError} />

                    <Button
                      type="submit"
                      disabled={!amount || txStatus === 'pending' || !isConnected}
                      className="w-full h-14 text-lg font-bold crypto-gradient text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20"
                    >
                      {!isConnected ? 'Connect Wallet' : 
                       txStatus === 'pending' ? 'Processing...' : 
                       'Lock Tokens Securely'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar / Active Locks */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="glass-card border-border/50 h-full">
                <CardHeader>
                  <CardTitle className="text-lg text-[var(--text-primary)] flex items-center gap-2">
                    <Lock className="h-5 w-5" /> Active Locks
                  </CardTitle>
                  <CardDescription>Your currently locked assets</CardDescription>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                      <Calendar className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No active locks found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((item) => {
                        const unlockDate = new Date(item.unlockDate);
                        const isUnlocked = unlockDate < new Date();
                        
                        return (
                          <div key={item.id} className="p-4 rounded-xl glass-card bg-black/20 border border-border/30">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-[var(--text-primary)]">{item.details.split(' for ')[0]}</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-md ${isUnlocked ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                                {isUnlocked ? 'Unlocked' : 'Locked'}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm mt-3">
                              <div className="flex justify-between text-[var(--text-secondary)]">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Unlocks</span>
                                <span>{unlockDate.toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between text-[var(--text-secondary)]">
                                <span>Earned Rewards</span>
                                <span className="text-accent font-medium">+{item.rewards}</span>
                              </div>
                            </div>

                            {isUnlocked && item.status === 'locked' && (
                              <Button variant="outline" size="sm" className="w-full mt-4 border-accent text-accent hover:bg-accent/10">
                                Withdraw & Claim
                              </Button>
                            )}
                          </div>
                        );
                      })}
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

export default LockPage;
