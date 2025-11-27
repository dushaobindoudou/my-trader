/**
 * CoinMarketCap API 服务封装
 * 
 * 使用 undici 库支持 HTTP 代理
 * 
 * 免费账户：每月 10,000 次请求，每分钟 30 次
 * 文档：https://coinmarketcap.com/api/documentation/v1/
 * v3 文档：https://coinmarketcap.com/api/documentation/v3/
 * 
 * 环境变量：
 * - CMC_API_KEY: API Key
 * - HTTPS_PROXY / HTTP_PROXY: 代理服务器地址
 */

import { ProxyAgent, fetch as undiciFetch } from 'undici'

// ============================================================================
// 配置
// ============================================================================

const COINMARKETCAP_API_BASE_V1 = 'https://pro-api.coinmarketcap.com/v1'
const COINMARKETCAP_API_BASE_V3 = 'https://pro-api.coinmarketcap.com/v3'
const REQUEST_TIMEOUT = 30000

// 获取代理 URL
function getProxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy
  )
}

// 创建代理 Agent
let proxyAgent: ProxyAgent | undefined

function getProxyAgent(): ProxyAgent | undefined {
  if (proxyAgent === undefined) {
    const proxyUrl = getProxyUrl()
    if (proxyUrl) {
      console.log('[CoinMarketCap] 使用代理:', proxyUrl)
      proxyAgent = new ProxyAgent(proxyUrl)
    }
  }
  return proxyAgent
}

// 获取 API Key
function getApiKey(): string {
  const apiKey = process.env.CMC_API_KEY || process.env.COINMARKETCAP_API_KEY
  if (!apiKey) {
    throw new CoinMarketCapError(
      'CMC_API_KEY or COINMARKETCAP_API_KEY is not set in environment variables'
    )
  }
  return apiKey
}

// ============================================================================
// 错误类型
// ============================================================================

export class CoinMarketCapError extends Error {
  constructor(
    message: string,
    public code?: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'CoinMarketCapError'
  }
}

// ============================================================================
// 类型定义
// ============================================================================

export interface CoinMarketCapMarketData {
  id: number
  name: string
  symbol: string
  slug: string
  cmc_rank: number
  num_market_pairs: number
  circulating_supply: number
  total_supply: number
  max_supply: number | null
  last_updated: string
  quote: {
    USD: {
      price: number
      volume_24h: number
      percent_change_24h: number
      market_cap: number
      market_cap_dominance: number
      last_updated: string
    }
  }
}

/** 恐惧与贪婪指数数据项 */
export interface FearGreedIndexItem {
  value: number
  value_classification: string
  timestamp: string // 历史数据使用 Unix 时间戳字符串
  update_time?: string // 最新数据使用 ISO 时间字符串
}

export interface GlobalMetricsData {
  active_cryptocurrencies: number
  total_cryptocurrencies: number
  active_market_pairs: number
  active_exchanges: number
  total_exchanges: number
  eth_dominance: number
  btc_dominance: number
  defi_volume_24h: number
  defi_market_cap: number
  stablecoin_volume_24h: number
  stablecoin_market_cap: number
  derivatives_volume_24h: number
  quote: {
    USD: {
      total_market_cap: number
      total_volume_24h: number
      total_market_cap_yesterday: number
      last_updated: string
    }
  }
}

// ============================================================================
// HTTP 请求封装
// ============================================================================

interface ApiResponse<T> {
  status: {
    timestamp: string
    error_code: number
    error_message: string | null
  }
  data: T
}

