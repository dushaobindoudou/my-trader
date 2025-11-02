/**
 * 获取所有标签列表 API
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 获取所有条目的标签
    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('tags')

    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`)
    }

    // 提取所有标签并去重
    const allTags = new Set<string>()
    data?.forEach((entry) => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach((tag: string) => {
          if (tag && typeof tag === 'string') {
            allTags.add(tag)
          }
        })
      }
    })

    // 转换为排序后的数组
    const tags = Array.from(allTags).sort()

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

