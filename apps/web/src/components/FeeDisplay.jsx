
import React from 'react';
import { Receipt, ArrowRight, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const FeeDisplay = ({ 
  feeAmount, 
  feePercent, 
  totalAmount, 
  netAmount, 
  feeRecipient,
  symbol = '',
  title = 'Transaction Breakdown'
}) => {
  const formatVal = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  return (
    <Card className="glass-card border-primary/20 bg-primary/5 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold mb-2">
          <Receipt className="h-4 w-4 text-primary" />
          {title}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)]">Gross Amount</span>
            <span className="font-medium text-[var(--text-primary)]">
              {formatVal(totalAmount)} {symbol}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-destructive/90">
            <span className="flex items-center gap-1">
              Protocol Fee {feePercent ? `(${feePercent}%)` : ''}
            </span>
            <span className="font-medium">
              - {formatVal(feeAmount)} {symbol}
            </span>
          </div>
          
          <div className="h-px w-full bg-border/50 my-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-primary)] font-medium">Net Amount</span>
            <span className="font-bold text-accent flex items-center gap-1">
              {formatVal(netAmount)} {symbol}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/30 flex items-start gap-2 text-xs text-[var(--text-muted)]">
          <Wallet className="h-3 w-3 mt-0.5 shrink-0" />
          <div className="break-all">
            Fee Recipient: <span className="font-mono text-[var(--text-secondary)]">{feeRecipient}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeeDisplay;
