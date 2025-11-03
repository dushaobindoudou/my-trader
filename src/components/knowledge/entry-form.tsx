/**
 * 知识库条目录入/编辑表单对话框
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type {
  KnowledgeEntry,
  KnowledgeEntryCreateInput,
  KnowledgeEntryUpdateInput,
  Category,
} from '@/types/knowledge'
import { Category as CategoryEnum } from '@/types/knowledge'
import type { Topic } from '@/types/topic'
import { TopicIcon } from './topic-icon'

interface EntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry?: KnowledgeEntry | null // 编辑模式时传入
  onSubmit: (data: KnowledgeEntryCreateInput | KnowledgeEntryUpdateInput) => Promise<void>
}

export function EntryForm({ open, onOpenChange, entry, onSubmit }: EntryFormProps) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [topicIds, setTopicIds] = useState<string[]>([])
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([])
  const [isCustomCategory, setIsCustomCategory] = useState(false)

  const isEditMode = !!entry

  // 加载可用主题
  useEffect(() => {
    if (open) {
      fetch('/api/topics')
        .then((res) => res.json())
        .then((topics) => setAvailableTopics(topics))
        .catch((error) => console.error('Failed to load topics:', error))
    }
  }, [open])

  // 初始化表单数据
  useEffect(() => {
    if (entry && open) {
      // 编辑模式：填充所有数据
      setContent(entry.content || '')
      const entryCategory = entry.category || ''
      setCategory(entryCategory)
      // 判断是否是自定义分类
      const isCustom = entryCategory && !Object.values(CategoryEnum).includes(entryCategory as Category)
      setIsCustomCategory(isCustom)
      setTags(entry.tags || [])
      // 确保置信度评分正确设置（可能是 null、undefined 或数字）
      // 编辑模式下，如果没有评分则默认设置为 5
      setConfidenceScore(
        entry.confidence_score !== null && entry.confidence_score !== undefined 
          ? entry.confidence_score 
          : 5
      )
      // 清理并验证 topic_ids，过滤掉无效值
      const validTopicIds = (entry.topic_ids || []).filter((id: any) => {
        if (typeof id !== 'string') return false
        if (id === 'undefined' || id === 'null') return false
        // UUID 格式验证
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(id)
      })
      setTopicIds(validTopicIds)
    } else if (!entry && open) {
      // 新建模式：重置表单
      setContent('')
      setCategory('')
      setIsCustomCategory(false)
      setTags([])
      setTagInput('')
      setConfidenceScore(5) // 新建模式默认设置为 5
      setTopicIds([])
    }
  }, [entry, open])

  const handleTagAdd = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleTagRemove = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      handleTagAdd()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() || !category) {
      return
    }

    setLoading(true)
    try {
      // 构建数据对象，只包含有值的字段
      const data: any = {
        content: content.trim(),
        category: category as Category | string,
      }
      
      // 只有当有标签时才添加
      if (tags.length > 0) {
        data.tags = tags
      }
      
      // 置信度评分处理
      // 新建模式下，如果用户设置了值或使用默认值，都包含该字段
      // 编辑模式下，如果提供了值（包括null），也包含该字段
      if (isEditMode) {
        // 编辑模式：只有当明确设置了值时才包含（允许设置为 null）
        if (confidenceScore !== null && confidenceScore !== undefined) {
          data.confidence_score = confidenceScore
        }
      } else {
        // 新建模式：如果设置了值（包括默认值5），就包含该字段
        if (confidenceScore !== null && confidenceScore !== undefined) {
          data.confidence_score = confidenceScore
        } else {
          // 如果没有设置，使用默认值5
          data.confidence_score = 5
        }
      }
      
      // 清理和验证 topic_ids，确保都是有效的 UUID
      const validTopicIds = topicIds.filter((id) => {
        if (typeof id !== 'string') return false
        if (id === 'undefined' || id === 'null') return false
        // UUID 格式验证
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(id)
      })

      // 只有当有主题时才添加 topic_ids，编辑模式下如果清空主题应该传递空数组
      if (isEditMode) {
        // 编辑模式：总是传递 topic_ids（可以是空数组）
        data.topic_ids = validTopicIds
      } else {
        // 新建模式：只有当有主题时才传递
        if (validTopicIds.length > 0) {
          data.topic_ids = validTopicIds
        }
      }

      await onSubmit(data)
      
      // 重置表单
      setContent('')
      setCategory('')
      setIsCustomCategory(false)
      setTags([])
      setTagInput('')
      setConfidenceScore(5) // 重置为默认值 5
      setTopicIds([])
      
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to submit entry:', error)
      const errorMessage = error instanceof Error ? error.message : '保存失败，请重试'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑信息' : '新建信息'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? '修改知识库条目信息'
              : '添加新的知识库条目，支持分类、标签和置信度评分'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* 主分类 - 支持自定义分类 */}
            <div className="space-y-2">
              <Label htmlFor="category">主分类 *</Label>
              <div className="flex gap-2">
                <Select 
                  value={isCustomCategory ? 'custom' : (category || '')}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setIsCustomCategory(true)
                      setCategory('')
                    } else {
                      setIsCustomCategory(false)
                      setCategory(value as Category)
                    }
                  }}
                >
                  <SelectTrigger id="category" className={isCustomCategory ? 'flex-1' : 'w-full'}>
                    <SelectValue placeholder="选择或输入分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CategoryEnum.INSTITUTIONAL_COST}>
                      {CategoryEnum.INSTITUTIONAL_COST}
                    </SelectItem>
                    <SelectItem value={CategoryEnum.MARKET_NEWS}>
                      {CategoryEnum.MARKET_NEWS}
                    </SelectItem>
                    <SelectItem value={CategoryEnum.RESEARCH_OPINION}>
                      {CategoryEnum.RESEARCH_OPINION}
                    </SelectItem>
                    <SelectItem value={CategoryEnum.MACRO_DATA}>
                      {CategoryEnum.MACRO_DATA}
                    </SelectItem>
                    <SelectItem value={CategoryEnum.PERSONAL_INSIGHT}>
                      {CategoryEnum.PERSONAL_INSIGHT}
                    </SelectItem>
                    <SelectItem value="custom">自定义分类</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomCategory && (
                  <Input
                    type="text"
                    value={category && !Object.values(CategoryEnum).includes(category as Category) ? category : ''}
                    onChange={(e) => {
                      const customCategory = e.target.value.trim()
                      if (customCategory) {
                        setCategory(customCategory as any) // 允许自定义分类
                      } else {
                        setCategory('')
                      }
                    }}
                    placeholder="输入自定义分类"
                    className="flex-1"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                可以从预设分类中选择，或输入自定义分类名称
              </p>
            </div>

            {/* 标签 */}
            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入标签后按回车添加"
                />
                <Button type="button" onClick={handleTagAdd}>
                  添加
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleTagRemove(tag)}
                    >
                      {tag}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 主题选择 */}
            {availableTopics.length > 0 && (
              <div className="space-y-2">
                <Label>主题</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
                  {availableTopics.map((topic) => (
                    <div key={topic.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topic-${topic.id}`}
                        checked={topicIds.includes(topic.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTopicIds([...topicIds, topic.id])
                          } else {
                            setTopicIds(topicIds.filter((id) => id !== topic.id))
                          }
                        }}
                      />
                      <Label
                        htmlFor={`topic-${topic.id}`}
                        className="text-sm font-normal cursor-pointer flex items-center gap-2"
                      >
                        {topic.icon && topic.icon.startsWith('crypto:') ? (
                          <TopicIcon icon={topic.icon} size={16} />
                        ) : (
                          <>
                            {topic.color && (
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: topic.color }}
                              />
                            )}
                            {topic.icon && !topic.icon.startsWith('crypto:') && (
                              <span>{topic.icon}</span>
                            )}
                          </>
                        )}
                        <span>{topic.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 置信度评分 */}
            <div className="space-y-2">
              <Label>置信度评分 (可选)</Label>
              <div className="space-y-2">
                <Slider
                  value={confidenceScore !== null && confidenceScore !== undefined ? [confidenceScore] : [5]}
                  onValueChange={(value) => setConfidenceScore(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>1 (不可靠)</span>
                  <span className="font-medium">
                    {confidenceScore !== null && confidenceScore !== undefined ? `${confidenceScore}/10` : '未评分'}
                  </span>
                  <span>10 (非常可靠)</span>
                </div>
              </div>
            </div>

            {/* 内容 - 支持 Markdown (放在最下面) */}
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="content">内容 * (支持 Markdown)</Label>
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">编辑</TabsTrigger>
                  <TabsTrigger value="preview">预览</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-2">
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="输入信息内容，支持 Markdown 格式..."
                    rows={10}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    支持 Markdown 语法：**粗体**、*斜体*、`代码`、[链接](url) 等
                  </p>
                </TabsContent>
                <TabsContent value="preview" className="mt-2">
                  <div className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-lg bg-muted/50 min-h-[200px]">
                    {content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground text-sm">暂无内容</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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
            <Button type="submit" disabled={loading || !content.trim() || !category}>
              {loading ? '保存中...' : isEditMode ? '保存更改' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

