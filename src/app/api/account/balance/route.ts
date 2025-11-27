/**
 * 账户 API 路由 - 账户余额
 * GET: 获取账户余额
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

    const balance = await hyperliquid.getBalance(authResult.user_address)
    return NextResponse.json(balance)
  } catch (error) {
    console.error('Failed to fetch balance:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}

