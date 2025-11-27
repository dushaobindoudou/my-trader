/**
 * 持仓 API 路由
 * GET: 获取持仓列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPositions } from '@/lib/trading'
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

    const user_address = authResult.user_address
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol') || undefined

    const positions = await getPositions(user_address, symbol)
    return NextResponse.json(positions)
  } catch (error) {
    console.error('Failed to fetch positions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch positions' },
      { status: 500 }
    )
  }
}

