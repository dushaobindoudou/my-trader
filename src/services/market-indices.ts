/**
 * 市场指数服务
 * 
 * 功能：
 * - 获取全球市场数据（总市值、交易量、主导地位等）
 * - 获取 DeFi 数据
 * - 获取恐惧与贪婪指数
 * - 获取市场活跃度数据
 * - 数据库缓存支持（减少 API 调用）
 * 
 * 数据源优先级：
 * 1. 数据库缓存（5分钟有效期）
 * 2. CoinGecko API（主要数据源 - 市场数据）
 * 3. CoinMarketCap API（恐惧与贪婪指数）
 */

import { createAdminClient } from '@/lib/supabase/admin'
import {
  coingecko,
  type CoinGeckoGlobalData,
  type CoinGeckoDefiData,
} from './coingecko'
import {
  coinmarketcap,
  type FearGreedIndexItem,
} from './coinmarketcap'

// ============================================================================
// 类型定义
// ============================================================================

export class MarketIndicesError extends Error {
  constructor(
    message: string,
    public code?: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'MarketIndicesError'
  }
}

/** 市场总览数据 */
export interface MarketOverview {
  total_market_cap: { usd: number }
  total_volume: { usd: number }
  market_cap_percentage: { [key: string]: number }
  market_cap_change_percentage_24h_usd: number
}

/** 市场趋势数据 */
export interface MarketTrends {
  btc_dominance: number
  eth_dominance: number
  altcoin_market_cap: number
  stablecoin_market_cap?: number
  defi_market_cap?: number
  defi_dominance?: number
}

/** 市场活跃度数据 */
export interface MarketActivity {
  active_cryptocurrencies: number
  markets: number
  upcoming_icos?: number
  ongoing_icos?: number
  ended_icos?: number
}

/** DeFi 数据 */
export interface DefiData {
  market_cap: number
  volume_24h: number
  dominance: number
  top_coin_name: string
  top_coin_dominance: number
  eth_ratio: number
}

/** 热门币种 */
export interface TrendingCoin {
  id: string
  name: string
  symbol: string
  market_cap_rank: number
  price_btc: number
  score: number
  thumb: string
}

/** 恐惧与贪婪指数 */
export interface FearGreedIndex {
  value: number
  value_classification: string
  timestamp: number | string
}

/** 市场指数汇总数据 */
export interface MarketIndicesSummary {
  marketOverview: MarketOverview | null
  marketTrends: MarketTrends | null
  marketActivity: MarketActivity | null
  defiData: DefiData | null
  trendingCoins: TrendingCoin[]
  fearGreedIndex: {
    current: FearGreedIndex | null
    history: FearGreedIndex[]
  }
  dataSource: 'cache' | 'coingecko' | 'coinmarketcap'
  cacheAge?: number // 缓存年龄（秒）
  timestamp: string
}

/** 数据库快照记录 */
interface MarketSnapshot {
  id: string
  total_market_cap_usd: number | null
  total_volume_24h_usd: number | null
  market_cap_change_24h_percent: number | null
  btc_dominance: number | null
  eth_dominance: number | null
  active_cryptocurrencies: number | null
  active_exchanges: number | null
  active_market_pairs: number | null
  upcoming_icos: number | null
  ongoing_icos: number | null
  ended_icos: number | null
  defi_market_cap_usd: number | null
  defi_volume_24h_usd: number | null
  defi_dominance: number | null
  top_defi_coin_name: string | null
  top_defi_coin_dominance: number | null
  fear_greed_value: number | null
  fear_greed_classification: string | null
  source: string
  raw_data: unknown
  created_at: string
}

// ============================================================================
// 缓存配置
// ============================================================================

const CACHE_DURATION_MINUTES = 5 // 缓存有效期（分钟）

// ============================================================================
// 工具函数
// ============================================================================

/** 解析数字字符串（CoinGecko 返回的某些数据是字符串格式） */
function parseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  const parsed = parseFloat(value.replace(/,/g, ''))
  return isNaN(parsed) ? 0 : parsed
}

/** 计算缓存年龄（秒） */
function getCacheAge(createdAt: string): number {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  return Math.floor((now - created) / 1000)
}

