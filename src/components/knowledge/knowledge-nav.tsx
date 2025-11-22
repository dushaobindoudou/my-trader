/**
 * 知识库二级导航组件
 */

'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TopicForm } from './topic-form'
import { TopicIcon } from './topic-icon'
import type { TopicWithEntryCount, TopicCreateInput, TopicUpdateInput } from '@/types/topic'

interface KnowledgeNavProps {
  selectedTopicId?: string | null // 当前选中的主题ID，null 表示"全部"
  onTopicChange?: (topicId: string | null) => void // 主题切换回调
  showOnlyButton?: boolean // 是否只显示添加按钮（用于主题管理页面）
}

export function KnowledgeNav({ 
  selectedTopicId = null, 
  onTopicChange,
  showOnlyButton = false 
}: KnowledgeNavProps) {
  const pathname = usePathname()
  const [topics, setTopics] = useState<TopicWithEntryCount[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // 加载主题列表
  useEffect(() => {
    loadTopics()
  }, [])

  // 当路径改变时，如果主题列表还未加载，重新加载（确保活动选项卡正确）
  useEffect(() => {
    if (topics.length === 0 && !loading) {
      loadTopics()
    }
  }, [pathname])

  const loadTopics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/topics')
      if (response.ok) {
        const data = await response.json()
        setTopics(data)
      }
    } catch (error) {
      console.error('Failed to load topics:', error)
    } finally {
      setLoading(false)
    }
  }

  // 根据传入的 selectedTopicId 或路径确定当前选项卡
  const getCurrentTab = () => {
    // 如果只显示按钮（投资主题页面），不显示活动选项卡
    if (showOnlyButton || pathname === '/knowledge/topics') {
      return undefined
    }
    // 如果传入了 selectedTopicId，使用它
    if (selectedTopicId !== undefined && selectedTopicId !== null) {
      return selectedTopicId
    }
    // 默认显示全部
    return 'all'
  }

  const currentTab = getCurrentTab()

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      // 通知父组件切换到"全部"
      onTopicChange?.(null)
    } else {
      // 通知父组件切换到指定主题
      onTopicChange?.(value)
    }
  }

  const handleCreateTopic = async (data: TopicCreateInput | TopicUpdateInput) => {
    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create topic')
      }

      const newTopic = await response.json()

      // 刷新主题列表
      await loadTopics()
      setIsFormOpen(false)

      // 创建后切换到新主题（如果在知识库页面）
      if (!showOnlyButton && pathname === '/knowledge') {
        onTopicChange?.(newTopic.id)
      }
    } catch (error) {
      console.error('Failed to create topic:', error)
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('创建主题失败，请重试')
      }
      throw error
    }
  }

  // 如果只显示按钮，直接返回按钮和表单
  if (showOnlyButton) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          添加主题
        </Button>
        <TopicForm
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)
          }}
          topic={null}
          onSubmit={handleCreateTopic}
        />
      </>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Tabs value={currentTab || ''} onValueChange={handleTabChange} className="flex-1">
        <TabsList className="flex-wrap">
          {/* 全部选项卡 */}
          <TabsTrigger value="all">
            <FileText className="mr-2 h-4 w-4" />
            全部
          </TabsTrigger>

          {/* 动态加载的主题选项卡 */}
          {loading ? (
            <TabsTrigger value="loading" disabled>
              加载中...
            </TabsTrigger>
          ) : (
            topics.map((topic) => (
              <TabsTrigger key={topic.id} value={topic.id}>
                {topic.icon && topic.icon.startsWith('crypto:') ? (
                  <>
                    <TopicIcon icon={topic.icon} size={16} className="mr-2" />
                    <span>{topic.name}</span>
                  </>
                ) : (
                  <>
                    {topic.icon && <span className="mr-2">{topic.icon}</span>}
                    <span>{topic.name}</span>
                  </>
                )}
              </TabsTrigger>
            ))
          )}
        </TabsList>
      </Tabs>

      {/* 添加主题按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsFormOpen(true)}
        className="shrink-0"
      >
        <Plus className="mr-2 h-4 w-4" />
        添加主题
      </Button>

      {/* 主题创建对话框 */}
      <TopicForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
        }}
        topic={null}
        onSubmit={handleCreateTopic}
      />
    </div>
  )
}

