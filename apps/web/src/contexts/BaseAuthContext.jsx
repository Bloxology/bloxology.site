
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Layers, Diamond, Ghost, Hexagon, Network, Zap, CircleDot, Activity } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';
import { useWallet } from '@/contexts/WalletContext.jsx';

export const DEFAULT_NETWORKS = {
  1: { 
    id: 1, 
    name: 'Ethereum Mainnet', 
    icon: Diamond, 
    rpcUrl: 'https://eth.llamarpc.com', 
    blockExplorer: 'https://etherscan.io',
    currencySymbol: 'ETH',
    isTestnet: false,
    color: 'text-indigo-500',
    isCustom: false
  },
  137: { 
    id: 137, 
    name: 'Polygon Mainnet', 
    icon: Hexagon, 
    rpcUrl: 'https://polygon-rpc.com', 
    blockExplorer: 'https://polygonscan.com',
    currencySymbol: 'MATIC',
    isTestnet: false,
    color: 'text-purple-500',
    isCustom: false
  },
  8453: { 
    id: 8453, 
    name: 'Base Mainnet', 
    icon: Layers, 
    rpcUrl: 'https://mainnet.base.org', 
    blockExplorer: 'https://basescan.org',
    currencySymbol: 'ETH',
    isTestnet: false,
    color: 'text-blue-500',
    isCustom: false
  },
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    icon: CircleDot,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    currencySymbol: 'ETH',
    isTestnet: false,
    color: 'text-blue-400',
    isCustom: false
  },
  10: {
    id: 10,
    name: 'Optimism',
    icon: Zap,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    currencySymbol: 'ETH',
    isTestnet: false,
    color: 'text-red-500',
    isCustom: false
  },
  2222: {
    id: 2222,
    name: 'Kava',
    icon: Activity,
    rpcUrl: 'https://evm.kava.io',
    blockExplorer: 'https://kavascan.com',
    currencySymbol: 'KAVA',
    isTestnet: false,
    color: 'text-red-600',
    isCustom: false
  },
  84532: {
    id: 84532,
    name: 'Base Sepolia',
    icon: Layers,
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    currencySymbol: 'ETH',
    isTestnet: true,
    color: 'text-blue-400',
    isCustom: false
  },
  11155111: {
    id: 11155111,
    name: 'Sepolia Testnet',
    icon: Activity,
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorer: 'https://sepolia.etherscan.io',
    currencySymbol: 'SEP',
    isTestnet: true,
    color: 'text-gray-500',
    isCustom: false
  }
};

const BaseAuthContext = createContext(null);
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const isValidAddress = (value) => typeof value === 'string' && ADDRESS_REGEX.test(value);

const makeMockAddress = (seed = 1) => {
  const hex = seed.toString(16).padStart(40, '0').slice(-40);
  return `0x${hex}`;
};

const makeRandomMockAddress = () => {
  const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `0x${randomHex}`;
};

export const useBaseAuth = () => {
  const context = useContext(BaseAuthContext);
  if (!context) {
    throw new Error('useBaseAuth must be used within a BaseAuthProvider');
  }
  return context;
};

export const useNetwork = () => {
  const context = useContext(BaseAuthContext);
  if (!context) {
    throw new Error('useNetwork must be used within a BaseAuthProvider');
  }
  return {
    selectedNetwork: context.selectedNetwork,
    setSelectedNetwork: context.setSelectedNetwork,
    networks: context.networks,
    addCustomNetwork: context.addCustomNetwork,
    removeCustomNetwork: context.removeCustomNetwork,
    customTokens: context.customTokens,
    addCustomToken: context.addCustomToken,
    removeCustomToken: context.removeCustomToken
  };
};

