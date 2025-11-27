/**
 * OKX API 服务封装
 * 提供市场数据接口（K线数据等）
 * 注意：交易操作仍在 Hyperliquid 上执行
 */

import axios, { AxiosError, AxiosInstance } from 'axios'
import type { KlineInterval } from '@/types/trading'

// OKX API 基础配置
const OKX_API_BASE = process.env.NEXT_PUBLIC_OKX_API_BASE || 'https://www.okx.com'

// 错误类型
export class OKXError extends Error {
  constructor(
    message: string,
    public code?: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'OKXError'
  }
}

// 创建 OKX API 专用的 axios 实例
const okxApi: AxiosInstance = axios.create({
  baseURL: OKX_API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器：统一错误处理
okxApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as any
      return Promise.reject(new OKXError(
        data?.msg || data?.message || `OKX API error: ${status}`,
        status,
        data
      ))
    }
    if (error.request) {
      return Promise.reject(new OKXError(
        'Network error: No response from OKX API',
        undefined,
        error.request
      ))
    }
    return Promise.reject(new OKXError(
      error.message || 'Unknown error',
      undefined,
      error
    ))
  }
)

// ==================== 市场数据接口 ====================

/**
 * 将内部时间周期映射到 OKX API 格式
 * OKX 支持的时间粒度：1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 12H, 1D, 1W, 1M, 3M, 6M, 1Y
 */
function mapIntervalToOKX(interval: KlineInterval): string {
  const mapping: Record<KlineInterval, string> = {
    '1min': '1m',
    '5min': '5m',
    '1h': '1H',
    '4h': '4H',
    '1d': '1D',
    '3d': '3D',
    '1w': '1W',
  }
  return mapping[interval] || '1H'
}

/**
 * 将交易对符号转换为 OKX 格式
 * OKX 使用格式：BTC-USDT, ETH-USDT 等
 * 如果已经是 OKX 格式，直接返回；否则尝试转换为 OKX 格式
 */
function normalizeSymbol(symbol: string): string {
  // 如果已经包含 -，可能是 OKX 格式
  if (symbol.includes('-')) {
    return symbol
  }
  // 假设默认是 USDT 交易对
  return `${symbol}-USDT`
}

/**
 * 获取 K线数据
 * @param symbol 交易对（如 BTC 或 BTC-USDT）
 * @param interval 时间周期
 * @param limit 返回数量限制（可选，默认 100，最大 100）
 * @param after 在此时间戳之后的数据（可选，毫秒时间戳）
 * @param before 在此时间戳之前的数据（可选，毫秒时间戳）
 */
export async function getKlines(
  symbol: string,
  interval: KlineInterval,
  limit: number = 100,
  after?: number,
  before?: number
): Promise<Array<{
  time: number // 秒级时间戳
  open: string
  high: string
  low: string
  close: string
  volume: string
}>> {
  try {
    const instId = normalizeSymbol(symbol)
    const bar = mapIntervalToOKX(interval)
    
    const params: Record<string, string> = {
      instId,
      bar,
      limit: Math.min(limit, 100).toString(), // OKX 最大限制为 100
    }

    // 添加可选的时间参数
    if (after) {
      params.after = after.toString()
    }
    if (before) {
      params.before = before.toString()
    }

    // OKX API: GET /api/v5/market/candles
    const response = await okxApi.get('/api/v5/market/candles', { params })
    const data = response.data

    // OKX 返回格式：{ code: "0", msg: "", data: [[ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm], ...] }
    if (data.code !== '0') {
      throw new OKXError(data.msg || 'Failed to fetch klines from OKX', undefined, data)
    }

    if (!Array.isArray(data.data)) {
      return []
    }

    // 转换数据格式
    // OKX 返回格式：[ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
    // ts: 开始时间（毫秒时间戳）
    // o: 开盘价
    // h: 最高价
    // l: 最低价
    // c: 收盘价
    // vol: 交易量（以交易货币为单位）
    // volCcy: 交易量（以计价货币为单位）
    // volCcyQuote: 交易量（以报价货币为单位）
    // confirm: K线状态（0: 未完结, 1: 已完结）
    // 注意：OKX 返回的数据是倒序的（最新的在前面），需要转换后反转
    const converted = data.data.map((item: any[]) => {
      const [ts, o, h, l, c, vol] = item
      // 将毫秒时间戳转换为秒级时间戳
      const timeSeconds = Math.floor(parseInt(ts, 10) / 1000)
      
      return {
        time: timeSeconds,
        open: String(o || 0),
        high: String(h || 0),
        low: String(l || 0),
        close: String(c || 0),
        volume: String(vol || 0),
      }
    })
    
    // 反转数组，使其按时间正序（从旧到新）
    return converted.reverse()
  } catch (error) {
    if (error instanceof OKXError) {
      throw error
    }
    throw new OKXError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      error
    )
  }
}

/**
 * 获取交易对列表
 */
export async function getSymbols(): Promise<Array<{
  name: string
  baseCurrency?: string
  quoteCurrency?: string
}>> {
  try {
    // OKX API: GET /api/v5/public/instruments?instType=SPOT
    const response = await okxApi.get('/api/v5/public/instruments', {
      params: {
        instType: 'SPOT',
      },
    })
    const data = response.data

    if (data.code !== '0') {
      throw new OKXError(data.msg || 'Failed to fetch symbols from OKX', undefined, data)
    }

    if (!Array.isArray(data.data)) {
      return []
    }

    // 转换数据格式
    return data.data.map((item: any) => ({
      name: item.instId || item.symbol || '',
      baseCurrency: item.baseCcy,
      quoteCurrency: item.quoteCcy,
    }))
  } catch (error) {
    if (error instanceof OKXError) {
      throw error
    }
    throw new OKXError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      error
    )
  }
}

/**
 * 获取最新价格（Ticker）
 */
export async function getTicker(symbol?: string): Promise<Array<{
  symbol: string
  lastPrice: string
  high24h: string
  low24h: string
  volume24h: string
}>> {
  try {
    const params: Record<string, string> = {}
    if (symbol) {
      params.instId = normalizeSymbol(symbol)
    }

    // OKX API: GET /api/v5/market/ticker
    const response = await okxApi.get('/api/v5/market/ticker', { params })
    const data = response.data

    if (data.code !== '0') {
      throw new OKXError(data.msg || 'Failed to fetch ticker from OKX', undefined, data)
    }

    if (!Array.isArray(data.data)) {
      return []
    }

    // 转换数据格式
    return data.data.map((item: any) => ({
      symbol: item.instId || '',
      lastPrice: item.last || '0',
      high24h: item.high24h || '0',
      low24h: item.low24h || '0',
      volume24h: item.vol24h || '0',
    }))
  } catch (error) {
    if (error instanceof OKXError) {
      throw error
    }
    throw new OKXError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      error
    )
  }
}

// 导出 OKX 服务实例
export const okx = {
  getKlines,
  getSymbols,
  getTicker,
}

