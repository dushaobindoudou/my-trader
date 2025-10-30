export type DefaultAsset = {
  chainId: number;
  symbol: string;
  name: string;
  assetType: 'NATIVE' | 'ERC20';
  contractAddress?: string;
  decimals: number;
};

export const DEFAULT_ASSETS: DefaultAsset[] = [
  // Ethereum Mainnet (chainId 1)
  { chainId: 1, symbol: 'ETH', name: 'Ether', assetType: 'NATIVE', decimals: 18 },
  {
    chainId: 1,
    symbol: 'USDT',
    name: 'Tether USD',
    assetType: 'ERC20',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
  },
  {
    chainId: 1,
    symbol: 'USDC',
    name: 'USD Coin',
    assetType: 'ERC20',
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
  },
];


