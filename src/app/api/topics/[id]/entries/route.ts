/**
 * 主题条目管理 API 路由
 * GET: 获取主题下的所有条目ID列表
 * POST: 批量添加条目到主题
 * DELETE: 从主题中移除条目（需要 entryId 查询参数）
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getTopicEntryIds,
  addEntriesToTopic,
  removeEntryFromTopic,
} from '@/lib/topics'
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

    const entryIds = await getTopicEntryIds(resolvedParams.id, authResult.user_address)
    return NextResponse.json(entryIds)
  } catch (error) {
    console.error('Failed to fetch topic entries:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch topic entries' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const body: { entryIds: string[] } = await request.json()

    if (!body.entryIds || !Array.isArray(body.entryIds)) {
      return NextResponse.json(
        { error: 'entryIds array is required' },
        { status: 400 }
      )
    }

    await addEntriesToTopic(resolvedParams.id, body.entryIds, authResult.user_address)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to add entries to topic:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add entries to topic' },
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

    const searchParams = request.nextUrl.searchParams
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }

    await removeEntryFromTopic(resolvedParams.id, entryId, authResult.user_address)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove entry from topic:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove entry from topic' },
      { status: 500 }
    )
  }
}

