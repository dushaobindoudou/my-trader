/**
 * 知识库模块布局
 * 提供二级导航（全部/主题）
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BookOpen, FolderKanban } from 'lucide-react'
import Link from 'next/link'

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

