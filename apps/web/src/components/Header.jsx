
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, Settings, HelpCircle, Info, Mail, LayoutDashboard, LogOut, ArrowRightLeft, Droplet, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LOGO_URL } from '@/constants';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Wallet },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, protected: true },
  { path: '/swap', label: 'Swap', icon: ArrowRightLeft, protected: true },
  { path: '/liquidity', label: 'Liquidity', icon: Droplet, protected: true },
  { path: '/lock', label: 'Lock', icon: Lock, protected: true },
  { path: '/settings', label: 'Settings', icon: Settings, protected: true },
  { path: '/help', label: 'Help', icon: HelpCircle },
  { path: '/about', label: 'About', icon: Info },
  { path: '/contact', label: 'Contact', icon: Mail }
];

const Header = () => {
  const { isConnected, connectedWallet, walletType, disconnectWallet } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Only show protected routes if the user is connected
  const visibleNavItems = NAV_ITEMS.filter(item => !item.protected || isConnected);

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card-strong border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={LOGO_URL}
              alt="Bloxology logo"
              className="h-9 sm:h-10 w-auto object-contain group-hover:scale-110 group-hover:drop-shadow-lg transition-transform duration-300"
            />
            <span className="text-xl font-bold text-[var(--text-primary)] text-shadow-sm">Bloxology</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "text-primary text-shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="glass-card px-3 py-1.5 rounded-lg border border-primary/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] leading-none text-[var(--text-muted)] font-medium uppercase tracking-wider">
                      {walletType}
                    </span>
                    <span className="font-mono text-sm text-[var(--text-primary)]">
                      {truncateAddress(connectedWallet)}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={disconnectWallet}
                  className="text-[var(--text-muted)] hover:text-destructive hover:bg-destructive/10"
                  title="Disconnect"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-card hover:glass-card-strong text-[var(--text-primary)] transition-all duration-200 h-9"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[var(--text-primary)] hover:bg-white/10 transition-colors duration-200"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-border/50 glass-card-strong overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 font-medium",
                      isActive 
                        ? "bg-primary/20 text-primary text-shadow-sm" 
                        : "text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="h-px bg-border/50 my-2" />

              {isConnected ? (
                <div className="px-3 py-2 space-y-3">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Connected Wallet</div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--text-secondary)] capitalize">{walletType}</span>
                      <span className="font-mono text-sm text-[var(--text-primary)]">{truncateAddress(connectedWallet)}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        disconnectWallet();
                        setMobileMenuOpen(false);
                      }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full crypto-gradient text-white mt-2">
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
