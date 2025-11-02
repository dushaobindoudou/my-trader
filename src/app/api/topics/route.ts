/**
 * 主题 API 路由
 * GET: 获取所有主题列表（包含条目数量）
 * POST: 创建新主题
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTopics, createTopic } from '@/lib/topics'
import type { TopicCreateInput } from '@/types/topic'

export async function GET(request: NextRequest) {
  try {
    const topics = await getTopics()
    return NextResponse.json(topics)
  } catch (error) {
    console.error('Failed to fetch topics:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TopicCreateInput = await request.json()

    // 验证必填字段
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const topic = await createTopic(body)

    return NextResponse.json(topic, { status: 201 })
  } catch (error) {
    console.error('Failed to create topic:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create topic' },
      { status: 500 }
    )
  }
}

