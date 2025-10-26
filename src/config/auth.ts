export const authConfig = {
  // Web3Auth 配置
  web3Auth: {
    clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '',
    network: (process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK as 'sapphire_devnet' | 'mainnet' | 'testnet' | 'cyan' | 'aqua') || 'sapphire_devnet',
    chainConfig: {
      chainNamespace: 'eip155',
      chainId: '0x1', // Ethereum Mainnet
      rpcTarget: process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
      displayName: 'Ethereum Mainnet',
      blockExplorerUrl: 'https://etherscan.io',
      ticker: 'ETH',
      tickerName: 'Ethereum',
      decimals: 18,
    },
    uiConfig: {
      appName: 'AIpha Trader',
      theme: 'dark',
      loginMethodsOrder: ['google', 'twitter', 'discord', 'github', 'email_passwordless'],
      defaultLanguage: 'zh',
      modalZIndex: '2147483647',
    },
    // 支持的登录方式
    loginMethods: {
      google: {
        name: 'Google',
        showOnModal: true,
      },
      twitter: {
        name: 'Twitter',
        showOnModal: true,
      },
      discord: {
        name: 'Discord',
        showOnModal: true,
      },
      github: {
        name: 'GitHub',
        showOnModal: true,
      },
      email_passwordless: {
        name: 'Email',
        showOnModal: true,
      },
    },
  },
  // 应用配置
  app: {
    name: 'AIpha Trader',
    description: '专业的Web3金融交易平台',
    logo: '/logo.svg',
    favicon: '/favicon.ico',
  },
  // 路由配置
  routes: {
    login: '/login',
    dashboard: '/',
    protected: ['/portfolio', '/trades', '/analysis', '/watchlist', '/history', '/knowledge', '/settings'],
  },
} as const;

export type AuthConfig = typeof authConfig;
