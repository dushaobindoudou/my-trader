/**
 * 主题卡片组件
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TopicWithEntryCount } from '@/types/topic'
import Link from 'next/link'

interface TopicCardProps {
  topic: TopicWithEntryCount
  onRefresh?: () => void
  onEdit?: (topic: TopicWithEntryCount) => void
  onDelete?: (id: string) => void
}

export function TopicCard({ topic, onRefresh, onEdit, onDelete }: TopicCardProps) {
  const handleDelete = async () => {
    if (!confirm(`确定要删除主题"${topic.name}"吗？\n\n删除主题不会删除条目，只会移除关联。`)) {
      return
    }

    try {
      const response = await fetch(`/api/topics/${topic.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete topic')
      }

      onRefresh?.()
      onDelete?.(topic.id)
    } catch (error) {
      console.error('Failed to delete topic:', error)
      alert('删除失败，请重试')
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {topic.color && (
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: topic.color }}
                />
              )}
              {topic.icon && <span className="text-lg">{topic.icon}</span>}
              <CardTitle className="text-lg">{topic.name}</CardTitle>
            </div>
            {topic.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {topic.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/knowledge/topics/${topic.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  查看详情
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(topic)}>
                <Edit className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {topic.entry_count} 个条目
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/knowledge/topics/${topic.id}`}>
              查看详情
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

