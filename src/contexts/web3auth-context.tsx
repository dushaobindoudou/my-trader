'use client';

import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
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
  const { address, chain , chainId} = useAccount();

  const { switchChain, loading: switchChainLoading, error: switchChainError } = useSwitchChain();
  
  // 用于跟踪是否已经为当前地址创建了会话
  const sessionCreatedRef = useRef<string | null>(null);


  const login = async () => {
    try {
      await connect();
      await switchChain(authConfig.web3Auth.chainConfig.chainId as string);
      
      // 连接成功后，调用后端 API 创建会话
      // 注意：这里需要等待 address 更新，所以我们将在 useEffect 中处理
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // 先调用后端 API 使会话失效
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include', // 包含 Cookie
        });
      } catch (error) {
        console.error('Failed to logout from backend:', error);
      }
      
      // 清除会话引用
      sessionCreatedRef.current = null;
      
      // 断开 Web3Auth 连接
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
    // TODO: 实现余额查询
    return '0';
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

  // 当连接成功且有地址时，自动创建后端会话
  useEffect(() => {
    const createBackendSession = async () => {
      if (isConnected && address && sessionCreatedRef.current !== address) {
        try {
          console.log('Creating backend session for address:', address);
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // 包含 Cookie
            body: JSON.stringify({
              user_address: address,
              expiresInHours: 24,
              metadata: {
                connectorName,
                chainId,
                loginTime: new Date().toISOString(),
              },
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to create backend session:', error);
            return;
          }

          const data = await response.json();
          console.log('Backend session created successfully:', {
            session_id: data.session_id?.substring(0, 10) + '...',
            user_address: data.user_address,
          });
          
          // 标记已为此地址创建会话
          sessionCreatedRef.current = address;
        } catch (error) {
          console.error('Error creating backend session:', error);
        }
      }
    };

    createBackendSession();
  }, [isConnected, address, connectorName, chainId]);

  // 当断开连接时，清除会话引用
  useEffect(() => {
    if (!isConnected) {
      sessionCreatedRef.current = null;
    }
  }, [isConnected]);

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