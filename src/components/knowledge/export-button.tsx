/**
 * 知识库导出按钮组件
 */

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import type { KnowledgeEntryFilter } from '@/types/knowledge'

interface ExportButtonProps {
  filter?: KnowledgeEntryFilter
}

export function ExportButton({ filter }: ExportButtonProps) {
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams()
      
      if (filter?.category) params.set('category', filter.category)
      if (filter?.tags && filter.tags.length > 0) {
        params.set('tags', filter.tags.join(','))
      }
      if (filter?.topics && filter.topics.length > 0) {
        params.set('topics', filter.topics.join(','))
      }
      if (filter?.startDate) params.set('startDate', filter.startDate)
      if (filter?.endDate) params.set('endDate', filter.endDate)
      if (filter?.search) params.set('search', filter.search)
      if (filter?.confidenceLevel) params.set('confidenceLevel', filter.confidenceLevel)
      
      params.set('export', 'true')
      params.set('format', format)

      const response = await fetch(`/api/knowledge?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('导出失败')
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `knowledge-export-${new Date().toISOString().split('T')[0]}.${format}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // 下载文件
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('导出失败，请重试')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          导出
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="mr-2 h-4 w-4" />
          导出为 JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          导出为 CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

