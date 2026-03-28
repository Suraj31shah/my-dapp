'use client';

import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, lightTheme, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/lib/wagmi';
import { StoreProvider } from '@/lib/store';
import '@rainbow-me/rainbowkit/styles.css';

    export function Providers({ children }: { children: React.ReactNode }) {
      const [queryClient] = useState(() => new QueryClient());

      return (
        
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={{
              lightMode: lightTheme(),
              darkMode: darkTheme(),
            }}
          >
            <StoreProvider>
              {children}
            </StoreProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
      );
    }
  