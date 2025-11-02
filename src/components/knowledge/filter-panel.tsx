/**
 * 知识库筛选面板组件
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import type { KnowledgeEntryFilter, Category } from '@/types/knowledge'
import { Category as CategoryEnum, ConfidenceLevel } from '@/types/knowledge'

interface FilterPanelProps {
  filter: KnowledgeEntryFilter
  onFilterChange: (filter: KnowledgeEntryFilter) => void
  availableTags?: string[]
  availableTopics?: Array<{ id: string; name: string }>
}

export function FilterPanel({
  filter,
  onFilterChange,
  availableTags = [],
  availableTopics = [],
}: FilterPanelProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(filter.tags || [])
  const [selectedTopics, setSelectedTopics] = useState<string[]>(filter.topics || [])

  const handleCategoryChange = (value: string) => {
    onFilterChange({
      ...filter,
      category: value === 'all' ? undefined : (value as Category),
    })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(newTags)
    onFilterChange({
      ...filter,
      tags: newTags.length > 0 ? newTags : undefined,
    })
  }

  const handleTopicToggle = (topicId: string) => {
    const newTopics = selectedTopics.includes(topicId)
      ? selectedTopics.filter((t) => t !== topicId)
      : [...selectedTopics, topicId]
    setSelectedTopics(newTopics)
    onFilterChange({
      ...filter,
      topics: newTopics.length > 0 ? newTopics : undefined,
    })
  }

  const handleConfidenceLevelChange = (value: string) => {
    onFilterChange({
      ...filter,
      confidenceLevel: value === 'all' ? undefined : (value as ConfidenceLevel),
      confidenceMin: undefined,
      confidenceMax: undefined,
    })
  }

  const handleReset = () => {
    setSelectedTags([])
    setSelectedTopics([])
    onFilterChange({})
  }

  const hasActiveFilters = !!(
    filter.category ||
    filter.tags?.length ||
    filter.topics?.length ||
    filter.confidenceLevel ||
    filter.startDate ||
    filter.endDate
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">筛选</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="h-4 w-4 mr-1" />
              重置
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 主分类筛选 */}
        <div className="space-y-2">
          <Label>主分类</Label>
          <Select
            value={filter.category || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
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
            </SelectContent>
          </Select>
        </div>

        {/* 标签筛选 */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <Label>标签</Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {availableTags.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <Label
                    htmlFor={`tag-${tag}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 主题筛选 */}
        {availableTopics.length > 0 && (
          <div className="space-y-2">
            <Label>主题</Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {availableTopics.map((topic) => (
                <div key={topic.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`topic-${topic.id}`}
                    checked={selectedTopics.includes(topic.id)}
                    onCheckedChange={() => handleTopicToggle(topic.id)}
                  />
                  <Label
                    htmlFor={`topic-${topic.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {topic.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 置信度筛选 */}
        <div className="space-y-2">
          <Label>置信度</Label>
          <Select
            value={filter.confidenceLevel || 'all'}
            onValueChange={handleConfidenceLevelChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择置信度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value={ConfidenceLevel.HIGH}>高 (7-10分)</SelectItem>
              <SelectItem value={ConfidenceLevel.MEDIUM}>中 (4-6分)</SelectItem>
              <SelectItem value={ConfidenceLevel.LOW}>低 (1-3分)</SelectItem>
              <SelectItem value={ConfidenceLevel.UNRATED}>未评分</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 时间范围筛选 */}
        <div className="space-y-2">
          <Label>时间范围</Label>
          <div className="space-y-2">
            <Input
              type="date"
              value={filter.startDate || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  startDate: e.target.value || undefined,
                })
              }
              placeholder="开始日期"
            />
            <Input
              type="date"
              value={filter.endDate || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  endDate: e.target.value || undefined,
                })
              }
              placeholder="结束日期"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