/** 检查缓存是否有效 */
function isCacheValid(createdAt: string): boolean {
  const ageSeconds = getCacheAge(createdAt)
  return ageSeconds < CACHE_DURATION_MINUTES * 60
}

// ============================================================================
// 数据库操作
// ============================================================================

/** 从数据库获取最新缓存 */
async function getCachedSnapshot(): Promise<MarketSnapshot | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('market_indices_snapshot')
      .select('*')
      .eq('source', 'coingecko')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.log('[MarketIndices] 无缓存数据或查询失败')
      return null
    }

    if (!isCacheValid(data.created_at)) {
      console.log('[MarketIndices] 缓存已过期', {
        ageSeconds: getCacheAge(data.created_at),
        maxAgeSeconds: CACHE_DURATION_MINUTES * 60,
      })
      return null
    }

    console.log('[MarketIndices] 使用缓存数据', {
      ageSeconds: getCacheAge(data.created_at),
    })
    return data as MarketSnapshot
  } catch (error) {
    console.error('[MarketIndices] 获取缓存失败:', error)
    return null
  }
}

/** 保存数据到数据库 */
async function saveSnapshot(
  globalData: CoinGeckoGlobalData | null,
  defiData: CoinGeckoDefiData | null,
  fearGreedData?: FearGreedIndex | null
): Promise<void> {
  if (!globalData) return

  try {
    const supabase = createAdminClient()
    
    const snapshot = {
      total_market_cap_usd: globalData.total_market_cap?.usd ?? null,
      total_volume_24h_usd: globalData.total_volume?.usd ?? null,
      market_cap_change_24h_percent: globalData.market_cap_change_percentage_24h_usd ?? null,
      btc_dominance: globalData.market_cap_percentage?.btc ?? null,
      eth_dominance: globalData.market_cap_percentage?.eth ?? null,
      active_cryptocurrencies: globalData.active_cryptocurrencies ?? null,
      active_exchanges: null, // CoinGecko global 不直接提供
      active_market_pairs: globalData.markets ?? null,
      upcoming_icos: globalData.upcoming_icos ?? null,
      ongoing_icos: globalData.ongoing_icos ?? null,
      ended_icos: globalData.ended_icos ?? null,
      defi_market_cap_usd: defiData ? parseNumber(defiData.defi_market_cap) : null,
      defi_volume_24h_usd: defiData ? parseNumber(defiData.trading_volume_24h) : null,
      defi_dominance: defiData ? parseNumber(defiData.defi_dominance) : null,
      top_defi_coin_name: defiData?.top_coin_name ?? null,
      top_defi_coin_dominance: defiData?.top_coin_defi_dominance ?? null,
      // 恐惧与贪婪指数
      fear_greed_value: fearGreedData?.value ?? null,
      fear_greed_classification: fearGreedData?.value_classification ?? null,
      source: 'coingecko',
      raw_data: { global: globalData, defi: defiData, fearGreed: fearGreedData },
    }

    const { error } = await supabase
      .from('market_indices_snapshot')
      .insert(snapshot)

    if (error) {
      console.error('[MarketIndices] 保存快照失败:', error)
    } else {
      console.log('[MarketIndices] 快照保存成功')
    }
  } catch (error) {
    console.error('[MarketIndices] 保存快照异常:', error)
  }
}

// ============================================================================
// 数据转换函数
// ============================================================================

/** 从缓存构建市场总览 */
function buildOverviewFromCache(cache: MarketSnapshot): MarketOverview {
  return {
    total_market_cap: { usd: cache.total_market_cap_usd ?? 0 },
    total_volume: { usd: cache.total_volume_24h_usd ?? 0 },
    market_cap_percentage: {
      btc: cache.btc_dominance ?? 0,
      eth: cache.eth_dominance ?? 0,
    },
    market_cap_change_percentage_24h_usd: cache.market_cap_change_24h_percent ?? 0,
  }
}

/** 从 CoinGecko 数据构建市场总览 */
function buildOverviewFromCoinGecko(data: CoinGeckoGlobalData): MarketOverview {
  return {
    total_market_cap: { usd: data.total_market_cap?.usd ?? 0 },
    total_volume: { usd: data.total_volume?.usd ?? 0 },
    market_cap_percentage: data.market_cap_percentage ?? {},
    market_cap_change_percentage_24h_usd: data.market_cap_change_percentage_24h_usd ?? 0,
  }
}

