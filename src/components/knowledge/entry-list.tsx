/**
 * 知识库条目列表组件
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { KnowledgeEntry, PaginatedResponse } from '@/types/knowledge'
import type { KnowledgeEntryFilter, KnowledgeEntrySort } from '@/types/knowledge'
import { EntryCard } from './entry-card'
import { Pagination } from './pagination'

interface EntryListProps {
  filter?: KnowledgeEntryFilter
  sort?: KnowledgeEntrySort
  onEdit?: (entry: any) => void
  onDelete?: (id: string) => void
  onViewDetail?: (entry: any) => void
}

export function EntryList({ filter, sort, onEdit, onDelete, onViewDetail }: EntryListProps) {
  const [data, setData] = useState<PaginatedResponse<KnowledgeEntry> | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    fetchEntries()
  }, [filter, sort, page, pageSize])

  // 筛选条件变化时重置到第一页
  useEffect(() => {
    setPage(1)
  }, [filter, sort])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (filter?.category) params.set('category', filter.category)
      if (filter?.tags && filter.tags.length > 0) {
        params.set('tags', filter.tags.join(','))
      }
      if (filter?.topics && filter.topics.length > 0) {
        params.set('topics', filter.topics.join(','))
      }
      if (filter?.startDate) params.set('startDate', filter.startDate)
      if (filter?.endDate) params.set('endDate', filter.endDate)
      if (filter?.search) params.set('search', filter.search)
      if (filter?.confidenceMin !== undefined) {
        params.set('confidenceMin', filter.confidenceMin.toString())
      }
      if (filter?.confidenceMax !== undefined) {
        params.set('confidenceMax', filter.confidenceMax.toString())
      }
      if (filter?.confidenceLevel) params.set('confidenceLevel', filter.confidenceLevel)
      
      if (sort) {
        params.set('sortField', sort.field)
        params.set('sortDirection', sort.direction)
      }
      
      params.set('page', page.toString())
      params.set('limit', pageSize.toString())

      const response = await fetch(`/api/knowledge?${params.toString()}`, {
        credentials: 'include', // 确保 Cookie 被发送
      })
      if (!response.ok) {
        throw new Error('Failed to fetch entries')
      }
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">暂无数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {data.data.map((entry) => (
          <EntryCard 
            key={entry.id} 
            entry={entry}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>
      
      {/* 分页 */}
      {data.totalPages > 1 && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          pageSize={pageSize}
          total={data.total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1) // 切换每页数量时重置到第一页
          }}
        />
      )}
    </div>
  )
}

