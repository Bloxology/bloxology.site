
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Lock, Shield, Clock, Calendar, ArrowRight } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';
import { getTransactionUrl } from '@/utils/etherscanLinks.js';
import { getBloxologyTokensForChain } from '@/lib/bloxologyTokenList.js';
import { formatBalance } from '@/utils/formatBalance.js';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import TokenSelector from '@/components/TokenSelector.jsx';
import TransactionStatus from '@/components/TransactionStatus.jsx';

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

const DURATIONS = [
  { days: 30, apy: '2%' },
  { days: 60, apy: '5%' },
  { days: 90, apy: '8%' },
  { days: 180, apy: '15%' }
];

const normaliseWalletError = (err, networkName) => {
  if (!err) return 'Transaction failed';

  // User rejected
  const code = err?.code ?? err?.error?.code;
  if (code === 4001 || code === 'ACTION_REJECTED') {
    return 'Transaction was rejected in your wallet.';
  }

  // Collect every possible string representation of the error
  const candidates = [];
  const addCandidate = (v) => { if (v && typeof v === 'string') candidates.push(v); };
  addCandidate(typeof err === 'string' ? err : null);
  addCandidate(err?.message);
  addCandidate(err?.reason);
  addCandidate(err?.shortMessage);
  addCandidate(typeof err?.toString === 'function' ? err.toString() : null);
  addCandidate(err?.data?.message);
  addCandidate(err?.error?.message);
  addCandidate(err?.cause?.message);
  addCandidate(err?.data?.originalError?.message);
  try { addCandidate(JSON.stringify(err)); } catch (_) {}

  const joined = candidates.join(' | ');
  const joinedLower = joined.toLowerCase();

  if (
    joinedLower.includes("failed to execute 'json' on 'response'") ||
    joinedLower.includes('unexpected end of json input') ||
    joinedLower.includes('json parse error') ||
    joinedLower.includes('json rpc error')
  ) {
    return `Your wallet\'s RPC returned an empty response. Make sure your wallet is switched to ${networkName} and try again.`;
  }

  if (
    joinedLower.includes('insufficient funds') ||
    joinedLower.includes('insufficient eth') ||
    joinedLower.includes('gas required exceeds allowance')
  ) {
    return `Insufficient ETH for gas fees on ${networkName}. Please top up your ETH balance and try again.`;
  }

  return candidates[0] || 'Transaction failed';
};

const ensureWalletOnNetwork = async (selectedNetwork) => {
  if (!window.ethereum) return;

  // Ensure wallet has authorised this session before any provider calls
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  try {
    const desiredHex = `0x${Number(selectedNetwork.id).toString(16)}`;
    const currentHex = await window.ethereum.request({ method: 'eth_chainId' });
    if (currentHex?.toLowerCase() === desiredHex.toLowerCase()) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: desiredHex }],
      });
    } catch (switchErr) {
      if (switchErr?.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: desiredHex,
            chainName: selectedNetwork.name,
            rpcUrls: [selectedNetwork.rpcUrl],
            nativeCurrency: {
              name: selectedNetwork.currencySymbol,
              symbol: selectedNetwork.currencySymbol,
              decimals: 18,
            },
            blockExplorerUrls: selectedNetwork.blockExplorer ? [selectedNetwork.blockExplorer] : [],
          }],
        });
      }
      // Non-4902 switch errors: ignore and proceed — wallet may handle internally
    }
  } catch (_) {
    // eth_chainId itself can fail on some wallets — safe to proceed
  }
};

