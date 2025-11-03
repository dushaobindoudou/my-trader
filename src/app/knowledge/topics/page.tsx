'use client'

import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Main } from "@/components/layout/main"
import { Button } from "@/components/ui/button"
import { TopicList } from "@/components/knowledge/topic-list"
import { TopicForm } from "@/components/knowledge/topic-form"
import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { Topic, TopicCreateInput, TopicUpdateInput } from '@/types/topic'

export default function TopicsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreate = async (data: TopicCreateInput | TopicUpdateInput) => {
    try {
      const url = editingTopic 
        ? `/api/topics/${editingTopic.id}`
        : '/api/topics'
      const method = editingTopic ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save topic')
      }

      // 刷新列表
      setRefreshKey(prev => prev + 1)
      setIsFormOpen(false)
      setEditingTopic(null)
    } catch (error) {
      console.error('Failed to save topic:', error)
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('保存失败，请重试')
      }
      throw error
    }
  }

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    // 删除功能已由 TopicCard 组件内部处理，这里可以添加额外的逻辑
    setRefreshKey(prev => prev + 1)
  }

  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">主题管理</h1>
            <p className="text-muted-foreground">管理知识库主题分类</p>
          </div>
          <Button onClick={() => {
            setEditingTopic(null)
            setIsFormOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            添加主题
          </Button>
        </div>

        {/* 主题列表 */}
        <div key={refreshKey}>
          <TopicList
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* 创建/编辑对话框 */}
        <TopicForm
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)
            if (!open) {
              setEditingTopic(null)
            }
          }}
          topic={editingTopic}
          onSubmit={handleCreate}
        />
      </Main>
    </AuthenticatedLayout>
  )
}
