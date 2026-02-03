import { sepolia, mainnet } from '@starknet-react/chains';
import { jsonRpcProvider, argent, braavos } from '@starknet-react/core';

export const chains = [mainnet, sepolia];

export function provider() {
  return jsonRpcProvider({
    rpc: (chain) => {
      if (chain.id === mainnet.id) {
        return { nodeUrl: 'https://starknet-mainnet.public.blastapi.io' };
      }
      return { nodeUrl: 'https://starknet-sepolia.public.blastapi.io' };
    },
  });
}

// Wallet connectors for StarkNet
export const connectors = [
  argent(),
  braavos(),
];

// EdgeX contract addresses on StarkNet mainnet
export const EDGEX_CONTRACTS = {
  // These will be populated from EdgeX documentation
  ROUTER: '0x...', // Main trading router contract
  VAULT: '0x...', // Collateral vault
  POSITION_MANAGER: '0x...', // Position management
};

// EdgeX API endpoints
export const EDGEX_API = {
  BASE_URL: 'https://api.edgex.exchange',
  WS_URL: 'wss://ws.edgex.exchange',
};
