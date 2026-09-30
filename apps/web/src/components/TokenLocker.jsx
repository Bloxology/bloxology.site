
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Search, Loader2, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react';
import { useBaseAuth, useNetwork } from '@/contexts/BaseAuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import FeeDisplay from '@/components/FeeDisplay.jsx';
import { calculateLockerFee, FEE_RECIPIENT } from '@/utils/feeCalculator.js';

const TokenLocker = () => {
  const { activeAddress } = useBaseAuth();
  const { selectedNetwork } = useNetwork();
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState(null);
  const [result, setResult] = useState(null);
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [error, setError] = useState(null);

  const lockerFee = calculateLockerFee();

  // Reset state when active address changes
  useEffect(() => {
    setBalanceInfo(null);
    setResult(null);
    setError(null);
  }, [activeAddress]);

  const handleCheckBalance = async () => {
    if (!tokenAddress) {
      setError('Please enter a token address to check');
      return;
    }

    setLoading(true);
    setOperation('check');
    setError(null);

    try {
      const response = await apiServerClient.fetch(
        `/base/token-balance?walletAddress=${activeAddress || '0x0'}&tokenAddress=${tokenAddress.trim()}&chainId=${selectedNetwork.id}`
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to check token balance');
      }

      setBalanceInfo(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setOperation(null);
    }
  };

  const handleLockTokens = async (e) => {
    e.preventDefault();
    if (!tokenAddress || !amount || !unlockDate) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setOperation('lock');
    setError(null);
    setResult(null);

    // Simulate locking transaction and fee deduction using activeAddress
    setTimeout(() => {
      setLoading(false);
      setOperation(null);
      setResult({
        message: `Tokens successfully locked on ${selectedNetwork.name}`,
        transactionHash: '0x' + Math.random().toString(16).slice(2, 42),
        amount: amount,
        feePaid: lockerFee,
        unlockDate: new Date(unlockDate).toISOString(),
        lockedBy: activeAddress
      });
      setAmount('');
    }, 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {selectedNetwork.name} Token Locker
          </CardTitle>
          <CardDescription className="text-[var(--text-secondary)] font-medium">
            Securely lock your tokens in a smart contract until a specified date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLockTokens} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenAddress">Token Contract Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="tokenAddress"
                    placeholder="0x..."
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="input-high-contrast font-mono flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={handleCheckBalance}
                    disabled={loading || !tokenAddress || !activeAddress}
                    variant="secondary"
                    className="glass-card hover:glass-card-strong"
                  >
                    {loading && operation === 'check' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                  </Button>
                </div>
                {balanceInfo && (
                  <p className="text-sm text-accent font-medium mt-1">
                    Available Balance: {balanceInfo.balance} {balanceInfo.symbol}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount to Lock</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="any"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-high-contrast"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unlockDate">Unlock Date & Time</Label>
                  <Input
                    id="unlockDate"
                    type="datetime-local"
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    className="input-high-contrast"
                  />
                </div>
              </div>
            </div>

            {amount && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FeeDisplay 
                  title="Locker Creation Fee"
                  feeAmount={lockerFee}
                  totalAmount={lockerFee}
                  netAmount={0}
                  feeRecipient={FEE_RECIPIENT}
                  symbol="GPB"
                />
              </motion.div>
            )}

            {error && (
              <Alert variant="destructive" className="glass-card border-destructive/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || !amount || !unlockDate || !tokenAddress || !activeAddress}
              className="w-full h-12 crypto-gradient text-white font-bold hover:opacity-90 transition-all duration-200"
            >
              {loading && operation === 'lock' ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Fee & Locking...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-5 w-5" />
                  Lock Tokens
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className="glass-card border-accent/50 bg-accent/5">
            <CheckCircle className="h-5 w-5 text-accent" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-bold text-[var(--text-primary)]">{result.message}</p>
                <div className="text-sm space-y-1 text-[var(--text-secondary)] font-medium">
                  <p className="font-mono break-all">
                    <span className="text-[var(--text-primary)]">TX Hash:</span> {result.transactionHash}
                  </p>
                  <p className="font-mono break-all">
                    <span className="text-[var(--text-primary)]">Locked By:</span> {result.lockedBy}
                  </p>
                  <p>
                    <span className="text-[var(--text-primary)]">Amount Locked:</span> {result.amount}
                  </p>
                  <p className="text-destructive/90">
                    <span className="text-[var(--text-primary)]">Fee Deducted:</span> {result.feePaid} GPB
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-[var(--text-primary)]">Unlocks:</span> {new Date(result.unlockDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
};

export default TokenLocker;
