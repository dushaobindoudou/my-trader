/**
 * CoinGecko API 服务封装
 * 
 * 使用 undici 库支持 HTTP 代理
 * 
 * 免费账户：每月 10,000 次请求，每分钟 30 次
 * 文档：https://docs.coingecko.com/
 * 
 * 认证方式：
 * - Demo API Key: Header x-cg-demo-api-key
 * - Pro API Key: Header x-cg-pro-api-key (使用 pro-api.coingecko.com)
 * 
 * 环境变量：
 * - COINGECKO_API_KEY: Demo API Key
 * - COINGECKO_PRO_API_KEY: Pro API Key (优先级更高)
 * - HTTPS_PROXY / HTTP_PROXY: 代理服务器地址
 */

import { ProxyAgent, fetch as undiciFetch } from 'undici'

// ============================================================================
// 配置
// ============================================================================

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'
const COINGECKO_PRO_API_BASE = 'https://pro-api.coingecko.com/api/v3'
const REQUEST_TIMEOUT = 30000 // 30 秒超时

// 获取代理 URL
function getProxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy
  )
}

// 创建代理 Agent（如果配置了代理）
function createProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = getProxyUrl()
  if (proxyUrl) {
    console.log('[CoinGecko] 使用代理:', proxyUrl)
    return new ProxyAgent(proxyUrl)
  }
  return undefined
}

// ============================================================================
// 类型定义
// ============================================================================

export class CoinGeckoError extends Error {
  constructor(
    message: string,
    public code?: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'CoinGeckoError'
  }
}

/** 市场数据 */
export interface CoinGeckoMarketData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number | null
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  roi: {
    times: number
    currency: string
    percentage: number
  } | null
  last_updated: string
}

/** 全局市场数据 */
export interface CoinGeckoGlobalData {
  active_cryptocurrencies: number
  upcoming_icos: number
  ongoing_icos: number
  ended_icos: number
  markets: number
  total_market_cap: Record<string, number>
  total_volume: Record<string, number>
  market_cap_percentage: Record<string, number>
  market_cap_change_percentage_24h_usd: number
  updated_at: number
}

/** DeFi 全局数据 */
export interface CoinGeckoDefiData {
  defi_market_cap: string
  eth_market_cap: string
  defi_to_eth_ratio: string
  trading_volume_24h: string
  defi_dominance: string
  top_coin_name: string
  top_coin_defi_dominance: number
}

// ============================================================================
// API 配置
// ============================================================================

interface ApiConfig {
  baseUrl: string
  apiKey?: string
  headerName?: string
}

function getApiConfig(): ApiConfig {
  const proApiKey = process.env.COINGECKO_PRO_API_KEY
  const demoApiKey = process.env.COINGECKO_API_KEY || process.env.CG_DEMO_API_KEY

  if (proApiKey) {
    return {
      baseUrl: COINGECKO_PRO_API_BASE,
      apiKey: proApiKey,
      headerName: 'x-cg-pro-api-key',
    }
  }

  if (demoApiKey) {
    return {
      baseUrl: COINGECKO_API_BASE,
      apiKey: demoApiKey,
      headerName: 'x-cg-demo-api-key',
    }
  }

  return { baseUrl: COINGECKO_API_BASE }
}

// ============================================================================
// HTTP 请求封装
// ============================================================================

// 缓存代理 Agent
let proxyAgent: ProxyAgent | undefined

/**
 * 获取代理 Agent（懒加载，单例模式）
 */
function getProxyAgent(): ProxyAgent | undefined {
  if (proxyAgent === undefined) {
    proxyAgent = createProxyAgent()
  }
  return proxyAgent
}

/**
 * 发送 API 请求
 * 使用 undici fetch 支持代理
 */
