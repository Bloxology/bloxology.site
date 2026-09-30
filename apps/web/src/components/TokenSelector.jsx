
import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, Coins } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TokenSelector = ({ selectedToken, onTokenChange, tokens = [], disabled, label = "Select Token" }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;
    const query = searchQuery.toLowerCase();
    return tokens.filter(t => 
      t.symbol.toLowerCase().includes(query) || 
      (t.name && t.name.toLowerCase().includes(query)) ||
      t.address.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  const selectedTokenData = tokens.find(t => t.address === selectedToken);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between glass-card hover:glass-card-strong text-[var(--text-primary)] h-12 px-4 font-bold text-lg"
        >
          {selectedTokenData ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">
                {selectedTokenData.symbol.charAt(0)}
              </div>
              {selectedTokenData.symbol}
            </div>
          ) : (
            <span className="text-[var(--text-muted)] font-medium text-base">{label}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 glass-card-strong border-border/50 z-50" align="start">
        <div className="p-3 border-b border-border/30">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
            <Input
              placeholder="Search name or paste address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 input-high-contrast h-9 text-sm"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredTokens.length === 0 ? (
            <div className="py-6 text-center text-sm text-[var(--text-muted)] flex flex-col items-center gap-2">
              <Coins className="h-8 w-8 opacity-20" />
              No tokens found.
            </div>
          ) : (
            filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => {
                  onTokenChange(token.address);
                  setOpen(false);
                  setSearchQuery('');
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors duration-200 text-left",
                  selectedToken === token.address 
                    ? "bg-primary/20 border border-primary/30" 
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {token.symbol.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[var(--text-primary)] leading-none mb-1">{token.symbol}</span>
                    <span className="text-xs text-[var(--text-muted)]">{token.name || 'Token'}</span>
                  </div>
                </div>
                {token.balance && (
                  <div className="text-right flex flex-col">
                    <span className="font-medium text-[var(--text-primary)]">{token.balance}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TokenSelector;
