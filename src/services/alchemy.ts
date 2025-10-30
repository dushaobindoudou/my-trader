import http from '@/lib/http';

type JsonRpcError = {
  code: number;
  message: string;
  data?: unknown;
};

type JsonRpcResponse<T> = {
  jsonrpc: '2.0';
  id: number | string;
  result?: T;
  error?: JsonRpcError;
};

async function rpcCall<T>(
  method: string,
  params: unknown[] = [],
  id: number | string = Date.now()
): Promise<T> {
  const { data } = await http.post<JsonRpcResponse<T>>('/api/alchemy', {
    jsonrpc: '2.0',
    id,
    method,
    params,
  });

  if ((data as JsonRpcResponse<T>).error) {
    const err = (data as JsonRpcResponse<T>).error!;
    throw new Error(`${err.code}: ${err.message}`);
  }

  return (data as JsonRpcResponse<T>).result as T;
}

export async function getBlockNumber(): Promise<bigint> {
  const hex = await rpcCall<string>('eth_blockNumber');
  return BigInt(hex);
}

export async function getEthBalance(
  address: string,
  blockTag: 'latest' | string = 'latest'
): Promise<bigint> {
  const hex = await rpcCall<string>('eth_getBalance', [address, blockTag]);
  return BigInt(hex);
}

export async function getTransactionCount(
  address: string,
  blockTag: 'latest' | string = 'latest'
): Promise<number> {
  const hex = await rpcCall<string>('eth_getTransactionCount', [address, blockTag]);
  return Number.parseInt(hex, 16);
}

// --- ERC20 helpers ---
function toData(methodSig: string, argsData: string = ''): string {
  // methodSig is already a 4-byte selector hex like 0x70a08231
  return methodSig + argsData.replace(/^0x/, '');
}

function pad32(hexWithout0x: string): string {
  return hexWithout0x.padStart(64, '0');
}

export async function erc20BalanceOf(
  contract: string,
  owner: string,
  blockTag: 'latest' | string = 'latest'
): Promise<bigint> {
  // selector for balanceOf(address) = 0x70a08231
  const selector = '0x70a08231';
  const addr = owner.toLowerCase().replace(/^0x/, '');
  const data = toData(selector, pad32(addr));
  const result = await rpcCall<string>('eth_call', [
    { to: contract, data },
    blockTag,
  ]);
  return BigInt(result);
}

export async function erc20Decimals(
  contract: string,
  blockTag: 'latest' | string = 'latest'
): Promise<number> {
  // selector for decimals() = 0x313ce567
  const selector = '0x313ce567';
  const data = toData(selector);
  const result = await rpcCall<string>('eth_call', [
    { to: contract, data },
    blockTag,
  ]);
  return Number.parseInt(result, 16);
}

export async function erc20Symbol(
  contract: string,
  blockTag: 'latest' | string = 'latest'
): Promise<string> {
  // selector for symbol() = 0x95d89b41
  const selector = '0x95d89b41';
  const data = toData(selector);
  const result = await rpcCall<string>('eth_call', [
    { to: contract, data },
    blockTag,
  ]);
  try {
    // Attempt to decode string from hex-encoded ABI dynamic string
    // Many tokens return ASCII in tail; simple heuristic to strip zeros
    const hex = result.replace(/^0x/, '');
    // In many implementations, last 64 contain offset/len; naive parse last 64 as length
    // Fallback: decode as UTF-8 directly ignoring ABI strictness
    const buf = Buffer.from(hex.replace(/00+$/g, ''), 'hex');
    return buf.toString('utf8').replace(/[^\x20-\x7E]/g, '') || 'TOKEN';
  } catch {
    return 'TOKEN';
  }
}

export const alchemy = {
  rpcCall,
  getBlockNumber,
  getEthBalance,
  getTransactionCount,
  erc20BalanceOf,
  erc20Decimals,
  erc20Symbol,
};

export default alchemy;


