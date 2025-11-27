/**
 * 市场数据同步服务
 * 从多个数据源（CoinMarketCap、CoinGecko）获取数据并存储到数据库
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { coinmarketcap, type CoinMarketCapMarketData } from '@/services/coinmarketcap'
import { coingecko, type CoinGeckoMarketData } from '@/services/coingecko'

/**
 * 同步 CoinMarketCap 数据到数据库
 * @param limit 获取数量，默认 100
 */
export async function syncCoinMarketCapData(limit: number = 100): Promise<{
  success: boolean
  count: number
  errors: string[]
}> {
  const supabase = createAdminClient()
  const errors: string[] = []
  let count = 0

  try {
    // 获取 CoinMarketCap 数据
    const data = await coinmarketcap.getCryptocurrencyListingsLatest(limit)

    // 批量插入或更新数据
    for (const item of data) {
      try {
        const quote = item.quote?.USD
        if (!quote) {
          errors.push(`Missing USD quote for ${item.symbol}`)
          continue
        }

        const marketData = {
          symbol: item.symbol.toUpperCase(),
          name: item.name,
          source: 'coinmarketcap',
          price_usd: quote.price,
          market_cap_usd: quote.market_cap,
          volume_24h_usd: quote.volume_24h,
          price_change_24h: quote.percent_change_24h
            ? (quote.price * quote.percent_change_24h) / 100
            : null,
          price_change_percent_24h: quote.percent_change_24h,
          rank: item.cmc_rank,
          circulating_supply: item.circulating_supply,
          total_supply: item.total_supply,
          max_supply: item.max_supply,
          data: item as any, // 存储完整的原始数据
        }

        // 使用 upsert 插入或更新
        const { error } = await supabase
          .from('market_data')
          .upsert(marketData, {
            onConflict: 'symbol,source',
            ignoreDuplicates: false,
          })

        if (error) {
          errors.push(`Failed to upsert ${item.symbol}: ${error.message}`)
        } else {
          count++
        }
      } catch (error) {
        errors.push(
          `Error processing ${item.symbol}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
    }

    return {
      success: errors.length === 0,
      count,
      errors,
    }
  } catch (error) {
    throw new Error(
      `Failed to sync CoinMarketCap data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * 同步 CoinGecko 数据到数据库
 * @param limit 获取数量，默认 100
 */
export async function syncCoinGeckoData(limit: number = 100): Promise<{
  success: boolean
  count: number
  errors: string[]
}> {
  const supabase = createAdminClient()
  const errors: string[] = []
  let count = 0

  try {
    // 计算需要的页数
    const perPage = Math.min(limit, 250) // CoinGecko 最大每页 250
    const pages = Math.ceil(limit / perPage)

    // 获取 CoinGecko 数据
    const allData: CoinGeckoMarketData[] = []
    for (let page = 1; page <= pages; page++) {
      const data = await coingecko.getCoinsMarkets(page, perPage)
      allData.push(...data)
      if (allData.length >= limit) {
        break
      }
    }

    // 批量插入或更新数据
    for (const item of allData.slice(0, limit)) {
      try {
        const marketData = {
          symbol: item.symbol.toUpperCase(),
          name: item.name,
          source: 'coingecko',
          price_usd: item.current_price,
          market_cap_usd: item.market_cap,
          volume_24h_usd: item.total_volume,
          price_change_24h: item.price_change_24h,
          price_change_percent_24h: item.price_change_percentage_24h,
          rank: item.market_cap_rank,
          circulating_supply: item.circulating_supply,
          total_supply: item.total_supply,
          max_supply: item.max_supply,
          data: item as any, // 存储完整的原始数据
        }

        // 使用 upsert 插入或更新
        const { error } = await supabase
          .from('market_data')
          .upsert(marketData, {
            onConflict: 'symbol,source',
            ignoreDuplicates: false,
          })

        if (error) {
          errors.push(`Failed to upsert ${item.symbol}: ${error.message}`)
        } else {
          count++
        }
      } catch (error) {
        errors.push(
          `Error processing ${item.symbol}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
    }

    return {
      success: errors.length === 0,
      count,
      errors,
    }
  } catch (error) {
    throw new Error(
      `Failed to sync CoinGecko data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * 同步所有数据源的市场数据
 * @param limit 每个数据源获取的数量，默认 100
 */
export async function syncAllMarketData(limit: number = 100): Promise<{
  coinmarketcap: { success: boolean; count: number; errors: string[] }
  coingecko: { success: boolean; count: number; errors: string[] }
}> {
  const results = {
    coinmarketcap: { success: false, count: 0, errors: [] as string[] },
    coingecko: { success: false, count: 0, errors: [] as string[] },
  }

  // 同步 CoinMarketCap（如果配置了 API Key）
  if (process.env.COINMARKETCAP_API_KEY) {
    try {
      results.coinmarketcap = await syncCoinMarketCapData(limit)
    } catch (error) {
      results.coinmarketcap.errors.push(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  } else {
    results.coinmarketcap.errors.push('COINMARKETCAP_API_KEY not configured')
  }

  // 同步 CoinGecko（不需要 API Key，但建议配置）
  try {
    results.coingecko = await syncCoinGeckoData(limit)
  } catch (error) {
    results.coingecko.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    )
  }

  return results
}

