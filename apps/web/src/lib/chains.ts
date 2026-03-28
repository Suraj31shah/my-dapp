
import { type Chain } from 'viem';
import { mainnet, sepolia, arbitrum, arbitrumSepolia, baseSepolia } from 'viem/chains';

// Default supported chains
export const chains = [arbitrum, arbitrumSepolia, mainnet, sepolia, baseSepolia] as const;
  