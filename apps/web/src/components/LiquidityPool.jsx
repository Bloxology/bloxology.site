
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertCircle, Droplets, Percent, Layers, Plus, CheckCircle } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';
import { useBaseAuth, useNetwork } from '@/contexts/BaseAuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FeeDisplay from '@/components/FeeDisplay.jsx';
import { calculateLiquidityFee, FEE_RECIPIENT, FEE_CONFIG } from '@/utils/feeCalculator.js';

const LiquidityPool = () => {
  const { activeAddress } = useBaseAuth();
  const { selectedNetwork } = useNetwork();
  const [poolAddress, setPoolAddress] = useState('');
  const [poolData, setPoolData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add Liquidity State
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [addResult, setAddResult] = useState(null);

  // Reset result when active address changes
  useEffect(() => {
    setAddResult(null);
  }, [activeAddress]);

  const fetchPoolData = async (e) => {
    if (e) e.preventDefault();
    if (!poolAddress.trim()) {
      setError('Please enter a pool address');
      return;
    }

    setLoading(true);
    setError(null);
    setPoolData(null);
    setAddResult(null);
    setLiquidityAmount('');

    try {
      const response = await apiServerClient.fetch(`/base/liquidity-pool?poolAddress=${poolAddress.trim()}&chainId=${selectedNetwork.id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch pool data');
      }

      setPoolData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (val) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 4
    }).format(val);
  };

  const calculateEstimatedSlippage = () => {
    if (!poolData) return 0;
    const r0 = parseFloat(poolData.reserve0);
    const tradeAmount = 1000;
    if (r0 === 0) return 0;
    const slippage = (tradeAmount / r0) * 100;
    return slippage.toFixed(2);
  };

  const handleAddLiquidity = (e) => {
    e.preventDefault();
    if (!liquidityAmount || isNaN(liquidityAmount) || parseFloat(liquidityAmount) <= 0 || !activeAddress) return;

    setIsAddingLiquidity(true);
    setAddResult(null);

    const feeAmount = calculateLiquidityFee(liquidityAmount);
    const netLiquidity = parseFloat(liquidityAmount) - feeAmount;

    // Simulate transaction using activeAddress
    setTimeout(() => {
      setIsAddingLiquidity(false);
      setAddResult({
        message: `Liquidity added successfully on ${selectedNetwork.name}`,
        transactionHash: '0x' + Math.random().toString(16).slice(2, 42),
        grossAmount: liquidityAmount,
        feePaid: feeAmount,
        netAmount: netLiquidity,
        addedBy: activeAddress
      });
      setLiquidityAmount('');
    }, 2000);
  };

  const liquidityFee = calculateLiquidityFee(liquidityAmount);
  const netLiquidity = liquidityAmount ? parseFloat(liquidityAmount) - liquidityFee : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl text-[var(--text-primary)] flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            {selectedNetwork.name} Pool Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={fetchPoolData} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="poolAddress">Pool Contract Address</Label>
              <Input
                id="poolAddress"
                placeholder="0x..."
                value={poolAddress}
                onChange={(e) => setPoolAddress(e.target.value)}
                className="input-high-contrast font-mono h-12"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={loading || !poolAddress}
                className="h-12 px-8 crypto-gradient text-white font-bold hover:opacity-90 transition-all duration-200 w-full sm:w-auto"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Fetch Pool'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="glass-card border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {poolData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card className="glass-card-strong border-primary/30 relative overflow-hidden md:col-span-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/20 text-primary">
                  <Droplets className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">Pool Overview</h3>
                  <p className="text-sm text-[var(--text-secondary)] font-mono">{poolAddress}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-xl space-y-1">
                  <p className="text-sm text-[var(--text-secondary)] font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Reserve 0
                  </p>
                  <p className="text-xl font-bold text-[var(--text-primary)]">{formatNumber(poolData.reserve0)}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono truncate" title={poolData.token0}>Token: {poolData.token0.slice(0,8)}...</p>
                </div>
                
                <div className="glass-card p-4 rounded-xl space-y-1">
                  <p className="text-sm text-[var(--text-secondary)] font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Reserve 1
                  </p>
                  <p className="text-xl font-bold text-[var(--text-primary)]">{formatNumber(poolData.reserve1)}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono truncate" title={poolData.token1}>Token: {poolData.token1.slice(0,8)}...</p>
                </div>

                <div className="glass-card p-4 rounded-xl space-y-1 bg-primary/5 border-primary/20">
                  <p className="text-sm text-[var(--text-secondary)] font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" /> Current APY
                  </p>
                  <p className="text-3xl font-extrabold text-primary">{poolData.apy}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-[var(--text-primary)]">Pool Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                <span className="text-[var(--text-secondary)] font-medium">Ratio (T0/T1)</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {(parseFloat(poolData.reserve0) / parseFloat(poolData.reserve1)).toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                <span className="text-[var(--text-secondary)] font-medium">Est. Slippage (1k trade)</span>
                <span className="font-bold text-accent">{calculateEstimatedSlippage()}%</span>
              </div>
              <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                <span className="text-[var(--text-secondary)] font-medium">Protocol</span>
                <span className="font-bold text-[var(--text-primary)]">Uniswap V3</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg text-[var(--text-primary)]">Add Liquidity</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLiquidity} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="liquidityAmount">Amount (LP Tokens)</Label>
                  <Input
                    id="liquidityAmount"
                    type="number"
                    step="any"
                    placeholder="0.0"
                    value={liquidityAmount}
                    onChange={(e) => setLiquidityAmount(e.target.value)}
                    className="input-high-contrast"
                  />
                </div>

                {liquidityAmount && parseFloat(liquidityAmount) > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <FeeDisplay 
                      title="Liquidity Provision Fee"
                      feeAmount={liquidityFee}
                      feePercent={FEE_CONFIG.LIQUIDITY_FEE_PERCENT}
                      totalAmount={liquidityAmount}
                      netAmount={netLiquidity}
                      feeRecipient={FEE_RECIPIENT}
                      symbol="LP"
                    />
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isAddingLiquidity || !liquidityAmount || parseFloat(liquidityAmount) <= 0 || !activeAddress}
                  className="w-full crypto-gradient text-white font-bold hover:opacity-90 transition-all duration-200"
                >
                  {isAddingLiquidity ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : !activeAddress ? (
                    'Connect Wallet'
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Liquidity
                    </>
                  )}
                </Button>
              </form>

              {addResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <Alert className="glass-card border-accent/50 bg-accent/5">
                    <AlertDescription className="text-sm space-y-1">
                      <p className="font-bold text-accent flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> {addResult.message}
                      </p>
                      <p className="text-[var(--text-secondary)] font-mono text-xs break-all">
                        TX: {addResult.transactionHash}
                      </p>
                      <p className="text-[var(--text-secondary)] font-mono text-xs break-all">
                        By: {addResult.addedBy}
                      </p>
                      <p className="text-[var(--text-primary)]">
                        Net Added: {formatNumber(addResult.netAmount)} LP
                      </p>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default LiquidityPool;
