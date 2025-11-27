/**
 * 市场数据 API 测试路由（无需登录）
 * 测试 CoinMarketCap 和 CoinGecko 接口
 */

import { NextResponse } from 'next/server'
import { coinmarketcap } from '@/services/coinmarketcap'
import { coingecko } from '@/services/coingecko'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasCmcApiKey: !!(process.env.CMC_API_KEY || process.env.COINMARKETCAP_API_KEY),
      hasCoinGeckoApiKey: !!(process.env.COINGECKO_API_KEY),
      hasProxy: !!(process.env.HTTPS_PROXY || process.env.HTTP_PROXY),
    },
    tests: {},
  }

  // 测试 1: 恐惧与贪婪指数最新值 (CoinMarketCap)
  try {
    console.log('[Test] 测试 1: 恐惧与贪婪指数最新值 (CMC)')
    const latest = await coinmarketcap.getFearAndGreedIndexLatest()
    results.tests = {
      ...results.tests as object,
      fearGreedLatest: {
        success: !!latest,
        source: 'CoinMarketCap',
        data: latest,
      },
    }
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      fearGreedLatest: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }

  // 测试 2: 恐惧与贪婪指数历史数据 (CoinMarketCap)
  try {
    console.log('[Test] 测试 2: 恐惧与贪婪指数历史数据 (CMC)')
    const history = await coinmarketcap.getFearAndGreedIndex(10)
    results.tests = {
      ...results.tests as object,
      fearGreedHistory: {
        success: history.length > 0,
        source: 'CoinMarketCap',
        count: history.length,
        sample: history.slice(0, 3),
      },
    }
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      fearGreedHistory: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }

  // 测试 3: 全球市场数据 (CoinGecko)
  try {
    console.log('[Test] 测试 3: 全球市场数据 (CoinGecko)')
    const global = await coingecko.getGlobalData()
    results.tests = {
      ...results.tests as object,
      globalData: {
        success: !!global,
        source: 'CoinGecko',
        data: global ? {
          activeCryptos: global.active_cryptocurrencies,
          markets: global.markets,
          totalMarketCap: global.total_market_cap?.usd,
          btcDominance: global.market_cap_percentage?.btc,
        } : null,
      },
    }
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      globalData: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }

  // 测试 4: DeFi 数据 (CoinGecko)
  try {
    console.log('[Test] 测试 4: DeFi 数据 (CoinGecko)')
    const defi = await coingecko.getDefiGlobalData()
    results.tests = {
      ...results.tests as object,
      defiData: {
        success: !!defi,
        source: 'CoinGecko',
        data: defi ? {
          defiMarketCap: defi.defi_market_cap,
          defiDominance: defi.defi_dominance,
          topCoin: defi.top_coin_name,
        } : null,
      },
    }
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      defiData: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }

  console.log('[Test] 测试完成')
  return NextResponse.json(results, {
    headers: { 'Content-Type': 'application/json' },
  })
}

