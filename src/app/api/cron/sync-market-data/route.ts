/**
 * 定时同步市场数据
 * 每天更新一次市场数据（CoinMarketCap、CoinGecko）
 * 可以配置为 Cron Job 定期调用
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncAllMarketData } from '@/lib/market-data-sync'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 验证请求来源（可选，增加安全性）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    // 同步市场数据
    const results = await syncAllMarketData(limit)

    const totalCount = results.coinmarketcap.count + results.coingecko.count
    const totalErrors = [
      ...results.coinmarketcap.errors,
      ...results.coingecko.errors,
    ]

    return NextResponse.json({
      success: totalErrors.length === 0,
      timestamp: new Date().toISOString(),
      results: {
        coinmarketcap: {
          success: results.coinmarketcap.success,
          count: results.coinmarketcap.count,
          errors: results.coinmarketcap.errors,
        },
        coingecko: {
          success: results.coingecko.success,
          count: results.coingecko.count,
          errors: results.coingecko.errors,
        },
      },
      summary: {
        totalCount,
        totalErrors: totalErrors.length,
        errors: totalErrors,
      },
    })
  } catch (error) {
    console.error('Failed to sync market data:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync market data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