/** 从缓存构建市场趋势 */
function buildTrendsFromCache(cache: MarketSnapshot): MarketTrends {
  const btcDominance = cache.btc_dominance ?? 0
  const ethDominance = cache.eth_dominance ?? 0
  const totalMarketCap = cache.total_market_cap_usd ?? 0
  const btcMarketCap = (totalMarketCap * btcDominance) / 100
  const ethMarketCap = (totalMarketCap * ethDominance) / 100

  return {
    btc_dominance: btcDominance,
    eth_dominance: ethDominance,
    altcoin_market_cap: totalMarketCap - btcMarketCap - ethMarketCap,
    defi_market_cap: cache.defi_market_cap_usd ?? undefined,
    defi_dominance: cache.defi_dominance ?? undefined,
  }
}

/** 从 CoinGecko 数据构建市场趋势 */
function buildTrendsFromCoinGecko(
  globalData: CoinGeckoGlobalData,
  defiData: CoinGeckoDefiData | null
): MarketTrends {
  const btcDominance = globalData.market_cap_percentage?.btc ?? 0
  const ethDominance = globalData.market_cap_percentage?.eth ?? 0
  const totalMarketCap = globalData.total_market_cap?.usd ?? 0
  const btcMarketCap = (totalMarketCap * btcDominance) / 100
  const ethMarketCap = (totalMarketCap * ethDominance) / 100

  return {
    btc_dominance: btcDominance,
    eth_dominance: ethDominance,
    altcoin_market_cap: totalMarketCap - btcMarketCap - ethMarketCap,
    defi_market_cap: defiData ? parseNumber(defiData.defi_market_cap) : undefined,
    defi_dominance: defiData ? parseNumber(defiData.defi_dominance) : undefined,
  }
}

/** 从缓存构建市场活跃度 */
function buildActivityFromCache(cache: MarketSnapshot): MarketActivity {
  return {
    active_cryptocurrencies: cache.active_cryptocurrencies ?? 0,
    markets: cache.active_market_pairs ?? 0,
    upcoming_icos: cache.upcoming_icos ?? undefined,
    ongoing_icos: cache.ongoing_icos ?? undefined,
    ended_icos: cache.ended_icos ?? undefined,
  }
}

/** 从 CoinGecko 数据构建市场活跃度 */
function buildActivityFromCoinGecko(data: CoinGeckoGlobalData): MarketActivity {
  return {
    active_cryptocurrencies: data.active_cryptocurrencies,
    markets: data.markets,
    upcoming_icos: data.upcoming_icos,
    ongoing_icos: data.ongoing_icos,
    ended_icos: data.ended_icos,
  }
}

/** 从缓存构建 DeFi 数据 */
function buildDefiFromCache(cache: MarketSnapshot): DefiData | null {
  if (!cache.defi_market_cap_usd) return null

  return {
    market_cap: cache.defi_market_cap_usd,
    volume_24h: cache.defi_volume_24h_usd ?? 0,
    dominance: cache.defi_dominance ?? 0,
    top_coin_name: cache.top_defi_coin_name ?? 'Unknown',
    top_coin_dominance: cache.top_defi_coin_dominance ?? 0,
    eth_ratio: 0, // 缓存中没有这个数据
  }
}

/** 从 CoinGecko 数据构建 DeFi 数据 */
function buildDefiFromCoinGecko(data: CoinGeckoDefiData): DefiData {
  return {
    market_cap: parseNumber(data.defi_market_cap),
    volume_24h: parseNumber(data.trading_volume_24h),
    dominance: parseNumber(data.defi_dominance),
    top_coin_name: data.top_coin_name,
    top_coin_dominance: data.top_coin_defi_dominance,
    eth_ratio: parseNumber(data.defi_to_eth_ratio),
  }
}

// ============================================================================
// 主要 API 函数
// ============================================================================

/**
 * 获取市场指数汇总数据
 * 
 * 数据获取流程：
 * 1. 检查数据库缓存（5分钟有效期）
 * 2. 缓存有效则直接返回
 * 3. 缓存无效则调用 CoinGecko API
 * 4. 保存新数据到数据库
 */
