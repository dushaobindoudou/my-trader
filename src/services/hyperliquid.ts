/**
 * Hyperliquid API 服务封装
 * 提供交易、市场数据、账户等接口
 */

import axios, { AxiosError, AxiosInstance } from 'axios'
import type { KlineInterval } from '@/types/trading'

// Hyperliquid API 基础配置
const HYPERLIQUID_API_BASE = process.env.NEXT_PUBLIC_HYPERLIQUID_API_BASE || 'https://api.hyperliquid.xyz'
const HYPERLIQUID_EXCHANGE_API = process.env.NEXT_PUBLIC_HYPERLIQUID_EXCHANGE_API || 'https://api.hyperliquid.xyz/exchange'

// 错误类型
export class HyperliquidError extends Error {
  constructor(
    message: string,
    public code?: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'HyperliquidError'
  }
}

// 创建 Hyperliquid API 专用的 axios 实例
const hyperliquidApi: AxiosInstance = axios.create({
  baseURL: HYPERLIQUID_API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 创建 Hyperliquid Exchange API 专用的 axios 实例
const hyperliquidExchangeApi: AxiosInstance = axios.create({
  baseURL: HYPERLIQUID_EXCHANGE_API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器：统一错误处理
hyperliquidApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as any
      return Promise.reject(new HyperliquidError(
        data?.message || `HTTP ${status}: ${error.response.statusText}`,
        status,
        data
      ))
    } else if (error.request) {
      return Promise.reject(new HyperliquidError(
        'Network error: No response received from server',
        undefined,
        error
      ))
    } else {
      return Promise.reject(new HyperliquidError(
        error.message || 'Unknown error',
        undefined,
        error
      ))
    }
  }
)

hyperliquidExchangeApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as any
      return Promise.reject(new HyperliquidError(
        data?.message || `HTTP ${status}: ${error.response.statusText}`,
        status,
        data
      ))
    } else if (error.request) {
      return Promise.reject(new HyperliquidError(
        'Network error: No response received from server',
        undefined,
        error
      ))
    } else {
      return Promise.reject(new HyperliquidError(
        error.message || 'Unknown error',
        undefined,
        error
      ))
    }
  }
)

// 通用 API 请求函数
async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    params?: Record<string, any>
    data?: any
    headers?: Record<string, string>
  } = {}
): Promise<T> {
  try {
    const response = await hyperliquidApi.request<T>({
      url: endpoint,
      method: options.method || 'GET',
      params: options.params,
      data: options.data,
      headers: options.headers,
    })
    return response.data
  } catch (error) {
    if (error instanceof HyperliquidError) {
      throw error
    }
    throw new HyperliquidError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      error
    )
  }
}

// 交易 API 请求函数（需要签名）
async function exchangeRequest<T>(
  endpoint: string,
  body: unknown,
  signature?: string
): Promise<T> {
  try {
    const response = await hyperliquidExchangeApi.request<T>({
      url: endpoint,
      method: 'POST',
      data: body,
      headers: {
        ...(signature && { 'X-Signature': signature }),
      },
    })
    return response.data
  } catch (error) {
    if (error instanceof HyperliquidError) {
      throw error
    }
    throw new HyperliquidError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      error
    )
  }
}

// ==================== 市场数据接口 ====================

/**
 * 获取 K线数据
 * @param symbol 交易对
 * @param interval 时间周期
 * @param startTime 开始时间（可选，毫秒时间戳）
 * @param endTime 结束时间（可选，毫秒时间戳）
 * @param limit 返回数量限制（可选，默认 500）
 */
export async function getKlines(
  symbol: string,
  interval: KlineInterval,
  startTime?: number,
  endTime?: number,
  limit: number = 500
): Promise<Array<{
  time: number
  open: string
  high: string
  low: string
  close: string
  volume: string
}>> {
  try {
    // Hyperliquid API 使用 POST 请求，参数在请求体中
    const requestBody: any = {
      type: 'candleSnapshot',
      req: {
        coin: symbol,
        interval: mapIntervalToHyperliquid(interval),
        n: limit,
      },
    }

    // 添加可选的时间参数
    if (startTime) {
      requestBody.req.startTime = startTime
    }
    if (endTime) {
      requestBody.req.endTime = endTime
    }

    // 使用 axios POST 请求
    const response = await hyperliquidApi.post('/info', requestBody)
    const data = response.data
    
    // Hyperliquid API 返回格式可能是 { data: [...] } 或直接是数组
    if (data && Array.isArray(data)) {
      return data
    } else if (data && Array.isArray(data.data)) {
      return data.data
    } else if (data && data.candles && Array.isArray(data.candles)) {
      return data.candles
    }
    
    return []
  } catch (error) {
    if (error instanceof HyperliquidError) {
      throw error
    }
    throw new HyperliquidError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      error
    )
  }
}

/**
 * 将内部时间周期映射到 Hyperliquid API 格式
 */
function mapIntervalToHyperliquid(interval: KlineInterval): string {
  const mapping: Record<KlineInterval, string> = {
    '5min': '5m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1w',
  }
  return mapping[interval] || interval
}

/**
 * 获取行情数据（Ticker）
 * @param symbol 交易对（可选，不传则获取所有）
 */
