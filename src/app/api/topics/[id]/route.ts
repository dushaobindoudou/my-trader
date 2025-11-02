/**
 * 单个主题 API 路由
 * GET: 获取单个主题详情（包含条目数量）
 * PATCH: 更新主题
 * DELETE: 删除主题（级联删除关联）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTopicById, updateTopic, deleteTopic } from '@/lib/topics'
import type { TopicUpdateInput } from '@/types/topic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 处理 Next.js 15 中 params 可能是 Promise 的情况
    const resolvedParams = params instanceof Promise ? await params : params
    
    // 验证 ID 是否是有效的 UUID
    if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid topic ID' },
        { status: 400 }
      )
    }

    const topic = await getTopicById(resolvedParams.id)

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    return NextResponse.json(topic)
  } catch (error) {
    console.error('Failed to fetch topic:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch topic' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 处理 Next.js 15 中 params 可能是 Promise 的情况
    const resolvedParams = params instanceof Promise ? await params : params
    
    // 验证 ID 是否是有效的 UUID
    if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid topic ID' },
        { status: 400 }
      )
    }

    const body: TopicUpdateInput = await request.json()

    const topic = await updateTopic(resolvedParams.id, body)

    return NextResponse.json(topic)
  } catch (error) {
    console.error('Failed to update topic:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update topic' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 处理 Next.js 15 中 params 可能是 Promise 的情况
    const resolvedParams = params instanceof Promise ? await params : params
    
    // 验证 ID 是否是有效的 UUID
    if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid topic ID' },
        { status: 400 }
      )
    }

    await deleteTopic(resolvedParams.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete topic:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete topic' },
      { status: 500 }
    )
  }
}

