/**
 * 交易 API 路由
 * GET: 获取交易列表（支持分页、筛选、排序）
 * POST: 创建新的交易订单
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getTrades,
  createTrade,
} from '@/lib/trading'
import type {
  TradeCreateInput,
  TradeListParams,
} from '@/types/trading'
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

    // 构建筛选条件
    const filter: TradeListParams['filter'] = {
      user_address,
      symbol: searchParams.get('symbol') || undefined,
      side: searchParams.get('side') as 'buy' | 'sell' | undefined,
      status: searchParams.get('status') as any,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
    }

    // 构建排序条件
    const sortField = searchParams.get('sort_field') as 'created_at' | 'executed_at' | 'price' | 'quantity' | undefined
    const sortDirection = searchParams.get('sort_direction') as 'asc' | 'desc' | undefined
    const sort = sortField && sortDirection ? { field: sortField, direction: sortDirection } : undefined

    // 分页参数
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const params: TradeListParams = {
      filter,
      sort,
      page,
      limit,
    }

    const result = await getTrades(params)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch trades:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json() as TradeCreateInput

    // 验证必填字段
    if (!body.symbol || !body.side || !body.order_type || !body.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, side, order_type, quantity' },
        { status: 400 }
      )
    }

    // 如果是限价单，必须有价格
    if (body.order_type === 'limit' && !body.price) {
      return NextResponse.json(
        { error: 'Price is required for limit orders' },
        { status: 400 }
      )
    }

    const trade = await createTrade(user_address, body)
    return NextResponse.json(trade, { status: 201 })
  } catch (error) {
    console.error('Failed to create trade:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create trade' },
      { status: 500 }
    )
  }
}