export const BaseAuthProvider = ({ children }) => {
  const { wallet: externalWallet, isConnected: externalIsConnected } = useWallet();
  const [isConnected, setIsConnected] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const syncedWalletRef = useRef(null);
  
  const [networks, setNetworks] = useState(() => {
    let nets = { ...DEFAULT_NETWORKS };
    try {
      const saved = localStorage.getItem('customNetworks');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(key => {
          nets[key] = { ...parsed[key], icon: Network, isCustom: true };
        });
      }
    } catch (e) { /* ignore */ }
    return nets;
  });
  const [selectedNetwork, setSelectedNetworkState] = useState(() => {
    try {
      const savedId = localStorage.getItem('base_network_id');
      let nets = { ...DEFAULT_NETWORKS };
      const saved = localStorage.getItem('customNetworks');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(key => {
          nets[key] = { ...parsed[key], icon: Network, isCustom: true };
        });
      }
      if (savedId && nets[savedId]) return nets[savedId];
    } catch (e) { /* ignore */ }
    return DEFAULT_NETWORKS[1];
  });
  const [customTokens, setCustomTokens] = useState(() => {
    try {
      const saved = localStorage.getItem('customTokens');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [availableAddresses, setAvailableAddresses] = useState([]);
  const [activeAddress, setActiveAddressState] = useState(null);
  const [addressSwitchLoading, setAddressSwitchLoading] = useState(false);

  useEffect(() => {
    console.log('[BaseAuthContext] Initialized from localStorage:', {
      network: selectedNetwork?.name,
      customTokens: customTokens.length,
    });
  }, []);

  const setSelectedNetwork = (network) => {
    console.log('[BaseAuthContext] Setting selected network to:', network.name, 'Chain ID:', network.id);
    setSelectedNetworkState(network);
    localStorage.setItem('base_network_id', network.id.toString());
    if (availableAddresses.length > 0) {
      fetchAvailableAddresses(availableAddresses.map(a => a.address), activeAddress);
    }
  };

  const addCustomNetwork = (network) => {
    console.log('[BaseAuthContext] Adding custom network:', network);
    const newNetworks = { ...networks, [network.id]: { ...network, icon: Network, isCustom: true } };
    setNetworks(newNetworks);
    
    const customOnly = Object.keys(newNetworks)
      .filter(k => newNetworks[k].isCustom)
      .reduce((obj, key) => {
        obj[key] = newNetworks[key];
        return obj;
      }, {});
      
    localStorage.setItem('customNetworks', JSON.stringify(customOnly));
  };

  const removeCustomNetwork = (id) => {
    console.log('[BaseAuthContext] Removing custom network ID:', id);
    const newNetworks = { ...networks };
    delete newNetworks[id];
    setNetworks(newNetworks);
    
    if (selectedNetwork.id === id) {
      setSelectedNetwork(DEFAULT_NETWORKS[1]);
    }
    
    const customOnly = Object.keys(newNetworks)
      .filter(k => newNetworks[k].isCustom)
      .reduce((obj, key) => {
        obj[key] = newNetworks[key];
        return obj;
      }, {});
      
    localStorage.setItem('customNetworks', JSON.stringify(customOnly));
  };

  const setCustomNetworks = (newCustomNetworksArray) => {
    const merged = { ...DEFAULT_NETWORKS };
    const customOnly = {};
    
    newCustomNetworksArray.forEach(net => {
      merged[net.id] = { ...net, icon: Network, isCustom: true };
      customOnly[net.id] = net;
    });
    
    setNetworks(merged);
    localStorage.setItem('customNetworks', JSON.stringify(customOnly));
  };

  const addCustomToken = (token) => {
    console.log('[BaseAuthContext] Adding custom token:', token);
    const newTokens = [...customTokens.filter(t => t.address.toLowerCase() !== token.address.toLowerCase() || t.chainId !== token.chainId), token];
    setCustomTokens(newTokens);
    localStorage.setItem('customTokens', JSON.stringify(newTokens));
  };

  const removeCustomToken = (address, chainId) => {
    console.log('[BaseAuthContext] Removing custom token:', address, 'on chain:', chainId);
    const newTokens = customTokens.filter(t => !(t.address.toLowerCase() === address.toLowerCase() && t.chainId === chainId));
    setCustomTokens(newTokens);
    localStorage.setItem('customTokens', JSON.stringify(newTokens));
  };

  const getAddressBalance = async (addr) => {
    try {
      if (!addr || !/^0x[a-fA-F0-9]{40}$/i.test(addr)) {
        return '0.0000';
      }
      if (!selectedNetwork || !selectedNetwork.id) {
        return '0.0000';
      }

      const chainId = String(selectedNetwork.id);
      const endpoint = `/balance?address=${addr}&chainId=${chainId}`;
      
      console.log(`[BaseAuthContext] Fetching balance from: /hcgi/api${endpoint}`);
      
      const response = await apiServerClient.fetch(endpoint);
      const result = await response.json();

      // New backend format returns { success: true, data: { native: {...}, tokens: [...] } }
      if (result.success && result.data && result.data.native) {
        const native = result.data.native;
        if (native.balanceEth !== undefined && native.balanceEth !== null) {
          const ethStr = String(native.balanceEth);
          // Return full precision string — let display components format as needed
          return ethStr;
        }
      }

      // Legacy support for older format
      let balances = [];
      if (result.success && Array.isArray(result.data)) {
        balances = result.data;
      } else if (Array.isArray(result)) {
        balances = result;
      }

      const native = balances.find(b => b.type === 'native');
      if (native && native.balance) {
        return native.balance.toString();
      }
      return '0.0000';
    } catch (error) {
      console.error('[BaseAuthContext] Error fetching balance:', error);
      return '0.0000';
    }
  };

  const fetchAvailableAddresses = useCallback(async (accounts, currentActive) => {
    setAddressSwitchLoading(true);
    try {
      const safeAccounts = (Array.isArray(accounts) ? accounts : []).filter((addr) => {
        if (isValidAddress(addr)) return true;
        if (addr) {
          console.warn(`[BaseAuthContext] Skipping invalid account address: ${addr}`);
        }
        return false;
      });

      const formattedAccounts = await Promise.all(safeAccounts.map(async (addr, index) => {
        const balance = await getAddressBalance(addr);
        return {
          address: addr,
          balance,
          label: index === 0 ? 'Main Account' : `Account ${index + 1}`,
          isActive: addr.toLowerCase() === (currentActive || '').toLowerCase()
        };
      }));
      setAvailableAddresses(formattedAccounts);
      return formattedAccounts;
    } finally {
      setAddressSwitchLoading(false);
    }
  }, [selectedNetwork.id]);

  const switchAddress = useCallback((newAddress) => {
    if (!newAddress || !isValidAddress(newAddress)) {
      if (newAddress) {
        console.warn(`[BaseAuthContext] Refusing to switch to invalid address: ${newAddress}`);
      }
      return;
    }
    console.log('[BaseAuthContext] Switching active address to:', newAddress);
    setAddressSwitchLoading(true);
    
    setTimeout(() => {
      const normalizedAddress = newAddress.toLowerCase();
      setActiveAddressState(normalizedAddress);
      sessionStorage.setItem('base_active_address', normalizedAddress);
      
      setAvailableAddresses(prev => prev.map(acc => ({
        ...acc,
        isActive: acc.address.toLowerCase() === normalizedAddress
      })));
      
      setAddressSwitchLoading(false);
    }, 300);
  }, []);

  const handleAccountsChanged = useCallback(async (accounts) => {
    console.log('[BaseAuthContext] Accounts changed:', accounts);
    const validAccounts = (Array.isArray(accounts) ? accounts : []).filter(isValidAddress);

    if (validAccounts.length === 0) {
      disconnect();
    } else {
      const savedActiveAddress = sessionStorage.getItem('base_active_address');
      const targetActive = validAccounts.find(a => a.toLowerCase() === (savedActiveAddress || '').toLowerCase()) || validAccounts[0];
      
      await fetchAvailableAddresses(validAccounts, targetActive);
      
      if (activeAddress !== targetActive.toLowerCase()) {
        switchAddress(targetActive);
      }
    }
  }, [activeAddress, fetchAvailableAddresses, switchAddress]);

  useEffect(() => {
    const init = async () => {
      const savedSession = localStorage.getItem('base_auth_session');
      const savedWalletType = localStorage.getItem('base_wallet_type');
      const savedActiveAddress = sessionStorage.getItem('base_active_address');

      if (savedSession && savedWalletType === 'metamask' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setIsConnected(true);
            setWalletType('metamask');
            await handleAccountsChanged(accounts);
          } else {
            disconnect();
          }
        } catch (error) {
          disconnect();
        }
      } else if (savedSession) {
        setIsConnected(true);
        setWalletType('mock');
        const fallbackSession = isValidAddress(savedSession) ? savedSession : makeMockAddress(1);
        const fallbackActive = isValidAddress(savedActiveAddress) ? savedActiveAddress : fallbackSession;
        const mockAccounts = [fallbackSession, makeMockAddress(2)];
        await fetchAvailableAddresses(mockAccounts, fallbackActive);
        setActiveAddressState(fallbackActive.toLowerCase());
      }
    };

    init();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [handleAccountsChanged, fetchAvailableAddresses, networks]);

  // Sync WalletContext → BaseAuthContext when user connects via WalletConnector
  useEffect(() => {
    if (externalWallet && externalIsConnected) {
      const normalized = externalWallet.toLowerCase();
      // Only sync if this is a new wallet we haven't already synced
      if (syncedWalletRef.current === normalized) return;
      syncedWalletRef.current = normalized;

      console.log('[BaseAuthContext] Syncing wallet from WalletContext:', normalized);
      setIsConnected(true);
      // Note: Let the wallet type be set naturally from external context rather than hardcoding
      localStorage.setItem('base_auth_session', normalized);

      // Populate available addresses and set active
      const alreadyInList = availableAddresses.some(
        a => a.address.toLowerCase() === normalized
      );
      if (!alreadyInList) {
        fetchAvailableAddresses([normalized], normalized).then(() => {
          setActiveAddressState(normalized);
          sessionStorage.setItem('base_active_address', normalized);
        });
      } else if (activeAddress !== normalized) {
        switchAddress(normalized);
      }
    } else if (!externalIsConnected && syncedWalletRef.current) {
      // External wallet disconnected — clean up
      syncedWalletRef.current = null;
      disconnect();
    }
  }, [externalWallet, externalIsConnected]);

  const connect = async () => {
    console.log('[BaseAuthContext] Connecting wallet...');
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        setWalletType('metamask');
        localStorage.setItem('base_auth_session', accounts[0]);
        localStorage.setItem('base_wallet_type', 'metamask');
        
        await handleAccountsChanged(accounts);
        console.log('[BaseAuthContext] Connected via Metamask:', accounts[0]);
      } catch (error) {
        console.error("[BaseAuthContext] User rejected request", error);
      }
    } else {
      const mockAddress = makeRandomMockAddress();
      setIsConnected(true);
      setWalletType('mock');
      localStorage.setItem('base_auth_session', mockAddress);
      localStorage.setItem('base_wallet_type', 'mock');
      
      const mockAccounts = [mockAddress, makeRandomMockAddress()];
      await fetchAvailableAddresses(mockAccounts, mockAddress);
      switchAddress(mockAddress);
      console.log('[BaseAuthContext] Connected via Mock Wallet:', mockAddress);
    }
  };

  const disconnect = () => {
    console.log('[BaseAuthContext] Disconnecting wallet...');
    setIsConnected(false);
    setWalletType(null);
    setAvailableAddresses([]);
    setActiveAddressState(null);
    localStorage.removeItem('base_auth_session');
    localStorage.removeItem('base_wallet_type');
    sessionStorage.removeItem('base_active_address');
  };

  const addWatchAddress = useCallback(async (address) => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) return;
    const normalized = address.toLowerCase();

    // Skip if already in the list
    if (availableAddresses.some(a => a.address.toLowerCase() === normalized)) {
      switchAddress(normalized);
      return;
    }

    setAddressSwitchLoading(true);
    try {
      const balance = await getAddressBalance(normalized);
      const label = `Watch ${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
      setAvailableAddresses(prev => [
        ...prev,
        { address: normalized, balance, label, isActive: false, isWatch: true }
      ]);
      setIsConnected(true);
      switchAddress(normalized);
    } finally {
      setAddressSwitchLoading(false);
    }
  }, [availableAddresses, switchAddress, selectedNetwork.id]);

  return (
    <BaseAuthContext.Provider value={{ 
      isConnected, 
      walletType,
      activeAddress,
      walletAddress: activeAddress,
      availableAddresses,
      addressSwitchLoading,
      connect, 
      disconnect,
      switchAddress,
      addWatchAddress,
      setActiveAddress: switchAddress,
      fetchAvailableAddresses,
      getAddressBalance,
      selectedNetwork,
      setSelectedNetwork,
      networks,
      customNetworks: Object.values(networks).filter(n => n.isCustom),
      setCustomNetworks,
      addCustomNetwork,
      removeCustomNetwork,
      customTokens,
      setCustomTokens,
      addCustomToken,
      removeCustomToken
    }}>
      {children}
    </BaseAuthContext.Provider>
  );
};
