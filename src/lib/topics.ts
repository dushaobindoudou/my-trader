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
 * @param user_address 用户地址，用于数据隔离
 */
export async function getTopics(user_address: string): Promise<TopicWithEntryCount[]> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!user_address) {
    throw new Error('user_address is required for data isolation')
  }

  try {
    // 获取当前用户的所有主题
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .eq('user_address', user_address.toLowerCase()) // 数据隔离：只查询当前用户的数据
      .order('created_at', { ascending: false })

    if (topicsError) {
      // 如果表不存在或其他错误，返回空数组而不是抛出错误
      console.warn('Failed to fetch topics, table may not exist:', topicsError.message)
      return []
    }

    if (!topics || topics.length === 0) {
      return []
    }

    // 获取每个主题的条目数量（只统计当前用户的知识库条目）
    const topicIds = topics.map((t) => t.id)
    
    // 如果 topicIds 为空，直接返回空数组
    if (topicIds.length === 0) {
      return topics.map((topic) => ({
        ...topic,
        entry_count: 0,
      }))
    }

    // 先获取当前用户的所有知识库条目 ID
    const { data: userEntries } = await supabase
      .from('knowledge_entries')
      .select('id')
      .eq('user_address', user_address.toLowerCase())

    const userEntryIds = userEntries?.map((e) => e.id) || []

    // 如果用户没有知识库条目，所有主题的条目数量都是 0
    if (userEntryIds.length === 0) {
      return topics.map((topic) => ({
        ...topic,
        entry_count: 0,
      }))
    }

    // 只统计当前用户的知识库条目与主题的关联
    const { data: entryCounts, error: countError } = await supabase
      .from('knowledge_entry_topics')
      .select('topic_id')
      .in('topic_id', topicIds)
      .in('knowledge_entry_id', userEntryIds) // 只统计当前用户的条目

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
 * @param id 主题 ID
 * @param user_address 用户地址，用于数据隔离验证
 */
export async function getTopicById(
  id: string,
  user_address: string
): Promise<TopicWithEntryCount | null> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!user_address) {
    throw new Error('user_address is required for data isolation')
  }

  const { data: topic, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase()) // 数据隔离：只查询当前用户的数据
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // 未找到记录
    }
    throw new Error(`Failed to fetch topic: ${error.message}`)
  }

  // 获取条目数量（只统计当前用户的知识库条目）
  // 先获取当前用户的所有知识库条目 ID
  const { data: userEntries } = await supabase
    .from('knowledge_entries')
    .select('id')
    .eq('user_address', user_address.toLowerCase())

  const userEntryIds = userEntries?.map((e) => e.id) || []

  let count = 0
  if (userEntryIds.length > 0) {
    const { count: entryCount } = await supabase
      .from('knowledge_entry_topics')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', id)
      .in('knowledge_entry_id', userEntryIds) // 只统计当前用户的条目

    count = entryCount || 0
  }

  return {
    ...topic,
    entry_count: count,
  }
}

/**
 * 创建主题
 * @param input 创建输入，必须包含 user_address
 */
export async function createTopic(input: TopicCreateInput): Promise<Topic> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!input.user_address) {
    throw new Error('user_address is required for data isolation')
  }

  // 检查名称唯一性（在同一用户下）
  const { data: existing } = await supabase
    .from('topics')
    .select('id')
    .eq('name', input.name)
    .eq('user_address', input.user_address.toLowerCase())
    .single()

  if (existing) {
    throw new Error(`主题名称 "${input.name}" 已存在`)
  }

  const { user_address, ...topicData } = input

  const { data, error } = await supabase
    .from('topics')
    .insert({
      ...topicData,
      user_address: user_address.toLowerCase(), // 数据隔离：设置用户地址
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create topic: ${error.message}`)
  }

  return data
}

/**
 * 更新主题
 * @param id 主题 ID
 * @param input 更新输入，必须包含 user_address 用于数据隔离验证
 */
export async function updateTopic(id: string, input: TopicUpdateInput): Promise<Topic> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!input.user_address) {
    throw new Error('user_address is required for data isolation')
  }

  const { user_address, ...updateData } = input

  // 如果更新名称，检查唯一性（在同一用户下）
  if (updateData.name) {
    const { data: existing } = await supabase
      .from('topics')
      .select('id')
      .eq('name', updateData.name)
      .eq('user_address', user_address.toLowerCase())
      .neq('id', id)
      .single()

    if (existing) {
      throw new Error(`主题名称 "${updateData.name}" 已存在`)
    }
  }

  // 更新主题，同时验证 user_address（数据隔离）
  const { data, error } = await supabase
    .from('topics')
    .update(updateData)
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase()) // 数据隔离：只更新当前用户的数据
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update topic: ${error.message}`)
  }

  return data
}

/**
 * 删除主题（级联删除关联表记录）
 * @param id 主题 ID
 * @param user_address 用户地址，用于数据隔离验证
 */
