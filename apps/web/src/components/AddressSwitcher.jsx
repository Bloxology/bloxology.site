
import React, { useState } from 'react';
import { Check, ChevronDown, Copy, LogOut, Wallet, Loader2, Eye, Plus } from 'lucide-react';
import { useBaseAuth } from '@/contexts/BaseAuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const AddressSwitcher = () => {
  const { 
    activeAddress, 
    availableAddresses, 
    switchAddress,
    addWatchAddress,
    addressSwitchLoading,
    disconnect,
    walletType
  } = useBaseAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState('');

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopy = (e, addr) => {
    e.stopPropagation();
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleSwitch = (addr) => {
    if (addr.toLowerCase() !== (activeAddress || '').toLowerCase()) {
      switchAddress(addr);
    }
    setIsOpen(false);
  };

  const handleAddWatch = async () => {
    const trimmed = manualAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/i.test(trimmed)) {
      setAddressError('Invalid Ethereum address');
      return;
    }
    setAddressError('');
    await addWatchAddress(trimmed);
    setManualAddress('');
    setIsOpen(false);
  };

  if (!activeAddress) return null;

  const activeWalletData = availableAddresses.find(a => a.address.toLowerCase() === activeAddress.toLowerCase()) || { label: 'Wallet' };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="glass-card hover:glass-card-strong border-primary/20 flex items-center gap-2 h-9 px-3 transition-all duration-200"
        >
          {addressSwitchLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] leading-none text-[var(--text-muted)] font-medium uppercase tracking-wider flex items-center gap-1">
              {walletType === 'metamask' ? 'MetaMask' : activeWalletData.label}
            </span>
            <span className="font-mono text-sm text-[var(--text-primary)]">
              {truncateAddress(activeAddress)}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2 glass-card-strong border-border/50 shadow-xl rounded-xl">
        <div className="px-2 py-1.5 mb-2 flex justify-between items-center">
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Available Accounts
          </h4>
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {availableAddresses.length} Found
          </span>
        </div>
        
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {availableAddresses.map((wallet) => {
            const isActive = wallet.address.toLowerCase() === (activeAddress || '').toLowerCase();
            return (
              <div
                key={wallet.address}
                onClick={() => handleSwitch(wallet.address)}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 border border-primary/20" 
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={cn(
                    "p-2 rounded-full flex-shrink-0 transition-colors",
                    isActive ? "bg-primary/20 text-primary" : "bg-white/5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                  )}>
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {wallet.label}
                      </span>
                      {wallet.isWatch && (
                        <span className="text-[10px] font-medium bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" /> Watch
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-[var(--text-secondary)]" title={wallet.address}>
                        {truncateAddress(wallet.address)}
                      </span>
                      <span className="text-xs font-semibold text-accent">
                        {wallet.balance} ETH
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleCopy(e, wallet.address)}
                    title="Copy Address"
                  >
                    {copiedAddress === wallet.address ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-2 bg-border/50" />
        
        <div className="px-1 py-1">
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 px-1">
            Watch Address
          </h4>
          <div className="flex gap-1.5">
            <Input
              placeholder="0x..."
              value={manualAddress}
              onChange={(e) => { setManualAddress(e.target.value); setAddressError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWatch()}
              className="h-8 text-xs font-mono bg-white/5 border-border/50"
              id="watch-address-input"
              name="watchAddress"
            />
            <Button
              size="sm"
              className="h-8 px-2 bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
              onClick={handleAddWatch}
              disabled={addressSwitchLoading}
            >
              {addressSwitchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
          {addressError && (
            <p className="text-xs text-destructive mt-1 px-1">{addressError}</p>
          )}
        </div>

        <Separator className="my-2 bg-border/50" />
        
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-2"
          onClick={() => {
            disconnect();
            setIsOpen(false);
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect Wallet
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default AddressSwitcher;
