
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Wallet, Bell, Zap, Percent, LogOut, Globe, ExternalLink, Network, Coins } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import NetworkSelector from '@/components/NetworkSelector.jsx';
import CustomNetworkManager from '@/components/CustomNetworkManager.jsx';
import CustomTokenManager from '@/components/CustomTokenManager.jsx';

const SettingsPage = () => {
  const { connectedWallet, disconnectWallet } = useWallet();
  const { selectedNetwork } = useNetwork();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    notifications: true,
    priceAlerts: true,
    transactionAlerts: false,
    gasPreference: 'standard',
    slippageTolerance: '0.5'
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('bloxology_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, []);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('bloxology_settings', JSON.stringify(newSettings));
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated"
    });
  };

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleGasChange = (value) => {
    const newSettings = { ...settings, gasPreference: value };
    saveSettings(newSettings);
  };

  const handleSlippageChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setSettings({ ...settings, slippageTolerance: value });
    }
  };

  const handleSlippageBlur = () => {
    saveSettings(settings);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: "Wallet disconnected",
      description: "You have been logged out"
    });
  };

  return (
    <>
      <Helmet>
        <title>Settings - Bloxology</title>
        <meta name="description" content="Manage your Bloxology preferences and wallet settings" />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
              Settings
            </h1>
            <p className="text-lg text-[var(--text-secondary)] font-medium">
              Manage your preferences, network, and wallet connection
            </p>
          </motion.div>

          <div className="space-y-6">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Globe className="h-5 w-5 text-primary" />
                    Network Selection
                  </CardTitle>
                  <CardDescription className="text-[var(--text-secondary)] font-medium">Select your active blockchain network</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <NetworkSelector />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Coins className="h-5 w-5 text-primary" />
                    Custom Tokens
                  </CardTitle>
                  <CardDescription className="text-[var(--text-secondary)] font-medium">Manage custom ERC-20 tokens for the current network</CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomTokenManager />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Wallet className="h-5 w-5 text-primary" />
                    Wallet Connection
                  </CardTitle>
                  <CardDescription className="text-[var(--text-secondary)] font-medium">Manage your connected wallet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {connectedWallet ? (
                    <>
                      <div className="glass-card p-4 rounded-lg space-y-2">
                        <p className="text-sm text-[var(--text-secondary)] font-medium">Connected Address</p>
                        <p className="font-mono text-sm break-all text-[var(--text-primary)]">{connectedWallet.address}</p>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          <span>Active</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleDisconnect}
                        variant="destructive"
                        className="w-full font-bold"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect Wallet
                      </Button>
                    </>
                  ) : (
                    <p className="text-[var(--text-secondary)] font-medium">No wallet connected</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Bell className="h-5 w-5 text-primary" />
                    Notifications
                  </CardTitle>
                  <CardDescription className="text-[var(--text-secondary)] font-medium">Configure your alert preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications" className="text-base">Enable Notifications</Label>
                      <p className="text-sm text-[var(--text-secondary)] font-medium">Receive all notifications</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={settings.notifications}
                      onCheckedChange={() => handleToggle('notifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="priceAlerts" className="text-base">Price Alerts</Label>
                      <p className="text-sm text-[var(--text-secondary)] font-medium">Get notified when price targets are reached</p>
                    </div>
                    <Switch
                      id="priceAlerts"
                      checked={settings.priceAlerts}
                      onCheckedChange={() => handleToggle('priceAlerts')}
                      disabled={!settings.notifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="transactionAlerts" className="text-base">Transaction Alerts</Label>
                      <p className="text-sm text-[var(--text-secondary)] font-medium">Get notified about transaction status</p>
                    </div>
                    <Switch
                      id="transactionAlerts"
                      checked={settings.transactionAlerts}
                      onCheckedChange={() => handleToggle('transactionAlerts')}
                      disabled={!settings.notifications}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Zap className="h-5 w-5 text-primary" />
                    Gas Preferences
                  </CardTitle>
                  <CardDescription className="text-[var(--text-secondary)] font-medium">Choose your default gas price setting</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={settings.gasPreference} onValueChange={handleGasChange}>
                    <div className="flex items-center space-x-3 glass-card p-3 rounded-lg">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard" className="flex-1 cursor-pointer">
                        <div className="font-bold text-[var(--text-primary)]">Standard</div>
                        <div className="text-sm text-[var(--text-secondary)] font-medium">Lower fees, slower confirmation</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 glass-card p-3 rounded-lg">
                      <RadioGroupItem value="fast" id="fast" />
                      <Label htmlFor="fast" className="flex-1 cursor-pointer">
                        <div className="font-bold text-[var(--text-primary)]">Fast</div>
                        <div className="text-sm text-[var(--text-secondary)] font-medium">Balanced fees and speed</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 glass-card p-3 rounded-lg">
                      <RadioGroupItem value="instant" id="instant" />
                      <Label htmlFor="instant" className="flex-1 cursor-pointer">
                        <div className="font-bold text-[var(--text-primary)]">Instant</div>
                        <div className="text-sm text-[var(--text-secondary)] font-medium">Higher fees, fastest confirmation</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Percent className="h-5 w-5 text-primary" />
                    Slippage Tolerance
                  </CardTitle>
                  <CardDescription className="text-[var(--text-secondary)] font-medium">Maximum price slippage for swaps</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.slippageTolerance}
                      onChange={handleSlippageChange}
                      onBlur={handleSlippageBlur}
                      className="max-w-[120px] input-high-contrast"
                    />
                    <span className="text-[var(--text-secondary)] font-bold">%</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] font-medium mt-2">
                    Recommended: 0.5% - 1.0%
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
