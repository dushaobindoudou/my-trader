/**
 * 知识库筛选栏组件（放在头部）
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Filter, ChevronDown } from 'lucide-react'
import type { KnowledgeEntryFilter, Category } from '@/types/knowledge'
import { Category as CategoryEnum, ConfidenceLevel } from '@/types/knowledge'

interface FilterBarProps {
  filter: KnowledgeEntryFilter
  onFilterChange: (filter: KnowledgeEntryFilter) => void
  availableTags?: string[]
  availableTopics?: Array<{ id: string; name: string }>
}

export function FilterBar({
  filter,
  onFilterChange,
  availableTags = [],
  availableTopics = [],
}: FilterBarProps) {
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

  const activeFiltersCount =
    (filter.category ? 1 : 0) +
    (filter.tags?.length || 0) +
    (filter.topics?.length || 0) +
    (filter.confidenceLevel ? 1 : 0) +
    (filter.startDate ? 1 : 0) +
    (filter.endDate ? 1 : 0)

  const hasActiveFilters = activeFiltersCount > 0

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 分类筛选 */}
      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">分类:</Label>
        <Select
          value={filter.category || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="全部" />
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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-1" />
              标签
              {filter.tags && filter.tags.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filter.tags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">标签筛选</Label>
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
          </PopoverContent>
        </Popover>
      )}

      {/* 主题筛选 */}
      {availableTopics.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-1" />
              主题
              {filter.topics && filter.topics.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filter.topics.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">主题筛选</Label>
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
          </PopoverContent>
        </Popover>
      )}

      {/* 置信度筛选 */}
      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">置信度:</Label>
        <Select
          value={filter.confidenceLevel || 'all'}
          onValueChange={handleConfidenceLevelChange}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="全部" />
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

      {/* 时间范围 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="h-4 w-4 mr-1" />
            时间范围
            {(filter.startDate || filter.endDate) && (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto" align="start">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">时间范围</Label>
            <div className="flex gap-2">
              <div className="space-y-1">
                <Label className="text-xs">开始日期</Label>
                <Input
                  type="date"
                  value={filter.startDate || ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...filter,
                      startDate: e.target.value || undefined,
                    })
                  }
                  className="w-auto"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">结束日期</Label>
                <Input
                  type="date"
                  value={filter.endDate || ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...filter,
                      endDate: e.target.value || undefined,
                    })
                  }
                  className="w-auto"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* 已选筛选条件显示 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1 flex-wrap">
          {filter.category && (
            <Badge variant="secondary" className="gap-1">
              {filter.category}
              <button
                onClick={() =>
                  onFilterChange({
                    ...filter,
                    category: undefined,
                  })
                }
                className="ml-1 hover:bg-secondary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filter.tags && filter.tags.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              标签: {filter.tags.length}
              <button
                onClick={() => {
                  setSelectedTags([])
                  onFilterChange({
                    ...filter,
                    tags: undefined,
                  })
                }}
                className="ml-1 hover:bg-secondary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filter.topics && filter.topics.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              主题: {filter.topics.length}
              <button
                onClick={() => {
                  setSelectedTopics([])
                  onFilterChange({
                    ...filter,
                    topics: undefined,
                  })
                }}
                className="ml-1 hover:bg-secondary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filter.confidenceLevel && (
            <Badge variant="secondary" className="gap-1">
              置信度: {filter.confidenceLevel}
              <button
                onClick={() =>
                  onFilterChange({
                    ...filter,
                    confidenceLevel: undefined,
                  })
                }
                className="ml-1 hover:bg-secondary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filter.startDate || filter.endDate) && (
            <Badge variant="secondary" className="gap-1">
              时间范围
              <button
                onClick={() =>
                  onFilterChange({
                    ...filter,
                    startDate: undefined,
                    endDate: undefined,
                  })
                }
                className="ml-1 hover:bg-secondary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-7">
            清除全部
          </Button>
        </div>
      )}
    </div>
  )
}

