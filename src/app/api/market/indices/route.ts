/**
 * 市场指数 API 路由
 * 
 * GET: 获取市场指数汇总数据
 * - 全球市场数据（总市值、交易量、主导地位等）
 * - DeFi 数据
 * - 市场活跃度
 * - 热门币种
 * 
 * 数据来源：CoinGecko（主要）+ 数据库缓存（5分钟）
 */

import { NextRequest, NextResponse } from 'next/server'
import { marketIndices } from '@/services/market-indices'
import { verifyAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

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

    // 获取市场指数数据
    const data = await marketIndices.getMarketIndicesSummary()

    // 添加响应头，告知客户端数据来源和缓存状态
    const response = NextResponse.json(data)
    response.headers.set('X-Data-Source', data.dataSource)
    if (data.cacheAge !== undefined) {
      response.headers.set('X-Cache-Age', data.cacheAge.toString())
    }

    return response
  } catch (error) {
    console.error('[API] 获取市场指数失败:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch market indices',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
