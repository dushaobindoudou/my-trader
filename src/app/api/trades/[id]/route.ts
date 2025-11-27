/**
 * 单个交易 API 路由
 * GET: 获取单个交易详情
 * PATCH: 更新交易记录
 * DELETE: 删除交易记录
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getTradeById,
  updateTrade,
  deleteTrade,
} from '@/lib/trading'
import { verifyAuth } from '@/lib/auth/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 验证用户身份
    const authResult = await verifyAuth(request)
    if (!authResult.isValid || !authResult.user_address) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing session' },
        { status: 401 }
      )
    }

    // 处理 Next.js 15 中 params 可能是 Promise 的情况
    const resolvedParams = params instanceof Promise ? await params : params

    // 验证 ID
    if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      )
    }

    const trade = await getTradeById(resolvedParams.id, authResult.user_address)

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    return NextResponse.json(trade)
  } catch (error) {
    console.error('Failed to fetch trade:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch trade' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 验证用户身份
    const authResult = await verifyAuth(request)
    if (!authResult.isValid || !authResult.user_address) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing session' },
        { status: 401 }
      )
    }

    // 处理 Next.js 15 中 params 可能是 Promise 的情况
    const resolvedParams = params instanceof Promise ? await params : params

    // 验证 ID
    if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      )
    }

    const body = await request.json() as Partial<{
      status: string
      order_id: string
      executed_at: string
      price: number
    }>

    const trade = await updateTrade(resolvedParams.id, authResult.user_address, body)
    return NextResponse.json(trade)
  } catch (error) {
    console.error('Failed to update trade:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update trade' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 验证用户身份
    const authResult = await verifyAuth(request)
    if (!authResult.isValid || !authResult.user_address) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing session' },
        { status: 401 }
      )
    }

    // 处理 Next.js 15 中 params 可能是 Promise 的情况
    const resolvedParams = params instanceof Promise ? await params : params

    // 验证 ID
    if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      )
    }

    await deleteTrade(resolvedParams.id, authResult.user_address)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete trade:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete trade' },
      { status: 500 }
    )
  }
}

