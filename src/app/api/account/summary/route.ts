/**
 * 账户 API 路由 - 账户摘要
 * GET: 获取账户摘要信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { hyperliquid } from '@/services/hyperliquid'
import { getPositions } from '@/lib/trading'
import { getTrades } from '@/lib/trading'
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

    // 并行获取数据
    const [balance, positions, trades] = await Promise.all([
      hyperliquid.getBalance(user_address),
      getPositions(user_address),
      getTrades({
        filter: { user_address, status: 'pending' },
        limit: 1000,
      }),
    ])

    // 计算总余额
    const totalBalance = balance.reduce((sum, b) => {
      return sum + parseFloat(b.walletBalance || '0')
    }, 0)

    // 计算可用余额
    const availableBalance = balance.reduce((sum, b) => {
      return sum + parseFloat(b.availableBalance || '0')
    }, 0)

    // 计算总未实现盈亏
    const totalUnrealizedPnl = positions.reduce((sum, p) => {
      return sum + (p.unrealized_pnl || 0)
    }, 0)

    // 计算总已实现盈亏
    const totalRealizedPnl = positions.reduce((sum, p) => {
      return sum + (p.realized_pnl || 0)
    }, 0)

    const summary = {
      total_balance: totalBalance,
      available_balance: availableBalance,
      positions_count: positions.length,
      open_orders_count: trades.total,
      total_unrealized_pnl: totalUnrealizedPnl,
      total_realized_pnl: totalRealizedPnl,
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Failed to fetch account summary:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch account summary' },
      { status: 500 }
    )
  }
}

