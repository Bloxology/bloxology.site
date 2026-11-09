import React from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TokenLocker = () => (
  <Card className="glass-card border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
        <Lock className="h-5 w-5" /> Token Locker
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Token locking is unavailable</AlertTitle>
        <AlertDescription>
          The previous flow transferred tokens to an address without an enforceable on-chain lock.
          Previous transfers are not time-locked and cannot be withdrawn through this page.
          A replacement locker has not been deployed.
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
);

export default TokenLocker;
