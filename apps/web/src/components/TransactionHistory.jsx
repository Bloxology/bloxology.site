
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightLeft, ArrowUpRight, ArrowDownLeft, FileCode, 
  Search, Filter, RefreshCw, History, ChevronLeft, ChevronRight 
} from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';
import { getTransactionUrl } from '@/utils/etherscanLinks.js';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TransactionStatusBadge from './TransactionStatusBadge.jsx';

const ITEMS_PER_PAGE = 10;

const TransactionHistory = ({ currentNetwork, walletAddress }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTransactions = async (showRefreshIndicator = false) => {
    if (!walletAddress) return;
    
    if (showRefreshIndicator) setIsRefreshing(true);
    else if (transactions.length === 0) setLoading(true);
    
    setError(null);

    try {
      const chainId = currentNetwork?.id || 1;
      const response = await apiServerClient.fetch(`/etherscan/transactions?address=${walletAddress}&chainId=${chainId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      // Ensure data is an array
      const txList = Array.isArray(data.data) ? data.data : [];
      setTransactions(txList);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Auto-refresh every 20 seconds
    const interval = setInterval(() => {
      fetchTransactions(false);
    }, 20000);

    return () => clearInterval(interval);
  }, [walletAddress, currentNetwork?.id]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const getTxType = (tx) => {
    if (tx.to?.toLowerCase() === walletAddress?.toLowerCase()) return 'receive';
    if (tx.input && tx.input !== '0x') return 'contract';
    return 'send';
  };

  const getTxIcon = (type) => {
    switch (type) {
      case 'receive': return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'send': return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'contract': return <FileCode className="h-4 w-4 text-purple-500" />;
      default: return <ArrowRightLeft className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatAmount = (valueEth) => {
    if (!valueEth || valueEth === '0') return '0.00';
    const num = parseFloat(valueEth);
    return num < 0.0001 ? '< 0.0001' : num.toFixed(4);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.hash.toLowerCase().includes(search.toLowerCase()) || 
                          tx.to?.toLowerCase().includes(search.toLowerCase());
    
    const txStatus = tx.isError === '1' ? 'failed' : 'success';
    const matchesStatus = statusFilter === 'all' || txStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const handleRowClick = (tx) => {
    navigate(`/transaction/${tx.hash}`, { state: { tx, network: currentNetwork } });
  };

  if (!walletAddress) return null;

  return (
    <Card className="glass-card border-border/50 overflow-hidden">
      <CardHeader className="border-b border-border/30 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl text-[var(--text-primary)] flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Transaction History
          </CardTitle>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
              <Input
                id="transaction-search"
                name="transactionSearch"
                placeholder="Search hash or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 input-high-contrast text-sm"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 glass-card">
                <Filter className="h-3.5 w-3.5 mr-2 text-[var(--text-muted)]" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="glass-card-strong border-border/50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchTransactions(true)}
              disabled={loading || isRefreshing}
              className="h-9 w-9 text-[var(--text-secondary)] hover:text-primary hover:bg-primary/10"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--text-muted)] uppercase bg-black/20 border-b border-border/30">
              <tr>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Transaction Hash</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 bg-white/5" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32 bg-white/5" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-white/5 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 bg-white/5 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 bg-white/5 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center">
                      <History className="h-10 w-10 mb-3 opacity-20" />
                      <p className="text-base font-medium">No transactions found</p>
                      <p className="text-xs mt-1">Try adjusting your filters or check back later.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {paginatedTransactions.map((tx, idx) => {
                    const type = getTxType(tx);
                    const status = tx.isError === '1' ? 'failed' : 'success';
                    
                    return (
                      <motion.tr 
                        key={tx.hash}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        onClick={() => handleRowClick(tx)}
                        className="hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors">
                              {getTxIcon(type)}
                            </div>
                            <span className="font-medium text-[var(--text-primary)] capitalize">
                              {type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-[var(--text-secondary)] group-hover:text-primary transition-colors">
                            {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <TransactionStatusBadge status={status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-[var(--text-primary)]">
                            {formatAmount(tx.valueEth)} {currentNetwork?.currencySymbol || 'ETH'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-[var(--text-secondary)]">
                          {new Date(tx.timeStamp * 1000).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 bg-black/10">
            <span className="text-xs text-[var(--text-muted)]">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} entries
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 glass-card"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-[var(--text-primary)] px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 glass-card"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
