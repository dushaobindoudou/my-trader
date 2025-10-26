import { WEB3AUTH_NETWORK } from "@web3auth/modal";
import { type Web3AuthContextConfig } from "@web3auth/modal/react";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '';

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK === 'sapphire_devnet' 
      ? WEB3AUTH_NETWORK.SAPPHIRE_DEVNET 
      : WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  },
};

export default web3AuthContextConfig;
