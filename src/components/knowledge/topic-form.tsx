/**
 * 主题创建/编辑表单对话框
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { IconSelector } from './icon-selector'
import type { Topic, TopicCreateInput, TopicUpdateInput } from '@/types/topic'

interface TopicFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topic?: Topic | null // 编辑模式时传入
  onSubmit: (data: TopicCreateInput | TopicUpdateInput) => Promise<void>
}

export function TopicForm({ open, onOpenChange, topic, onSubmit }: TopicFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [icon, setIcon] = useState('')
  const [loading, setLoading] = useState(false)

  const isEditMode = !!topic

  // 初始化表单数据
  useEffect(() => {
    if (topic) {
      setName(topic.name)
      setDescription(topic.description || '')
      setColor(topic.color || '#3B82F6')
      setIcon(topic.icon || '')
    } else {
      // 重置表单
      setName('')
      setDescription('')
      setColor('#3B82F6')
      setIcon('')
    }
  }, [topic, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    setLoading(true)
    try {
      const data: TopicCreateInput | TopicUpdateInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
        icon: icon.trim() || undefined,
      }

      await onSubmit(data)

      // 重置表单
      setName('')
      setDescription('')
      setColor('#3B82F6')
      setIcon('')

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to submit topic:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑主题' : '新建主题'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? '修改主题信息'
              : '创建新主题来组织你的知识库条目'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* 主题名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">主题名称 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：BTC、英伟达、宏观政策"
                required
              />
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="主题描述（可选）"
                rows={3}
              />
            </div>

            {/* 图标 */}
            <div className="space-y-2">
              <Label>图标</Label>
              <IconSelector value={icon} onChange={setIcon} />
              <p className="text-xs text-muted-foreground">
                可选，输入加密货币代码（如：btc, eth, sol）
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? '保存中...' : isEditMode ? '保存更改' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

