/**
 * 主题相关数据库操作函数
 */

import { createAdminClient } from './supabase/admin'
import type {
  Topic,
  TopicCreateInput,
  TopicUpdateInput,
  TopicWithEntryCount,
} from '@/types/topic'

/**
 * 获取所有主题（包含条目数量）
 */
export async function getTopics(): Promise<TopicWithEntryCount[]> {
  const supabase = createAdminClient()

  try {
    // 获取所有主题
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: false })

    if (topicsError) {
      // 如果表不存在或其他错误，返回空数组而不是抛出错误
      console.warn('Failed to fetch topics, table may not exist:', topicsError.message)
      return []
    }

    if (!topics || topics.length === 0) {
      return []
    }

    // 获取每个主题的条目数量
    const topicIds = topics.map((t) => t.id)
    
    // 如果 topicIds 为空，直接返回空数组
    if (topicIds.length === 0) {
      return topics.map((topic) => ({
        ...topic,
        entry_count: 0,
      }))
    }

    const { data: entryCounts, error: countError } = await supabase
      .from('knowledge_entry_topics')
      .select('topic_id')
      .in('topic_id', topicIds)

    if (countError) {
      // 如果关联表不存在或为空，只记录错误但不抛出，返回条目数量为0
      console.warn('Failed to fetch entry counts:', countError.message)
      return topics.map((topic) => ({
        ...topic,
        entry_count: 0,
      }))
    }

    // 计算每个主题的条目数量
    const countMap = new Map<string, number>()
    entryCounts?.forEach((item) => {
      const topicId = item.topic_id
      countMap.set(topicId, (countMap.get(topicId) || 0) + 1)
    })

    // 组合结果
    return topics.map((topic) => ({
      ...topic,
      entry_count: countMap.get(topic.id) || 0,
    }))
  } catch (error) {
    // 捕获任何未预期的错误
    console.error('Unexpected error in getTopics:', error)
    // 返回空数组而不是抛出错误，这样前端不会崩溃
    return []
  }
}

/**
 * 获取单个主题详情（包含条目列表）
 */
export async function getTopicById(id: string): Promise<TopicWithEntryCount | null> {
  const supabase = createAdminClient()

  const { data: topic, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // 未找到记录
    }
    throw new Error(`Failed to fetch topic: ${error.message}`)
  }

  // 获取条目数量
  const { count } = await supabase
    .from('knowledge_entry_topics')
    .select('*', { count: 'exact', head: true })
    .eq('topic_id', id)

  return {
    ...topic,
    entry_count: count || 0,
  }
}

/**
 * 创建主题
 */
export async function createTopic(input: TopicCreateInput): Promise<Topic> {
  const supabase = createAdminClient()

  // 检查名称唯一性
  const { data: existing } = await supabase
    .from('topics')
    .select('id')
    .eq('name', input.name)
    .single()

  if (existing) {
    throw new Error(`主题名称 "${input.name}" 已存在`)
  }

  const { data, error } = await supabase
    .from('topics')
    .insert(input)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create topic: ${error.message}`)
  }

  return data
}

/**
 * 更新主题
 */
export async function updateTopic(id: string, input: TopicUpdateInput): Promise<Topic> {
  const supabase = createAdminClient()

  // 如果更新名称，检查唯一性
  if (input.name) {
    const { data: existing } = await supabase
      .from('topics')
      .select('id')
      .eq('name', input.name)
      .neq('id', id)
      .single()

    if (existing) {
      throw new Error(`主题名称 "${input.name}" 已存在`)
    }
  }

  const { data, error } = await supabase
    .from('topics')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update topic: ${error.message}`)
  }

  return data
}

/**
 * 删除主题（级联删除关联表记录）
 */
export async function deleteTopic(id: string): Promise<void> {
  const supabase = createAdminClient()

  // 删除关联表记录（级联删除会自动处理）
  await supabase.from('knowledge_entry_topics').delete().eq('topic_id', id)

  // 删除主题
  const { error } = await supabase.from('topics').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete topic: ${error.message}`)
  }
}

/**
 * 获取主题下的所有条目ID列表
 */
export async function getTopicEntryIds(topicId: string): Promise<string[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('knowledge_entry_topics')
    .select('knowledge_entry_id')
    .eq('topic_id', topicId)

  if (error) {
    throw new Error(`Failed to fetch topic entries: ${error.message}`)
  }

  return data?.map((item) => item.knowledge_entry_id) || []
}

/**
 * 批量添加条目到主题
 */
export async function addEntriesToTopic(
  topicId: string,
  entryIds: string[]
): Promise<void> {
  const supabase = createAdminClient()

  if (entryIds.length === 0) {
    return
  }

  // 检查哪些条目已经关联
  const { data: existing } = await supabase
    .from('knowledge_entry_topics')
    .select('knowledge_entry_id')
    .eq('topic_id', topicId)
    .in('knowledge_entry_id', entryIds)

  const existingIds = new Set(existing?.map((item) => item.knowledge_entry_id) || [])

  // 只添加未关联的条目
  const newEntries = entryIds
    .filter((id) => !existingIds.has(id))
    .map((entryId) => ({
      topic_id: topicId,
      knowledge_entry_id: entryId,
    }))

  if (newEntries.length > 0) {
    const { error } = await supabase
      .from('knowledge_entry_topics')
      .insert(newEntries)

    if (error) {
      throw new Error(`Failed to add entries to topic: ${error.message}`)
    }
  }
}

/**
 * 从主题中移除条目
 */
export async function removeEntryFromTopic(
  topicId: string,
  entryId: string
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('knowledge_entry_topics')
    .delete()
    .eq('topic_id', topicId)
    .eq('knowledge_entry_id', entryId)

  if (error) {
    throw new Error(`Failed to remove entry from topic: ${error.message}`)
  }
}

