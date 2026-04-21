
import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [jwtToken, setJwtToken] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('bloxology_auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        if (parsed.jwtToken && parsed.address) {
          setWallet(parsed.address);
          setWalletType(parsed.walletType);
          setJwtToken(parsed.jwtToken);
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Failed to parse saved auth:', err);
        localStorage.removeItem('bloxology_auth');
      }
    }
  }, []);

  const connectWallet = (address, type, token) => {
    setWallet(address);
    setWalletType(type);
    setJwtToken(token);
    setIsConnected(true);
    setError(null);
    
    localStorage.setItem('bloxology_auth', JSON.stringify({
      address,
      walletType: type,
      jwtToken: token
    }));
  };

  const disconnectWallet = () => {
    setWallet(null);
    setWalletType(null);
    setJwtToken(null);
    setIsConnected(false);
    setError(null);
    localStorage.removeItem('bloxology_auth');
  };

  const logout = disconnectWallet;

  const clearError = () => setError(null);

  const connectedWallet = wallet;
  const walletAddress = wallet;

  const value = {
    wallet,
    connectedWallet,
    walletAddress,
    setWallet,
    walletType,
    setWalletType,
    jwtToken,
    setJwtToken,
    isConnected,
    setIsConnected,
    isConnecting,
    setIsConnecting,
    error,
    connectWallet,
    disconnectWallet,
    logout,
    clearError
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