const LockPage = () => {
  const { wallet, isConnected } = useWallet();
  const { selectedNetwork, customTokens } = useNetwork();
  const defaultTokens = getBloxologyTokensForChain(selectedNetwork.id).filter(isValidTokenEntry);
  const customTokensForNetwork = customTokens.filter(
    (t) => Number(t.chainId) === Number(selectedNetwork.id) && isValidTokenEntry(t)
  );
  const allTokens = [...defaultTokens, ...customTokensForNetwork].filter(
    (token, index, arr) =>
      arr.findIndex((item) => item.address.toLowerCase() === token.address.toLowerCase()) === index
  );
  const fallbackTokenAddress = allTokens[0]?.address || '';
  
  const [token, setToken] = useState(fallbackTokenAddress);
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('90');
  
  const [txStatus, setTxStatus] = useState('idle');
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!token && fallbackTokenAddress) {
      setToken(fallbackTokenAddress);
      return;
    }

    if (token && !allTokens.find((t) => t.address.toLowerCase() === token.toLowerCase())) {
      setToken(fallbackTokenAddress);
    }
  }, [token, allTokens, fallbackTokenAddress]);

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
    if (!token) return toast.error('No token available for this network.');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Enter a valid amount');
    if (!window.ethereum) return toast.error('No wallet extension detected. Please install MetaMask.');

    setTxStatus('pending');
    setTxHash(null);
    setTxError(null);

    try {
      const selectedDuration = DURATIONS.find(d => d.days.toString() === duration);
      const unlockDate = new Date(
        Date.now() + (selectedDuration?.days || 90) * 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await apiServerClient.fetch('/base/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet,
          tokenAddress: token,
          amount,
          unlockDate,
          chainId: selectedNetwork.id,
        })
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch (_) {
        data = null;
      }

      if (!data) {
        throw new Error('Server returned an empty or invalid response. Make sure the API server is running and try again.');
      }

      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to prepare lock transaction');

      const { transaction, lockDetails } = data.data;

      await ensureWalletOnNetwork(selectedNetwork);

      // Pre-flight: check ETH balance covers gas (0.00005 ETH minimum on Base)
      try {
        const MIN_GAS_WEI = BigInt('50000000000000'); // 0.00005 ETH
        const balHex = await window.ethereum.request({ method: 'eth_getBalance', params: [wallet, 'latest'] });
        const balWei = BigInt(balHex);
        if (balWei < MIN_GAS_WEI) {
          const balEth = formatBalance(Number(balWei) / 1e18);
          throw new Error(`Insufficient ETH for gas fees. You have ${balEth} ETH on ${selectedNetwork.name} but need at least 0.00005 ETH to send this transaction.`);
        }
      } catch (balErr) {
        if (balErr.message?.startsWith('Insufficient ETH')) throw balErr;
        // eth_getBalance unavailable — skip check and proceed
      }

      let txHashResult;
      try {
        txHashResult = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: wallet,
            to: transaction.to,
            data: transaction.data,
            value: transaction.value,
          }],
        });
      } catch (walletErr) {
        throw new Error(normaliseWalletError(walletErr, selectedNetwork.name));
      }

      if (!txHashResult) throw new Error('Wallet did not return a transaction hash.');

      setTxStatus('success');
      setTxHash(txHashResult);

      const tokenSymbol = allTokens.find(t => t.address?.toLowerCase() === token?.toLowerCase())?.symbol || 'Tokens';

      saveToHistory({
        id: Date.now(),
        type: 'Lock',
        details: `Locked ${lockDetails.amount} ${lockDetails.symbol} for ${selectedDuration?.days || 90} days`,
        rewards: selectedDuration?.apy || '0%',
        unlockDate: lockDetails.unlockDate,
        hash: txHashResult,
        date: new Date().toISOString(),
        network: selectedNetwork.name,
        status: 'locked'
      });

      toast.success('Tokens locked successfully!');
      setAmount('');

    } catch (err) {
      const readableError = normaliseWalletError(err, selectedNetwork.name);
      setTxStatus('error');
      setTxError(readableError);
      toast.error(readableError);
    }
  };

  const calculateEstimatedRewards = () => {
    if (!amount || isNaN(amount)) return '0.00';
    const selectedDuration = DURATIONS.find(d => d.days.toString() === duration);
    if (!selectedDuration) return '0.00';
    const apyNum = parseFloat(selectedDuration.apy);
    // Simple mock calculation for UI
    return ((parseFloat(amount) * apyNum) / 100).toLocaleString(undefined, { maximumFractionDigits: 9 });
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
