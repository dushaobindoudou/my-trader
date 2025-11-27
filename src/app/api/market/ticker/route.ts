/**
 * 市场数据 API 路由 - 行情数据
 * GET: 获取行情数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { hyperliquid } from '@/services/hyperliquid'
import { verifyAuth } from '@/lib/auth/middleware'

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
    const symbol = searchParams.get('symbol') || undefined

    const ticker = await hyperliquid.getTicker(symbol)
    return NextResponse.json(ticker)
  } catch (error) {
    console.error('Failed to fetch ticker:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ticker' },
      { status: 500 }
    )
  }
}