async function request<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const config = getApiConfig()
  const agent = getProxyAgent()

  // 构建 URL
  const url = new URL(`${config.baseUrl}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

  // 构建请求头
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }

  if (config.apiKey && config.headerName) {
    headers[config.headerName] = config.apiKey
  }

  console.log('[CoinGecko] 发送请求:', {
    url: url.toString(),
    hasApiKey: !!config.apiKey,
    hasProxy: !!agent,
  })

  // 创建 AbortController 用于超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    // 使用 undici fetch（支持代理）
    const response = await undiciFetch(url.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
      // 如果有代理，使用代理 Agent
      ...(agent ? { dispatcher: agent } : {}),
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CoinGecko] 请求失败:', {
        url: endpoint,
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new CoinGeckoError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorText
      )
    }

    const data = await response.json()
    console.log('[CoinGecko] 请求成功:', {
      url: endpoint,
      status: response.status,
    })

    return data as T
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof CoinGeckoError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[CoinGecko] 请求超时:', { url: endpoint })
        throw new CoinGeckoError('请求超时，请检查网络连接')
      }
      console.error('[CoinGecko] 请求异常:', {
        url: endpoint,
        error: error.message,
      })
      throw new CoinGeckoError(error.message)
    }

    throw new CoinGeckoError('未知错误')
  }
}

// ============================================================================
// API 方法
// ============================================================================

/**
 * 获取加密货币列表（按市值排序）
 */
export async function getCoinsMarkets(
  page: number = 1,
  perPage: number = 100,
  vsCurrency: string = 'usd',
  order: string = 'market_cap_desc'
): Promise<CoinGeckoMarketData[]> {
  try {
    const data = await request<CoinGeckoMarketData[]>('/coins/markets', {
      vs_currency: vsCurrency,
      order,
      per_page: perPage,
      page,
      sparkline: false,
      price_change_percentage: '24h',
    })
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('[CoinGecko] 获取市场数据失败:', error)
    throw error
  }
}

/**
 * 根据币种 ID 获取详细信息
 */
export async function getCoinsByIds(
  ids: string[],
  vsCurrency: string = 'usd'
): Promise<CoinGeckoMarketData[]> {
  try {
    const data = await request<CoinGeckoMarketData[]>('/coins/markets', {
      vs_currency: vsCurrency,
      ids: ids.join(','),
      order: 'market_cap_desc',
      sparkline: false,
      price_change_percentage: '24h',
    })
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('[CoinGecko] 获取币种数据失败:', error)
    throw error
  }
}

/**
 * 获取支持的币种列表
 */
export async function getSupportedCoins(): Promise<Array<{
  id: string
  symbol: string
  name: string
}>> {
  try {
    const data = await request<Array<{ id: string; symbol: string; name: string }>>(
      '/coins/list',
      { include_platform: false }
    )
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('[CoinGecko] 获取币种列表失败:', error)
    throw error
  }
}

/**
 * 获取全球市场概览数据
 */
export async function getGlobalData(): Promise<CoinGeckoGlobalData | null> {
  const endpoint = '/global'
  console.log(`[CoinGecko] 请求全球市场数据: ${endpoint}`)

  try {
    const response = await request<{ data: CoinGeckoGlobalData }>(endpoint)
    const data = response?.data

    if (data) {
      console.log('[CoinGecko] 全球市场数据获取成功', {
        activeCryptocurrencies: data.active_cryptocurrencies,
        markets: data.markets,
        totalMarketCapUsd: data.total_market_cap?.usd,
        btcDominance: data.market_cap_percentage?.btc,
      })
    }

    return data ?? null
  } catch (error) {
    console.error('[CoinGecko] 全球市场数据获取失败:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    // 不抛出错误，返回 null
    return null
  }
}

/**
 * 获取 DeFi 全球数据
 */
export async function getDefiGlobalData(): Promise<CoinGeckoDefiData | null> {
  const endpoint = '/global/decentralized_finance_defi'
  console.log(`[CoinGecko] 请求 DeFi 全球数据: ${endpoint}`)

  try {
    const response = await request<{ data: CoinGeckoDefiData }>(endpoint)
    const data = response?.data

    if (data) {
      console.log('[CoinGecko] DeFi 全球数据获取成功', {
        defiMarketCap: data.defi_market_cap,
        defiDominance: data.defi_dominance,
        topCoinName: data.top_coin_name,
      })
    }

    return data ?? null
  } catch (error) {
    console.error('[CoinGecko] DeFi 全球数据获取失败:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

/**
 * 获取热门搜索币种
 */
export async function getTrendingCoins(): Promise<Array<{
  id: string
  coin_id: number
  name: string
  symbol: string
  market_cap_rank: number
  thumb: string
  small: string
  large: string
  slug: string
  price_btc: number
  score: number
}>> {
  const endpoint = '/search/trending'
  console.log(`[CoinGecko] 请求热门搜索币种: ${endpoint}`)

  try {
    const response = await request<{
      coins: Array<{
        item: {
          id: string
          coin_id: number
          name: string
          symbol: string
          market_cap_rank: number
          thumb: string
          small: string
          large: string
          slug: string
          price_btc: number
          score: number
        }
      }>
    }>(endpoint)

    const coins = response?.coins?.map((c) => c.item) ?? []
    console.log('[CoinGecko] 热门搜索币种获取成功', {
      count: coins.length,
      topCoins: coins.slice(0, 3).map((c) => c.symbol),
    })

    return coins
  } catch (error) {
    console.error('[CoinGecko] 热门搜索币种获取失败:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return []
  }
}

/**
 * 获取交易所列表
 */
export async function getExchanges(perPage: number = 10): Promise<Array<{
  id: string
  name: string
  year_established: number | null
  country: string | null
  trust_score: number
  trust_score_rank: number
  trade_volume_24h_btc: number
  trade_volume_24h_btc_normalized: number
}>> {
  const endpoint = '/exchanges'
  console.log(`[CoinGecko] 请求交易所列表: ${endpoint}`, { perPage })

  try {
    const exchanges = await request<Array<{
      id: string
      name: string
      year_established: number | null
      country: string | null
      trust_score: number
      trust_score_rank: number
      trade_volume_24h_btc: number
      trade_volume_24h_btc_normalized: number
    }>>(endpoint, { per_page: perPage })

    console.log('[CoinGecko] 交易所列表获取成功', {
      count: exchanges?.length ?? 0,
    })

    return exchanges ?? []
  } catch (error) {
    console.error('[CoinGecko] 交易所列表获取失败:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return []
  }
}

/**
 * 简单价格查询（根据符号）
 */
export async function getCoinsBySymbols(
  symbols: string[],
  vsCurrency: string = 'usd'
): Promise<CoinGeckoMarketData[]> {
  try {
    const response = await request<Record<string, Record<string, number>>>(
      '/simple/price',
      {
        ids: symbols.join(','),
        vs_currencies: vsCurrency,
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true,
        include_last_updated_at: true,
      }
    )

    return Object.entries(response).map(([id, data]) => ({
      id,
      symbol: id,
      name: id,
      image: '',
      current_price: data[vsCurrency],
      market_cap: data[`${vsCurrency}_market_cap`] || 0,
      market_cap_rank: 0,
      fully_diluted_valuation: null,
      total_volume: data[`${vsCurrency}_24h_vol`] || 0,
      high_24h: 0,
      low_24h: 0,
      price_change_24h: data[`${vsCurrency}_24h_change`] || 0,
      price_change_percentage_24h: data[`${vsCurrency}_24h_change`] || 0,
      market_cap_change_24h: 0,
      market_cap_change_percentage_24h: 0,
      circulating_supply: 0,
      total_supply: null,
      max_supply: null,
      ath: 0,
      ath_change_percentage: 0,
      ath_date: '',
      atl: 0,
      atl_change_percentage: 0,
      atl_date: '',
      roi: null,
      last_updated: new Date((data.last_updated_at as number) * 1000).toISOString(),
    }))
  } catch (error) {
    console.error('[CoinGecko] 获取价格数据失败:', error)
    throw error
  }
}

// ============================================================================
// 导出
// ============================================================================

export const coingecko = {
  getCoinsMarkets,
  getCoinsByIds,
  getCoinsBySymbols,
  getSupportedCoins,
  getGlobalData,
  getDefiGlobalData,
  getTrendingCoins,
  getExchanges,
}
