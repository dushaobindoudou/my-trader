/**
 * 知识库条目 API 路由
 * GET: 获取知识库条目列表（支持分页、筛选、排序）
 * POST: 创建新的知识库条目
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getKnowledgeEntries,
  createKnowledgeEntry,
  exportKnowledgeEntries,
} from '@/lib/knowledge'
import type {
  KnowledgeEntryCreateInput,
  KnowledgeEntryFilter,
  KnowledgeEntrySort,
} from '@/types/knowledge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // 检查是否是导出请求
    const exportParam = searchParams.get('export')
    if (exportParam === 'true') {
      // 处理导出请求
      const format = searchParams.get('format') || 'json'
      const filter = parseFilterParams(searchParams)
      const data = await exportKnowledgeEntries(filter)

      if (format === 'csv') {
        // 转换为 CSV
        const csv = convertToCSV(data)
        const filename = `knowledge-export-${new Date().toISOString().split('T')[0]}.csv`
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        })
      } else {
        // JSON 格式
        const filename = `knowledge-export-${new Date().toISOString().split('T')[0]}.json`
        return NextResponse.json(data, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        })
      }
    }

    // 处理列表请求
    const category = searchParams.get('category') as any
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const topics = searchParams.get('topics')?.split(',').filter(Boolean) || []
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const search = searchParams.get('search') || undefined
    const confidenceMin = searchParams.get('confidenceMin')
      ? parseInt(searchParams.get('confidenceMin')!)
      : undefined
    const confidenceMax = searchParams.get('confidenceMax')
      ? parseInt(searchParams.get('confidenceMax')!)
      : undefined
    const confidenceLevel = searchParams.get('confidenceLevel') as any
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc'
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20

    const filter: KnowledgeEntryFilter = {
      category,
      tags: tags.length > 0 ? tags : undefined,
      topics: topics.length > 0 ? topics : undefined,
      startDate,
      endDate,
      search,
      confidenceMin,
      confidenceMax,
      confidenceLevel,
    }

    const sort: KnowledgeEntrySort = {
      field: sortField as any,
      direction: sortDirection,
    }

    const result = await getKnowledgeEntries({
      filter,
      sort,
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch knowledge entries:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch knowledge entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: KnowledgeEntryCreateInput = await request.json()

    // 验证必填字段
    if (!body.content || !body.category) {
      return NextResponse.json(
        { error: 'Content and category are required' },
        { status: 400 }
      )
    }

    const entry = await createKnowledgeEntry(body)

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Failed to create knowledge entry:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create knowledge entry' },
      { status: 500 }
    )
  }
}

// 转换为 CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return ''
  }

  // CSV 头部
  const headers = [
    'ID',
    '内容',
    '分类',
    '标签',
    '置信度评分',
    '创建时间',
    '更新时间',
    '主题ID',
  ]

  // CSV 行数据
  const rows = data.map((entry) => {
    return [
      entry.id || '',
      escapeCSV(entry.content || ''),
      entry.category || '',
      (entry.tags || []).join('; '),
      entry.confidence_score || '',
      entry.created_at || '',
      entry.updated_at || '',
      (entry.topic_ids || []).join('; '),
    ]
  })

  // 组合 CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  // 添加 BOM 以支持中文
  return '\uFEFF' + csvContent
}

// 转义 CSV 字段
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// 解析筛选参数（用于导出）
function parseFilterParams(searchParams: URLSearchParams): KnowledgeEntryFilter {
  const category = searchParams.get('category') as any
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
  const topics = searchParams.get('topics')?.split(',').filter(Boolean) || []
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined
  const search = searchParams.get('search') || undefined
  const confidenceMin = searchParams.get('confidenceMin')
    ? parseInt(searchParams.get('confidenceMin')!)
    : undefined
  const confidenceMax = searchParams.get('confidenceMax')
    ? parseInt(searchParams.get('confidenceMax')!)
    : undefined
  const confidenceLevel = searchParams.get('confidenceLevel') as any

  return {
    category,
    tags: tags.length > 0 ? tags : undefined,
    topics: topics.length > 0 ? topics : undefined,
    startDate,
    endDate,
    search,
    confidenceMin,
    confidenceMax,
    confidenceLevel,
  }
}