export async function deleteTopic(id: string, user_address: string): Promise<void> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!user_address) {
    throw new Error('user_address is required for data isolation')
  }

  // 先验证主题是否属于当前用户
  const { data: topic } = await supabase
    .from('topics')
    .select('id')
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase())
    .single()

  if (!topic) {
    throw new Error('Topic not found or access denied')
  }

  // 删除关联表记录（级联删除会自动处理）
  await supabase.from('knowledge_entry_topics').delete().eq('topic_id', id)

  // 删除主题
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase()) // 数据隔离：只删除当前用户的数据

  if (error) {
    throw new Error(`Failed to delete topic: ${error.message}`)
  }
}

/**
 * 获取主题下的所有条目ID列表
 * @param topicId 主题 ID
 * @param user_address 用户地址，用于数据隔离验证
 */
export async function getTopicEntryIds(
  topicId: string,
  user_address: string
): Promise<string[]> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!user_address) {
    throw new Error('user_address is required for data isolation')
  }

  // 先验证主题是否属于当前用户
  const { data: topic } = await supabase
    .from('topics')
    .select('id')
    .eq('id', topicId)
    .eq('user_address', user_address.toLowerCase())
    .single()

  if (!topic) {
    throw new Error('Topic not found or access denied')
  }

  // 获取当前用户的所有知识库条目 ID
  const { data: userEntries } = await supabase
    .from('knowledge_entries')
    .select('id')
    .eq('user_address', user_address.toLowerCase())

  const userEntryIds = userEntries?.map((e) => e.id) || []

  if (userEntryIds.length === 0) {
    return []
  }

  // 只返回当前用户的条目
  const { data, error } = await supabase
    .from('knowledge_entry_topics')
    .select('knowledge_entry_id')
    .eq('topic_id', topicId)
    .in('knowledge_entry_id', userEntryIds) // 只查询当前用户的条目

  if (error) {
    throw new Error(`Failed to fetch topic entries: ${error.message}`)
  }

  return data?.map((item) => item.knowledge_entry_id) || []
}

/**
 * 批量添加条目到主题
 * @param topicId 主题 ID
 * @param entryIds 条目 ID 列表
 * @param user_address 用户地址，用于数据隔离验证
 */
export async function addEntriesToTopic(
  topicId: string,
  entryIds: string[],
  user_address: string
): Promise<void> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!user_address) {
    throw new Error('user_address is required for data isolation')
  }

  if (entryIds.length === 0) {
    return
  }

  // 先验证主题是否属于当前用户
  const { data: topic } = await supabase
    .from('topics')
    .select('id')
    .eq('id', topicId)
    .eq('user_address', user_address.toLowerCase())
    .single()

  if (!topic) {
    throw new Error('Topic not found or access denied')
  }

  // 验证所有条目都属于当前用户
  const { data: userEntries } = await supabase
    .from('knowledge_entries')
    .select('id')
    .eq('user_address', user_address.toLowerCase())
    .in('id', entryIds)

  const validEntryIds = userEntries?.map((e) => e.id) || []
  const invalidEntryIds = entryIds.filter((id) => !validEntryIds.includes(id))

  if (invalidEntryIds.length > 0) {
    throw new Error(`Some entries do not belong to the current user: ${invalidEntryIds.join(', ')}`)
  }

  // 检查哪些条目已经关联
  const { data: existing } = await supabase
    .from('knowledge_entry_topics')
    .select('knowledge_entry_id')
    .eq('topic_id', topicId)
    .in('knowledge_entry_id', validEntryIds)

  const existingIds = new Set(existing?.map((item) => item.knowledge_entry_id) || [])

  // 只添加未关联的条目
  const newEntries = validEntryIds
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
 * @param topicId 主题 ID
 * @param entryId 条目 ID
 * @param user_address 用户地址，用于数据隔离验证
 */
export async function removeEntryFromTopic(
  topicId: string,
  entryId: string,
  user_address: string
): Promise<void> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!user_address) {
    throw new Error('user_address is required for data isolation')
  }

  // 先验证主题是否属于当前用户
  const { data: topic } = await supabase
    .from('topics')
    .select('id')
    .eq('id', topicId)
    .eq('user_address', user_address.toLowerCase())
    .single()

  if (!topic) {
    throw new Error('Topic not found or access denied')
  }

  // 验证条目是否属于当前用户
  const { data: entry } = await supabase
    .from('knowledge_entries')
    .select('id')
    .eq('id', entryId)
    .eq('user_address', user_address.toLowerCase())
    .single()

  if (!entry) {
    throw new Error('Entry not found or access denied')
  }

  const { error } = await supabase
    .from('knowledge_entry_topics')
    .delete()
    .eq('topic_id', topicId)
    .eq('knowledge_entry_id', entryId)

  if (error) {
    throw new Error(`Failed to remove entry from topic: ${error.message}`)
  }
}

