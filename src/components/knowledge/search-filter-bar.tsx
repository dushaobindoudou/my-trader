/**
 * 知识库搜索和过滤组合栏组件
 */

'use client'

import { useState, useEffect } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/date-picker'
import { X, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import type { KnowledgeEntryFilter, Category } from '@/types/knowledge'
import { Category as CategoryEnum, ConfidenceLevel } from '@/types/knowledge'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filter: KnowledgeEntryFilter
  onFilterChange: (filter: KnowledgeEntryFilter) => void
  availableTags?: string[]
  availableTopics?: Array<{ id: string; name: string }>
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  availableTags = [],
  availableTopics = [],
}: SearchFilterBarProps) {
  const [searchValue, setSearchValue] = useState(searchQuery)
  const [selectedTags, setSelectedTags] = useState<string[]>(filter.tags || [])
  const [selectedTopics, setSelectedTopics] = useState<string[]>(filter.topics || [])

  const debouncedSearchValue = useDebounce(searchValue, 300)

  useEffect(() => {
    onSearchChange(debouncedSearchValue)
  }, [debouncedSearchValue, onSearchChange])

  useEffect(() => {
    setSearchValue(searchQuery)
  }, [searchQuery])

  const handleClearAll = () => {
    setSearchValue('')
    onSearchChange('')
    setSelectedTags([])
    setSelectedTopics([])
    onFilterChange({})
  }

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

  const handleStartDateSelect = (date: Date | undefined) => {
    onFilterChange({
      ...filter,
      startDate: date ? format(date, 'yyyy-MM-dd') : undefined,
    })
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    onFilterChange({
      ...filter,
      endDate: date ? format(date, 'yyyy-MM-dd') : undefined,
    })
  }

  const startDate = filter.startDate ? new Date(filter.startDate) : undefined
  const endDate = filter.endDate ? new Date(filter.endDate) : undefined

  const activeFiltersCount =
    (filter.category ? 1 : 0) +
    (filter.tags?.length || 0) +
    (filter.topics?.length || 0) +
    (filter.confidenceLevel ? 1 : 0) +
    (filter.startDate ? 1 : 0) +
    (filter.endDate ? 1 : 0)

  const hasActiveFilters = activeFiltersCount > 0 || searchValue.length > 0

  return (
    <div className="space-y-3">
      {/* 主搜索和过滤行 */}
      <div className="flex items-center gap-2">
        {/* 搜索框 */}
        <div className="relative w-[300px] flex-shrink-0">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="搜索内容..."
            className="pl-8 pr-8 h-9 text-sm"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setSearchValue('')
                onSearchChange('')
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* 分类筛选 */}
        <div className="flex items-center gap-1">
          <Select
            value={filter.category || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
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

        {/* 置信度筛选 */}
        <div className="flex items-center gap-1">
          <Select
            value={filter.confidenceLevel || 'all'}
            onValueChange={handleConfidenceLevelChange}
          >
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="置信度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部置信度</SelectItem>
              <SelectItem value={ConfidenceLevel.HIGH}>高 (7-10分)</SelectItem>
              <SelectItem value={ConfidenceLevel.MEDIUM}>中 (4-6分)</SelectItem>
              <SelectItem value={ConfidenceLevel.LOW}>低 (1-3分)</SelectItem>
              <SelectItem value={ConfidenceLevel.UNRATED}>未评分</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 标签筛选 */}
        {availableTags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-sm flex-shrink-0">
                <Filter className="h-3 w-3 mr-1" />
                标签
                {filter.tags && filter.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">
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
                        className="text-sm font-normal cursor-pointer flex-1"
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
              <Button variant="outline" size="sm" className="h-9 text-sm flex-shrink-0">
                <Filter className="h-3 w-3 mr-1" />
                主题
                {filter.topics && filter.topics.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">
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
                        className="text-sm font-normal cursor-pointer flex-1"
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


        {/* 日期范围 - 开始日期 */}
        <div className="flex-shrink-0 [&_button]:h-9 [&_button]:text-sm [&_button]:w-[140px] [&_button]:px-3">
          <DatePicker
            selected={startDate}
            onSelect={handleStartDateSelect}
            placeholder="开始日期"
          />
        </div>

        {/* 日期范围 - 结束日期 */}
        <div className="flex-shrink-0 [&_button]:h-9 [&_button]:text-sm [&_button]:w-[140px] [&_button]:px-3">
          <DatePicker
            selected={endDate}
            onSelect={handleEndDateSelect}
            placeholder="结束日期"
          />
        </div>

        {/* 清空按钮 */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-9 text-sm flex-shrink-0"
          >
            <X className="h-3 w-3 mr-1" />
            清空
          </Button>
        )}
      </div>

      {/* 已选筛选条件显示 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {filter.category && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filter.category}
              <button
                onClick={() =>
                  onFilterChange({
                    ...filter,
                    category: undefined,
                  })
                }
                className="ml-0.5 hover:bg-secondary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filter.tags && filter.tags.length > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              标签: {filter.tags.length}
              <button
                onClick={() => {
                  setSelectedTags([])
                  onFilterChange({
                    ...filter,
                    tags: undefined,
                  })
                }}
                className="ml-0.5 hover:bg-secondary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filter.topics && filter.topics.length > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              主题: {filter.topics.length}
              <button
                onClick={() => {
                  setSelectedTopics([])
                  onFilterChange({
                    ...filter,
                    topics: undefined,
                  })
                }}
                className="ml-0.5 hover:bg-secondary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filter.confidenceLevel && (
            <Badge variant="secondary" className="gap-1 text-xs">
              置信度: {filter.confidenceLevel}
              <button
                onClick={() =>
                  onFilterChange({
                    ...filter,
                    confidenceLevel: undefined,
                  })
                }
                className="ml-0.5 hover:bg-secondary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {searchValue && (
            <Badge variant="secondary" className="gap-1 text-xs">
              搜索: {searchValue}
              <button
                onClick={() => {
                  setSearchValue('')
                  onSearchChange('')
                }}
                className="ml-0.5 hover:bg-secondary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

