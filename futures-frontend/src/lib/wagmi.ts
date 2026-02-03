import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, arbitrum, optimism, base, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'AI Prompt Builder - DeFi Trader',
  projectId: 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [
    mainnet,
    arbitrum,
    optimism,
    base,
    polygon,
  ],
  ssr: false,
});
