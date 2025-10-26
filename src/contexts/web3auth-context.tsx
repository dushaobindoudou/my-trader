'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser, useSwitchChain } from '@web3auth/modal/react';
import { useAccount } from 'wagmi';
import { authConfig } from '@/config/auth';

interface Web3AuthContextType {
  user: any;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<any>;
  getAccounts: () => Promise<string[]>;
  getBalance: () => Promise<string>;
  address?: string;
  connectorName?: string;
  networkName?: string;
  networkChainId?: number;
  connectError?: Error;
  disconnectError?: Error;
  switchChainTo: (chainId: string) => Promise<void>;
  switchChainLoading: boolean;
  switchChainError: Error | null;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
};

interface Web3AuthProviderProps {
  children: ReactNode;
}

export const Web3AuthProvider: React.FC<Web3AuthProviderProps> = ({ children }) => {
  const { connect, isConnected, connectorName, loading: connectLoading, error: connectError } = useWeb3AuthConnect();
  const { disconnect, loading: disconnectLoading, error: disconnectError } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const { address, chain , chainId, balance} = useAccount();

  const { switchChain, loading: switchChainLoading, error: switchChainError } = useSwitchChain();


  const login = async () => {
    try {
      await connect();
      await switchChain(authConfig.web3Auth.chainConfig.chainId as string);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInfo = async () => {
    return userInfo;
  };

  const getAccounts = async () => {
    return address ? [address] : [];
  };

  const getBalance = async () => {
    // 这里需要根据具体的provider实现
    return balance?.value || '0';
  };

  const switchChainTo = async (chainId: string) => {
    try {
      console.log(chainId);
      await switchChain(chainId);
    } catch (error) {
      console.error('Switch chain error:', error);
    }
  };

  console.log(chain);

  const value: Web3AuthContextType = {
    user: userInfo,
    isLoading: connectLoading || disconnectLoading,
    isLoggedIn: isConnected,
    login,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    networkName: chain?.name || undefined,
    networkChainId: chainId || undefined,
    address,
    connectorName: connectorName || undefined,
    connectError: connectError || undefined,
    disconnectError: disconnectError || undefined,
    switchChainTo,
    switchChainLoading,
    switchChainError,
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
};