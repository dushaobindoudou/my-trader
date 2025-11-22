'use client'

import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Main } from "@/components/layout/main"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { KnowledgeNav } from "@/components/knowledge/knowledge-nav"
import { EntryList } from "@/components/knowledge/entry-list"
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { TopicWithEntryCount } from '@/types/topic'
import type { KnowledgeEntryFilter } from '@/types/knowledge'

export default function TopicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.id as string

  const [topic, setTopic] = useState<TopicWithEntryCount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopic()
  }, [topicId])

  const fetchTopic = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/topics/${topicId}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/knowledge/topics')
          return
        }
        throw new Error('Failed to fetch topic')
      }
      const data = await response.json()
      setTopic(data)
    } catch (error) {
      console.error('Failed to fetch topic:', error)
    } finally {
      setLoading(false)
    }
  }

  // 筛选条件：只显示该主题下的条目
  const filter: KnowledgeEntryFilter = {
    topics: [topicId],
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <Main>
          <div className="mb-6">
            <Button variant="ghost" size="sm" disabled>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回投资主题
            </Button>
          </div>
          <div className="mb-6">
            <KnowledgeNav />
          </div>
          <Card>
            <CardContent className="py-12">
              <p className="text-muted-foreground text-center">加载中...</p>
            </CardContent>
          </Card>
        </Main>
      </AuthenticatedLayout>
    )
  }

  if (!topic) {
    return (
      <AuthenticatedLayout>
        <Main>
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/knowledge/topics')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回投资主题
            </Button>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">主题不存在</p>
            </CardContent>
          </Card>
        </Main>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/knowledge/topics')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回投资主题
          </Button>
        </div>

        {/* 主题信息 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              {topic.color && (
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: topic.color }}
                />
              )}
              {topic.icon && <span className="text-2xl">{topic.icon}</span>}
              <div className="flex-1">
                <CardTitle className="text-2xl">{topic.name}</CardTitle>
                {topic.description && (
                  <CardDescription className="mt-2">
                    {topic.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {topic.entry_count} 个条目
            </Badge>
          </CardContent>
        </Card>

        {/* 二级导航 */}
        <div className="mb-6">
          <KnowledgeNav />
        </div>

        {/* 该主题下的条目列表 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">条目列表</h2>
          <EntryList filter={filter} />
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}

