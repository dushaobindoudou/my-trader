/**
 * 市场数据 API 路由 - K线数据
 * GET: 获取K线数据（直接调用 Hyperliquid API）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getKlinesFromHyperliquid } from '@/lib/market-data'
import { verifyAuth } from '@/lib/auth/middleware'
import type { KlineInterval } from '@/types/trading'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await verifyAuth(request)
    if (!authResult.isValid || !authResult.user_address) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing session' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams

    // 必填参数
    const symbol = searchParams.get('symbol')
    const interval = searchParams.get('interval')

    if (!symbol || !interval) {
      return NextResponse.json(
        { error: 'Missing required parameters: symbol, interval' },
        { status: 400 }
      )
    }

    // 验证 interval
    const validIntervals = ['1min', '5min', '1h', '4h', '1d', '3d', '1w']
    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}` },
        { status: 400 }
      )
    }

    // 可选参数
    const startTime = searchParams.get('start_time')
      ? parseInt(searchParams.get('start_time')!, 10)
      : undefined
    const endTime = searchParams.get('end_time')
      ? parseInt(searchParams.get('end_time')!, 10)
      : undefined
    const limit = parseInt(searchParams.get('limit') || '500', 10)

    // 直接从 Hyperliquid 获取数据
    const klines = await getKlinesFromHyperliquid(
      symbol,
      interval as KlineInterval,
      startTime,
      endTime,
      limit
    )

    return NextResponse.json(klines)
  } catch (error) {
    console.error('Failed to fetch klines:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch klines' },
      { status: 500 }
    )
  }
}
