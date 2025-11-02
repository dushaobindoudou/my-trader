/**
 * 知识库条目卡片组件
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { KnowledgeEntry } from '@/types/knowledge'
import { Category } from '@/types/knowledge'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface EntryCardProps {
  entry: KnowledgeEntry
  onEdit?: (entry: KnowledgeEntry) => void
  onDelete?: (id: string) => void
  onViewDetail?: (entry: KnowledgeEntry) => void
}

const categoryColors: Record<string, string> = {
  [Category.INSTITUTIONAL_COST]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [Category.MARKET_NEWS]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [Category.RESEARCH_OPINION]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [Category.MACRO_DATA]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [Category.PERSONAL_INSIGHT]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

export function EntryCard({ entry, onEdit, onDelete, onViewDetail }: EntryCardProps) {
  const categoryColor = categoryColors[entry.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  
  // 内容摘要（前100字）
  const summary = entry.content.length > 100 
    ? entry.content.substring(0, 100) + '...'
    : entry.content

  // 置信度评分显示
  const getConfidenceDisplay = () => {
    if (!entry.confidence_score) return null
    const level = entry.confidence_score >= 7 ? 'high' : entry.confidence_score >= 4 ? 'medium' : 'low'
    const color = level === 'high' ? 'text-green-600' : level === 'medium' ? 'text-yellow-600' : 'text-red-600'
    return (
      <Badge variant="outline" className={color}>
        置信度: {entry.confidence_score}/10
      </Badge>
    )
  }

  // 时间格式化
  const timeAgo = formatDistanceToNow(new Date(entry.created_at), {
    addSuffix: true,
    locale: zhCN,
  })

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewDetail?.(entry)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* 内容摘要 */}
            <p 
              className="text-sm text-foreground mb-3 line-clamp-2"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetail?.(entry)
              }}
            >
              {summary}
            </p>
            
            {/* 分类和标签展示在消息下面 */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className={categoryColor}>{entry.category}</Badge>
              {entry.tags && entry.tags.length > 0 && (
                <>
                  {entry.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {entry.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{entry.tags.length - 3}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* 右侧：时间和操作按钮 */}
          <div className="flex items-start gap-2 flex-shrink-0">
            <CardDescription className="text-xs whitespace-nowrap">
              {timeAgo}
            </CardDescription>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(entry)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(entry.id)
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

