'use client';

import React, { ReactNode } from 'react';
import { Web3AuthProvider } from '@web3auth/modal/react';
import { WagmiProvider } from '@web3auth/modal/react/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import web3AuthContextConfig from '@/config/web3auth';
import { Web3AuthProvider as CustomWeb3AuthProvider } from '@/contexts/web3auth-context';

const queryClient = new QueryClient();

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <CustomWeb3AuthProvider>
            {children}
          </CustomWeb3AuthProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
