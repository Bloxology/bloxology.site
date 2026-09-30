
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, ExternalLink, CheckCircle2, FileText, Clock, Zap, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import { useWallet } from '@/contexts/WalletContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { getTransactionUrl, getAddressUrl, getBlockUrl } from '@/utils/etherscanLinks.js';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionStatusBadge from '@/components/TransactionStatusBadge.jsx';

const TransactionDetailsPage = () => {
  const { hash } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedNetwork } = useNetwork();
  const { walletAddress } = useWallet();
  
  const [tx, setTx] = useState(location.state?.tx || null);
  const [loading, setLoading] = useState(!location.state?.tx);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const network = location.state?.network || selectedNetwork;

  useEffect(() => {
    const fetchTxDetails = async () => {
      if (tx || !walletAddress) return;
      
      setLoading(true);
      try {
        // If we don't have the tx in state, fetch the list and find it
        const response = await apiServerClient.fetch(`/etherscan/transactions?address=${walletAddress}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          const foundTx = data.data.find(t => t.hash.toLowerCase() === hash.toLowerCase());
          if (foundTx) {
            setTx(foundTx);
          } else {
            throw new Error('Transaction not found in recent history');
          }
        } else {
          throw new Error('Failed to fetch transaction details');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTxDetails();
  }, [hash, tx, walletAddress]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAmount = (valueEth) => {
    if (!valueEth || valueEth === '0') return '0';
    return parseFloat(valueEth).toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  return (
    <>
      <Helmet>
        <title>Transaction Details - Bloxology</title>
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 -ml-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold text-balance mb-6" style={{ letterSpacing: '-0.02em' }}>
              Transaction Details
            </h1>

            {error ? (
              <Card className="glass-card border-destructive/50 bg-destructive/5">
                <CardContent className="p-8 text-center">
                  <p className="text-destructive font-medium">{error}</p>
                  <Button onClick={() => navigate('/dashboard')} className="mt-4" variant="outline">
                    Return to Dashboard
                  </Button>
                </CardContent>
              </Card>
            ) : loading ? (
              <Card className="glass-card border-border/50">
                <CardContent className="p-6 space-y-6">
                  <Skeleton className="h-8 w-3/4 bg-white/5" />
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full bg-white/5" />
                    <Skeleton className="h-12 w-full bg-white/5" />
                    <Skeleton className="h-12 w-full bg-white/5" />
                  </div>
                </CardContent>
              </Card>
            ) : tx ? (
              <Card className="glass-card-strong border-primary/20 shadow-xl">
                <CardHeader className="border-b border-border/30 bg-black/20 pb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-sm text-[var(--text-muted)] font-medium uppercase tracking-wider">
                        Transaction Hash
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg md:text-xl text-[var(--text-primary)] break-all">
                          {tx.hash}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleCopy(tx.hash)}
                          className="h-8 w-8 shrink-0 text-[var(--text-secondary)] hover:text-primary"
                        >
                          {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <TransactionStatusBadge 
                        status={tx.isError === '1' ? 'failed' : 'success'} 
                        className="text-sm px-4 py-1.5"
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <dl className="divide-y divide-border/20">
                    
                    <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4 hover:bg-white/5 transition-colors">
                      <dt className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Status
                      </dt>
                      <dd className="md:col-span-2 text-sm font-medium text-[var(--text-primary)]">
                        {tx.isError === '1' ? (
                          <span className="text-destructive">Failed</span>
                        ) : (
                          <span className="text-green-500">Success</span>
                        )}
                      </dd>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4 hover:bg-white/5 transition-colors">
                      <dt className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Timestamp
                      </dt>
                      <dd className="md:col-span-2 text-sm text-[var(--text-primary)]">
                        {new Date(tx.timeStamp * 1000).toLocaleString()} ({tx.timeStamp})
                      </dd>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4 hover:bg-white/5 transition-colors">
                      <dt className="text-sm font-medium text-[var(--text-secondary)]">From</dt>
                      <dd className="md:col-span-2 text-sm">
                        <a 
                          href={getAddressUrl(tx.from, network)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-mono text-primary hover:underline break-all"
                        >
                          {tx.from}
                        </a>
                      </dd>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4 hover:bg-white/5 transition-colors">
                      <dt className="text-sm font-medium text-[var(--text-secondary)]">To</dt>
                      <dd className="md:col-span-2 text-sm">
                        <a 
                          href={getAddressUrl(tx.to, network)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-mono text-primary hover:underline break-all"
                        >
                          {tx.to || 'Contract Creation'}
                        </a>
                      </dd>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4 hover:bg-white/5 transition-colors bg-primary/5">
                      <dt className="text-sm font-medium text-[var(--text-secondary)]">Value</dt>
                      <dd className="md:col-span-2 text-lg font-bold text-[var(--text-primary)]">
                        {formatAmount(tx.valueEth)} {network?.currencySymbol || 'ETH'}
                      </dd>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4 hover:bg-white/5 transition-colors">
                      <dt className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Gas Used
                      </dt>
                      <dd className="md:col-span-2 text-sm text-[var(--text-primary)]">
                        {parseInt(tx.gasUsed).toLocaleString()}
                      </dd>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4 hover:bg-white/5 transition-colors">
                      <dt className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Hash className="h-4 w-4" /> Block Number
                      </dt>
                      <dd className="md:col-span-2 text-sm text-[var(--text-primary)]">
                        <a 
                          href={getBlockUrl(tx.blockNumber, network)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {tx.blockNumber}
                        </a>
                      </dd>
                    </div>

                  </dl>
                  
                  <div className="p-6 border-t border-border/30 bg-black/20 flex justify-end">
                    <Button asChild className="crypto-gradient text-white font-bold">
                      <a 
                        href={getTransactionUrl(tx.hash, network)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        View on Explorer <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default TransactionDetailsPage;