export async function getMarketIndicesSummary(): Promise<MarketIndicesSummary> {
  console.log('[MarketIndices] ====== 开始获取市场指数数据 ======')
  
  // 1. 尝试获取缓存
  const cached = await getCachedSnapshot()
  
  if (cached) {
    console.log('[MarketIndices] 返回缓存数据')
    return {
      marketOverview: buildOverviewFromCache(cached),
      marketTrends: buildTrendsFromCache(cached),
      marketActivity: buildActivityFromCache(cached),
      defiData: buildDefiFromCache(cached),
      trendingCoins: [], // 缓存不包含热门币种
      fearGreedIndex: {
        current: cached.fear_greed_value ? {
          value: cached.fear_greed_value,
          value_classification: cached.fear_greed_classification ?? 'Unknown',
          timestamp: cached.created_at,
        } : null,
        history: [],
      },
      dataSource: 'cache',
      cacheAge: getCacheAge(cached.created_at),
      timestamp: cached.created_at,
    }
  }

  // 2. 从 API 获取数据
  console.log('[MarketIndices] 缓存无效，从 API 获取数据')
  
  let globalData: CoinGeckoGlobalData | null = null
  let defiData: CoinGeckoDefiData | null = null
  let trendingCoins: TrendingCoin[] = []
  let fearGreedCurrent: FearGreedIndex | null = null
  let fearGreedHistory: FearGreedIndex[] = []

  // 获取全球市场数据（CoinGecko）
  try {
    console.log('[MarketIndices] 请求 1/4: 全球市场数据 (CoinGecko)')
    globalData = await coingecko.getGlobalData()
    console.log('[MarketIndices] 请求 1/4 完成')
  } catch (error) {
    console.error('[MarketIndices] 请求 1/4 失败:', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
  }

  // 获取 DeFi 数据（CoinGecko）
  try {
    console.log('[MarketIndices] 请求 2/4: DeFi 数据 (CoinGecko)')
    defiData = await coingecko.getDefiGlobalData()
    console.log('[MarketIndices] 请求 2/4 完成')
  } catch (error) {
    console.error('[MarketIndices] 请求 2/4 失败:', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
  }

  // 获取热门币种（CoinGecko）
  try {
    console.log('[MarketIndices] 请求 3/4: 热门币种 (CoinGecko)')
    const trending = await coingecko.getTrendingCoins()
    trendingCoins = trending.slice(0, 7).map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      market_cap_rank: coin.market_cap_rank,
      price_btc: coin.price_btc,
      score: coin.score,
      thumb: coin.thumb,
    }))
    console.log('[MarketIndices] 请求 3/4 完成')
  } catch (error) {
    console.error('[MarketIndices] 请求 3/4 失败:', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
  }

  // 获取恐惧与贪婪指数（CoinMarketCap）
  try {
    console.log('[MarketIndices] 请求 4/4: 恐惧与贪婪指数 (CoinMarketCap)')
    
    // 获取最新值
    const latestFearGreed = await coinmarketcap.getFearAndGreedIndexLatest()
    if (latestFearGreed) {
      fearGreedCurrent = {
        value: latestFearGreed.value,
        value_classification: latestFearGreed.value_classification,
        timestamp: latestFearGreed.timestamp,
      }
    }

    // 获取历史数据
    const historyData = await coinmarketcap.getFearAndGreedIndex(30)
    fearGreedHistory = historyData.map(item => ({
      value: item.value,
      value_classification: item.value_classification,
      timestamp: item.timestamp,
    }))

    // 如果没有最新值但有历史数据，使用历史数据的第一个
    if (!fearGreedCurrent && fearGreedHistory.length > 0) {
      fearGreedCurrent = fearGreedHistory[0]
    }

    console.log('[MarketIndices] 请求 4/4 完成', {
      hasCurrent: !!fearGreedCurrent,
      historyCount: fearGreedHistory.length,
    })
  } catch (error) {
    console.error('[MarketIndices] 请求 4/4 失败:', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
  }

  // 3. 保存到数据库
  if (globalData) {
    await saveSnapshot(globalData, defiData, fearGreedCurrent)
  }

  // 4. 构建返回数据
  const result: MarketIndicesSummary = {
    marketOverview: globalData ? buildOverviewFromCoinGecko(globalData) : null,
    marketTrends: globalData ? buildTrendsFromCoinGecko(globalData, defiData) : null,
    marketActivity: globalData ? buildActivityFromCoinGecko(globalData) : null,
    defiData: defiData ? buildDefiFromCoinGecko(defiData) : null,
    trendingCoins,
    fearGreedIndex: {
      current: fearGreedCurrent,
      history: fearGreedHistory,
    },
    dataSource: 'coingecko',
    timestamp: new Date().toISOString(),
  }

  console.log('[MarketIndices] ====== 市场指数数据获取完成 ======', {
    hasOverview: !!result.marketOverview,
    hasTrends: !!result.marketTrends,
    hasActivity: !!result.marketActivity,
    hasDefi: !!result.defiData,
    trendingCount: result.trendingCoins.length,
    hasFearGreed: !!result.fearGreedIndex.current,
    fearGreedHistoryCount: result.fearGreedIndex.history.length,
  })

  return result
}

/**
 * 获取市场总览数据（单独接口）
 */
export async function getMarketOverview(): Promise<MarketOverview | null> {
  try {
    const globalData = await coingecko.getGlobalData()
    return globalData ? buildOverviewFromCoinGecko(globalData) : null
  } catch (error) {
    console.error('[MarketIndices] 获取市场总览失败:', error)
    return null
  }
}

/**
 * 获取市场活跃度数据（单独接口）
 */
export async function getMarketActivity(): Promise<MarketActivity | null> {
  try {
    const globalData = await coingecko.getGlobalData()
    return globalData ? buildActivityFromCoinGecko(globalData) : null
  } catch (error) {
    console.error('[MarketIndices] 获取市场活跃度失败:', error)
    return null
  }
}

/**
 * 获取市场趋势数据（单独接口）
 */
export async function getMarketTrends(
  marketOverview?: MarketOverview | null
): Promise<MarketTrends | null> {
  try {
    if (!marketOverview) {
      const globalData = await coingecko.getGlobalData()
      if (!globalData) return null
      marketOverview = buildOverviewFromCoinGecko(globalData)
    }

    const btcDominance = marketOverview.market_cap_percentage.btc ?? 0
    const ethDominance = marketOverview.market_cap_percentage.eth ?? 0
    const totalMarketCap = marketOverview.total_market_cap.usd
    const btcMarketCap = (totalMarketCap * btcDominance) / 100
    const ethMarketCap = (totalMarketCap * ethDominance) / 100

    return {
      btc_dominance: btcDominance,
      eth_dominance: ethDominance,
      altcoin_market_cap: totalMarketCap - btcMarketCap - ethMarketCap,
    }
  } catch (error) {
    console.error('[MarketIndices] 获取市场趋势失败:', error)
    return null
  }
}

/**
 * 获取 DeFi 数据（单独接口）
 */
export async function getDefiData(): Promise<DefiData | null> {
  try {
    const defiData = await coingecko.getDefiGlobalData()
    return defiData ? buildDefiFromCoinGecko(defiData) : null
  } catch (error) {
    console.error('[MarketIndices] 获取 DeFi 数据失败:', error)
    return null
  }
}

/**
 * 获取热门币种（单独接口）
 */
export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  try {
    const trending = await coingecko.getTrendingCoins()
    return trending.slice(0, 7).map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      market_cap_rank: coin.market_cap_rank,
      price_btc: coin.price_btc,
      score: coin.score,
      thumb: coin.thumb,
    }))
  } catch (error) {
    console.error('[MarketIndices] 获取热门币种失败:', error)
    return []
  }
}

/**
 * 清除缓存（用于强制刷新）
 */
export async function clearCache(): Promise<void> {
  console.log('[MarketIndices] 清除缓存')
  // 实际上不删除数据，只是下次请求会因为时间过期而重新获取
  // 如果需要强制刷新，可以在这里实现删除逻辑
}

// ============================================================================
// 导出
// ============================================================================

export const marketIndices = {
  getMarketIndicesSummary,
  getMarketOverview,
  getMarketActivity,
  getMarketTrends,
  getDefiData,
  getTrendingCoins,
  clearCache,
}