export async function getTicker(symbol?: string): Promise<Array<{
  symbol: string
  lastPrice: string
  priceChange24h: string
  priceChangePercent24h: string
  volume24h: string
  high24h: string
  low24h: string
}>> {
  return apiRequest('/info', {
    method: 'GET',
    params: {
      type: 'ticker',
      ...(symbol && { symbol }),
    },
  })
}

/**
 * 获取所有交易对列表
 * 根据 Hyperliquid 官方文档：https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals
 * 使用 metaAndAssetCtxs 类型获取交易对信息
 */
export async function getSymbols(): Promise<Array<{
  name: string
  szDecimals: number
  maxLeverage: number
  onlyIsolated?: boolean
  isDelisted?: boolean
  marginMode?: string
}>> {
  try {
    // 根据官方文档，使用 POST 请求，type 为 "metaAndAssetCtxs"
    const requestBody = {
      type: 'metaAndAssetCtxs',
    }

    const response = await hyperliquidApi.post('/info', requestBody)
    const data = response.data
    
    // 根据文档，返回格式是数组：[universe, assetCtxs]
    // universe 是交易对列表
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      const universe = data[0]
      return universe.map((item: any) => ({
        name: item.name,
        szDecimals: item.szDecimals || 0,
        maxLeverage: item.maxLeverage || 0,
        onlyIsolated: item.onlyIsolated || false,
        isDelisted: item.isDelisted || false,
        marginMode: item.marginMode,
      }))
    }
    
    // 如果返回格式不同，尝试直接返回
    if (data && data.universe && Array.isArray(data.universe)) {
      return data.universe.map((item: any) => ({
        name: item.name,
        szDecimals: item.szDecimals || 0,
        maxLeverage: item.maxLeverage || 0,
        onlyIsolated: item.onlyIsolated || false,
        isDelisted: item.isDelisted || false,
        marginMode: item.marginMode,
      }))
    }
    
    return []
  } catch (error) {
    if (error instanceof HyperliquidError) {
      throw error
    }
    throw new HyperliquidError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      error
    )
  }
}

/**
 * 获取订单簿
 * @param symbol 交易对
 */
export async function getOrderBook(symbol: string): Promise<{
  bids: Array<[string, string]>
  asks: Array<[string, string]>
}> {
  return apiRequest('/info', {
    method: 'GET',
    params: {
      type: 'l2Book',
      symbol,
    },
  })
}

// ==================== 账户接口 ====================

/**
 * 获取账户余额
 * @param address 用户地址
 */
export async function getBalance(address: string): Promise<Array<{
  asset: string
  walletBalance: string
  availableBalance: string
  marginUsed: string
}>> {
  return apiRequest('/info', {
    method: 'GET',
    params: {
      type: 'clearinghouseState',
      user: address,
    },
  })
}

/**
 * 获取持仓信息
 * @param address 用户地址
 */
export async function getPositions(address: string): Promise<Array<{
  symbol: string
  side: 'long' | 'short'
  size: string
  entryPrice: string
  markPrice: string
  unrealizedPnl: string
  realizedPnl: string
}>> {
  return apiRequest('/info', {
    method: 'GET',
    params: {
      type: 'openPositions',
      user: address,
    },
  })
}

/**
 * 获取订单历史
 * @param address 用户地址
 */
export async function getOrderHistory(
  address: string,
  limit: number = 100
): Promise<Array<{
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  orderType: 'market' | 'limit' | 'stop'
  quantity: string
  price: string
  status: string
  executedAt: number
  createdAt: number
}>> {
  return apiRequest('/info', {
    method: 'GET',
    params: {
      type: 'userFills',
      user: address,
      limit,
    },
  })
}

// ==================== 交易接口 ====================

/**
 * 创建订单
 * @param address 用户地址
 * @param order 订单信息
 * @param signature 签名（需要从客户端传入）
 */
export async function createOrder(
  address: string,
  order: {
    symbol: string
    side: 'buy' | 'sell'
    orderType: 'market' | 'limit' | 'stop'
    quantity: number
    price?: number
    reduceOnly?: boolean
  },
  signature?: string
): Promise<{
  orderId: string
  status: string
}> {
  return exchangeRequest('/order', {
    address,
    ...order,
  }, signature)
}

/**
 * 取消订单
 * @param address 用户地址
 * @param orderId 订单ID
 * @param signature 签名
 */
export async function cancelOrder(
  address: string,
  orderId: string,
  signature?: string
): Promise<{
  success: boolean
}> {
  return exchangeRequest('/cancel', {
    address,
    orderId,
  }, signature)
}

/**
 * 批量取消订单
 * @param address 用户地址
 * @param symbol 交易对（可选，不传则取消所有）
 * @param signature 签名
 */
export async function cancelAllOrders(
  address: string,
  symbol?: string,
  signature?: string
): Promise<{
  success: boolean
  cancelledCount: number
}> {
  return exchangeRequest('/cancelAll', {
    address,
    ...(symbol && { symbol }),
  }, signature)
}

// ==================== 导出 ====================

export const hyperliquid = {
  // 市场数据
  getKlines,
  getTicker,
  getSymbols,
  getOrderBook,
  // 账户
  getBalance,
  getPositions,
  getOrderHistory,
  // 交易
  createOrder,
  cancelOrder,
  cancelAllOrders,
}

export default hyperliquid

