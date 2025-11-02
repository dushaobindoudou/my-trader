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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entryIds = await getTopicEntryIds(params.id)
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
  { params }: { params: { id: string } }
) {
  try {
    const body: { entryIds: string[] } = await request.json()

    if (!body.entryIds || !Array.isArray(body.entryIds)) {
      return NextResponse.json(
        { error: 'entryIds array is required' },
        { status: 400 }
      )
    }

    await addEntriesToTopic(params.id, body.entryIds)

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
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }

    await removeEntryFromTopic(params.id, entryId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove entry from topic:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove entry from topic' },
      { status: 500 }
    )
  }
}

