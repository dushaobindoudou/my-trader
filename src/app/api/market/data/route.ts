/**
 * 市场数据 API 路由
 * GET: 查询市场数据（从数据库获取）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams

    // 查询参数
    const symbol = searchParams.get('symbol')
    const source = searchParams.get('source') // coinmarketcap, coingecko
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const orderBy = searchParams.get('order_by') || 'rank' // rank, market_cap_usd, price_usd
    const orderDirection = searchParams.get('order_direction') || 'asc' // asc, desc

    // 构建查询
    let query = supabase
      .from('market_data')
      .select('*')
      .range(offset, offset + limit - 1)

    // 过滤条件
    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase())
    }
    if (source) {
      query = query.eq('source', source)
    }

    // 排序
    const validOrderBy = ['rank', 'market_cap_usd', 'price_usd', 'volume_24h_usd', 'updated_at']
    const validOrderDirection = ['asc', 'desc']
    if (validOrderBy.includes(orderBy) && validOrderDirection.includes(orderDirection)) {
      query = query.order(orderBy, { ascending: orderDirection === 'asc' })
    } else {
      query = query.order('rank', { ascending: true })
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      data: data || [],
      count: data?.length || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Failed to fetch market data:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch market data',
      },
      { status: 500 }
    )
  }
}

