/**
 * 知识库条目详情查看组件
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Calendar, TrendingUp } from 'lucide-react'
import type { KnowledgeEntry } from '@/types/knowledge'
import { Category } from '@/types/knowledge'
import type { Topic } from '@/types/topic'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEffect, useState } from 'react'
import { TopicIcon } from './topic-icon'

interface EntryDetailProps {
  entry: KnowledgeEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (entry: KnowledgeEntry) => void
  onDelete?: (id: string) => void
}

const categoryColors: Record<string, string> = {
  [Category.INSTITUTIONAL_COST]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [Category.MARKET_NEWS]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [Category.RESEARCH_OPINION]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [Category.MACRO_DATA]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [Category.PERSONAL_INSIGHT]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

export function EntryDetail({
  entry,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: EntryDetailProps) {
  const [topics, setTopics] = useState<Topic[]>([])

  // 当打开对话框时，如果没有主题信息但有 topic_ids，加载主题信息
  useEffect(() => {
    if (open && entry) {
      if (entry.topics && entry.topics.length > 0) {
        // 如果已有主题信息，直接使用
        setTopics(entry.topics)
      } else if (entry.topic_ids && entry.topic_ids.length > 0) {
        // 如果没有主题信息但有 topic_ids，加载主题信息
        fetch('/api/topics')
          .then((res) => res.json())
          .then((allTopics: Topic[]) => {
            // 根据 topic_ids 过滤出对应的主题
            const entryTopics = allTopics.filter((topic) =>
              entry.topic_ids?.includes(topic.id)
            )
            setTopics(entryTopics)
          })
          .catch((error) => {
            console.error('Failed to load topics:', error)
            setTopics([])
          })
      } else {
        setTopics([])
      }
    } else if (!open) {
      // 关闭对话框时清空
      setTopics([])
    }
  }, [open, entry])

  if (!entry) return null

  const categoryColor = categoryColors[entry.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'

  // 置信度显示 - 始终显示
  const getConfidenceDisplay = () => {
    const score = entry.confidence_score
    if (score === null || score === undefined) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          置信度: 未评分
        </Badge>
      )
    }
    
    const level =
      score >= 7
        ? 'high'
        : score >= 4
        ? 'medium'
        : 'low'
    const bgColor =
      level === 'high'
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700'
        : level === 'medium'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700'
    
    const levelText =
      level === 'high'
        ? '高'
        : level === 'medium'
        ? '中'
        : '低'
    
    return (
      <Badge variant="outline" className={`${bgColor} font-medium`}>
        <TrendingUp className="h-3 w-3 mr-1" />
        置信度: {score}/10 ({levelText})
      </Badge>
    )
  }

  // 时间格式化
  const timeAgo = formatDistanceToNow(new Date(entry.created_at), {
    addSuffix: true,
    locale: zhCN,
  })

  const updatedTimeAgo = formatDistanceToNow(new Date(entry.updated_at), {
    addSuffix: true,
    locale: zhCN,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">详情</DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-sm mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              创建: {new Date(entry.created_at).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              更新: {new Date(entry.updated_at).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 基本信息 */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${categoryColor} text-sm`}>{entry.category}</Badge>
              {getConfidenceDisplay()}
            </div>

            {/* 标签 */}
            {entry.tags && entry.tags.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 主题 */}
            {(entry.topic_ids && entry.topic_ids.length > 0) || topics.length > 0 ? (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  主题
                </label>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <Badge key={topic.id} variant="outline" className="gap-1.5 text-sm flex items-center">
                      {topic.icon && topic.icon.startsWith('crypto:') ? (
                        <TopicIcon icon={topic.icon} size={14} />
                      ) : (
                        <>
                          {topic.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: topic.color }}
                            />
                          )}
                          {topic.icon && !topic.icon.startsWith('crypto:') && (
                            <span>{topic.icon}</span>
                          )}
                        </>
                      )}
                      <span>{topic.name}</span>
                    </Badge>
                  ))}
                  {/* 如果加载中或加载失败，显示 topic_ids 作为后备 */}
                  {topics.length === 0 && entry.topic_ids && entry.topic_ids.length > 0 && (
                    entry.topic_ids.map((id) => (
                      <Badge key={id} variant="outline" className="text-sm font-mono text-xs">
                        {id}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* 内容 */}
          <div className="space-y-2 pt-4">
            <label className="text-sm font-semibold block">内容</label>
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-lg bg-muted/30 min-h-[100px]">
              {entry.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {entry.content}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground text-sm">暂无内容</p>
              )}
            </div>
          </div>

        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 pt-4 mt-4">
          {onEdit && (
            <Button
              variant="outline"
              onClick={() => {
                onEdit(entry)
                onOpenChange(false)
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              编辑
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => {
                if (confirm('确定要删除这条记录吗？此操作不可撤销。')) {
                  onDelete(entry.id)
                  onOpenChange(false)
                }
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

