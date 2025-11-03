'use client'

import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Main } from "@/components/layout/main"
import { Button } from "@/components/ui/button"
import { KnowledgeNav } from "@/components/knowledge/knowledge-nav"
import { EntryList } from "@/components/knowledge/entry-list"
import { SearchFilterBar } from "@/components/knowledge/search-filter-bar"
import { EntryForm } from "@/components/knowledge/entry-form"
import { EntryDetail } from "@/components/knowledge/entry-detail"
import { ExportButton } from "@/components/knowledge/export-button"
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { KnowledgeEntryFilter, KnowledgeEntrySort, KnowledgeEntry } from '@/types/knowledge'
import type { KnowledgeEntryCreateInput, KnowledgeEntryUpdateInput } from '@/types/knowledge'

export default function KnowledgePage() {
  const searchParams = useSearchParams()
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null) // 当前选中的主题ID
  const [filter, setFilter] = useState<KnowledgeEntryFilter>({})
  const [sort, setSort] = useState<KnowledgeEntrySort>({
    field: 'created_at',
    direction: 'desc',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableTopics, setAvailableTopics] = useState<Array<{ id: string; name: string }>>([])
  const [detailEntry, setDetailEntry] = useState<KnowledgeEntry | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // 从 URL 参数中读取 topic ID
  useEffect(() => {
    const topicParam = searchParams?.get('topic')
    if (topicParam) {
      setSelectedTopicId(topicParam)
    }
  }, [searchParams])

  // 加载可用标签和主题
  useEffect(() => {
    const loadAvailableData = async () => {
      try {
        // 加载标签
        const tagsResponse = await fetch('/api/knowledge/tags')
        if (tagsResponse.ok) {
          const tags = await tagsResponse.json()
          setAvailableTags(tags)
        }

        // 加载主题
        const topicsResponse = await fetch('/api/topics')
        if (topicsResponse.ok) {
          const topics = await topicsResponse.json()
          setAvailableTopics(
            topics.map((t: any) => ({ id: t.id, name: t.name }))
          )
        }
      } catch (error) {
        console.error('Failed to load available tags and topics:', error)
      }
    }

    loadAvailableData()
  }, [])

  // 处理主题切换（来自 Tab）
  const handleTopicChange = (topicId: string | null) => {
    setSelectedTopicId(topicId)
    // 清除 filter 中的主题筛选，因为现在通过 selectedTopicId 统一管理（Tab 优先级更高）
    setFilter((prev) => {
      const { topics, ...rest } = prev
      return rest
    })
  }

  // 处理筛选栏变化（清除 Tab 选择的主题，如果筛选栏中选择了其他主题）
  const handleFilterChange = (newFilter: KnowledgeEntryFilter) => {
    // 如果筛选栏中的主题与 Tab 选择的主题不同，清除 Tab 选择
    if (newFilter.topics && newFilter.topics.length > 0) {
      const filterTopicIds = newFilter.topics
      if (selectedTopicId && !filterTopicIds.includes(selectedTopicId)) {
        // 筛选栏选择了不同的主题，清除 Tab 选择
        setSelectedTopicId(null)
      }
    } else if (!newFilter.topics || newFilter.topics.length === 0) {
      // 筛选栏清除了主题筛选，但保留 Tab 选择（如果存在）
      // 这里不做任何操作，让 Tab 选择继续生效
    }
    setFilter(newFilter)
  }

  // 合并搜索、Tab 选择的主题和筛选条件
  const combinedFilter: KnowledgeEntryFilter = {
    ...filter,
    search: searchQuery || undefined,
    // Tab 选择的主题优先级最高，如果 Tab 选择了主题，覆盖筛选栏的主题筛选
    topics: selectedTopicId ? [selectedTopicId] : (filter.topics || undefined),
  }

  const handleCreate = async (data: KnowledgeEntryCreateInput | KnowledgeEntryUpdateInput) => {
    try {
      const url = editingEntry 
        ? `/api/knowledge/${editingEntry.id}`
        : '/api/knowledge'
      const method = editingEntry ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `保存失败 (${response.status})`
        throw new Error(errorMessage)
      }

      const result = await response.json()

      // 刷新列表
      setRefreshKey(prev => prev + 1)
      setIsFormOpen(false)
      setEditingEntry(null)
      
      // 如果编辑的是正在查看的详情，更新详情数据
      if (detailEntry?.id === result.id) {
        setDetailEntry(result)
      }
    } catch (error) {
      console.error('Failed to save entry:', error)
      throw error
    }
  }

  const handleEdit = (entry: any) => {
    setEditingEntry(entry)
    setIsFormOpen(true)
  }

  const handleViewDetail = async (entry: KnowledgeEntry) => {
    // 如果需要完整数据，可以从服务器获取
    try {
      const response = await fetch(`/api/knowledge/${entry.id}`)
      if (response.ok) {
        const fullEntry = await response.json()
        setDetailEntry(fullEntry)
        setIsDetailOpen(true)
      } else {
        // 如果获取失败，使用当前数据
        setDetailEntry(entry)
        setIsDetailOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch entry detail:', error)
      // 如果获取失败，使用当前数据
      setDetailEntry(entry)
      setIsDetailOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete entry')
      }

      // 刷新列表
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Failed to delete entry:', error)
      alert('删除失败，请重试')
    }
  }

  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">知识库</h1>
            <p className="text-muted-foreground">管理投资信息和市场数据</p>
          </div>
          <div className="flex gap-2">
            <ExportButton filter={combinedFilter} />
            <Button onClick={() => {
              setEditingEntry(null)
              setIsFormOpen(true)
            }}>
              新建信息
            </Button>
          </div>
        </div>
        
        {/* 二级导航 */}
        <div className="mb-6">
          <KnowledgeNav 
            selectedTopicId={selectedTopicId}
            onTopicChange={handleTopicChange}
          />
        </div>

        {/* 搜索和筛选栏 */}
        <div className="mb-6">
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filter={filter}
            onFilterChange={handleFilterChange}
            availableTags={availableTags}
            availableTopics={availableTopics}
          />
        </div>

        {/* 主要内容区域 */}
        <EntryList
          key={refreshKey}
          filter={combinedFilter}
          sort={sort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetail={handleViewDetail}
        />

        {/* 录入/编辑对话框 */}
        <EntryForm
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)
            if (!open) {
              setEditingEntry(null)
            }
          }}
          entry={editingEntry}
          onSubmit={handleCreate}
        />

        {/* 详情查看对话框 */}
        <EntryDetail
          entry={detailEntry}
          open={isDetailOpen}
          onOpenChange={(open) => {
            setIsDetailOpen(open)
            if (!open) {
              setDetailEntry(null)
            }
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Main>
    </AuthenticatedLayout>
  )
}
