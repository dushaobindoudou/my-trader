/**
 * 单个知识库条目 API 路由
 * GET: 获取单个条目详情
 * PATCH: 更新条目
 * DELETE: 删除条目
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getKnowledgeEntryById,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
} from '@/lib/knowledge'
import type { KnowledgeEntryUpdateInput } from '@/types/knowledge'
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
    const entry = await getKnowledgeEntryById(resolvedParams.id, authResult.user_address)

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Failed to fetch knowledge entry:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch knowledge entry' },
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
    const body: KnowledgeEntryUpdateInput = await request.json()

    // 验证 ID 是否是有效的 UUID
    if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      )
    }

    // 设置用户地址（从会话中获取，不允许客户端指定）
    body.user_address = authResult.user_address

    // 清理和验证 body 中的 topic_ids
    const cleanedBody = { ...body }
    if (cleanedBody.topic_ids !== undefined) {
      if (Array.isArray(cleanedBody.topic_ids)) {
        // 过滤掉无效的 UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        cleanedBody.topic_ids = cleanedBody.topic_ids.filter((id: any) => {
          if (typeof id !== 'string') return false
          if (id === 'undefined' || id === 'null' || id === '') return false
          return uuidRegex.test(id)
        })
      } else {
        // 如果不是数组，删除该字段
        delete cleanedBody.topic_ids
      }
    }

    const entry = await updateKnowledgeEntry(resolvedParams.id, cleanedBody)

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Failed to update knowledge entry:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update knowledge entry' },
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
    
    if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      )
    }

    await deleteKnowledgeEntry(resolvedParams.id, authResult.user_address)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete knowledge entry:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete knowledge entry' },
      { status: 500 }
    )
  }
}