async function request<T>(
  baseUrl: string,
  endpoint: string,
  params?: Record<string, string | number>
): Promise<T> {
  const agent = getProxyAgent()

  // 构建 URL
  const url = new URL(`${baseUrl}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

  // 构建请求头
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-CMC_PRO_API_KEY': getApiKey(),
  }

  console.log('[CoinMarketCap] 发送请求:', {
    url: url.toString().replace(getApiKey(), '***'),
    hasProxy: !!agent,
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await undiciFetch(url.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
      ...(agent ? { dispatcher: agent } : {}),
    })

    clearTimeout(timeoutId)

    const data = (await response.json()) as ApiResponse<T>

    // 注意：CoinMarketCap API 的 error_code 可能是字符串 "0" 或数字 0
    // 使用 Number() 转换后比较，或者检查是否为 falsy 值
    const errorCode = Number(data.status?.error_code)
    const hasError = !response.ok || (errorCode !== 0 && !isNaN(errorCode))

    if (hasError) {
      console.error('[CoinMarketCap] 请求失败:', {
        url: endpoint,
        status: response.status,
        errorCode: data.status?.error_code,
        error: data.status?.error_message,
      })
      throw new CoinMarketCapError(
        data.status?.error_message || `HTTP ${response.status}`,
        errorCode || response.status,
        data
      )
    }

    console.log('[CoinMarketCap] 请求成功:', {
      url: endpoint,
      status: response.status,
    })

    return data.data
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof CoinMarketCapError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new CoinMarketCapError('请求超时')
      }
      console.error('[CoinMarketCap] 请求异常:', {
        url: endpoint,
        error: error.message,
      })
      throw new CoinMarketCapError(error.message)
    }

    throw new CoinMarketCapError('未知错误')
  }
}

// ============================================================================
// API 方法
// ============================================================================

/**
 * 获取 Fear and Greed Index 最新数据
 */
export async function getFearAndGreedIndexLatest(): Promise<FearGreedIndexItem | null> {
  console.log('[CoinMarketCap] 获取 Fear and Greed Index 最新数据')

  try {
    const data = await request<FearGreedIndexItem & { update_time?: string }>(
      COINMARKETCAP_API_BASE_V3,
      '/fear-and-greed/latest'
    )

    if (!data) return null

    // 标准化时间戳字段（最新数据使用 update_time，转换为 timestamp）
    const result: FearGreedIndexItem = {
      value: data.value,
      value_classification: data.value_classification,
      timestamp: data.update_time || data.timestamp || new Date().toISOString(),
    }

    console.log('[CoinMarketCap] Fear and Greed Index 最新数据:', {
      value: result.value,
      classification: result.value_classification,
      timestamp: result.timestamp,
    })

    return result
  } catch (error) {
    console.error('[CoinMarketCap] Fear and Greed Index 最新数据获取失败:', error)
    return null
  }
}

/**
 * 获取 Fear and Greed Index 历史数据
 * @param limit 返回数量，默认 30，范围 1-500
 */
export async function getFearAndGreedIndex(
  limit: number = 30
): Promise<FearGreedIndexItem[]> {
  console.log('[CoinMarketCap] 获取 Fear and Greed Index 历史数据', { limit })

  // 参数验证
  const validLimit = Math.min(Math.max(limit, 1), 500)

  try {
    const data = await request<FearGreedIndexItem[]>(
      COINMARKETCAP_API_BASE_V3,
      '/fear-and-greed/historical',
      { limit: validLimit }
    )

    if (!Array.isArray(data)) return []

    // 转换 Unix 时间戳为 ISO 格式
    const result = data.map(item => ({
      value: item.value,
      value_classification: item.value_classification,
      // 历史数据的 timestamp 是 Unix 时间戳（秒），需要转换
      timestamp: isNaN(Number(item.timestamp))
        ? item.timestamp
        : new Date(Number(item.timestamp) * 1000).toISOString(),
    }))

    console.log('[CoinMarketCap] Fear and Greed Index 历史数据:', {
      count: result.length,
    })

    return result
  } catch (error) {
    console.error('[CoinMarketCap] Fear and Greed Index 历史数据获取失败:', error)
    return []
  }
}

/**
 * 获取全球市场指标数据
 */
export async function getGlobalMetrics(): Promise<GlobalMetricsData | null> {
  console.log('[CoinMarketCap] 获取全球市场指标')

  try {
    const data = await request<GlobalMetricsData>(
      COINMARKETCAP_API_BASE_V1,
      '/global-metrics/quotes/latest',
      { convert: 'USD' }
    )

    console.log('[CoinMarketCap] 全球市场指标:', {
      totalMarketCap: data?.quote?.USD?.total_market_cap,
      btcDominance: data?.btc_dominance,
    })

    return data || null
  } catch (error) {
    console.error('[CoinMarketCap] 全球市场指标获取失败:', error)
    return null
  }
}

/**
 * 获取加密货币列表
 */
export async function getCryptocurrencyListingsLatest(
  limit: number = 100
): Promise<CoinMarketCapMarketData[]> {
  console.log('[CoinMarketCap] 获取加密货币列表', { limit })

  try {
    const data = await request<CoinMarketCapMarketData[]>(
      COINMARKETCAP_API_BASE_V1,
      '/cryptocurrency/listings/latest',
      { limit, convert: 'USD' }
    )

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('[CoinMarketCap] 加密货币列表获取失败:', error)
    return []
  }
}

// ============================================================================
// 导出
// ============================================================================

export const coinmarketcap = {
  getFearAndGreedIndexLatest,
  getFearAndGreedIndex,
  getGlobalMetrics,
  getCryptocurrencyListingsLatest,
}
