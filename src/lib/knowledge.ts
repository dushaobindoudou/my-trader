/**
 * 知识库相关数据库操作函数
 */

import { createAdminClient } from './supabase/admin'
import type {
  KnowledgeEntry,
  KnowledgeEntryCreateInput,
  KnowledgeEntryUpdateInput,
  KnowledgeEntryFilter,
  KnowledgeEntrySort,
  KnowledgeEntryListParams,
  PaginatedResponse,
} from '@/types/knowledge'
import { ConfidenceLevel } from '@/types/knowledge'

/**
 * 获取知识库条目列表
 * @param params 查询参数，必须包含 user_address 用于数据隔离
 */
export async function getKnowledgeEntries(
  params: KnowledgeEntryListParams = {}
): Promise<PaginatedResponse<KnowledgeEntry>> {
  const { filter = {}, sort, page = 1, limit = 20 } = params
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!filter.user_address) {
    throw new Error('user_address is required for data isolation')
  }

  // 先查询主表，不包含关联表（避免关系查询问题）
  let query = supabase
    .from('knowledge_entries')
    .select('*', { count: 'exact' })
    .eq('user_address', filter.user_address.toLowerCase()) // 数据隔离：只查询当前用户的数据

  // 应用筛选条件
  if (filter.category) {
    query = query.eq('category', filter.category)
  }

  if (filter.tags && filter.tags.length > 0) {
    query = query.contains('tags', filter.tags)
  }

  // 主题筛选需要在获取数据后手动处理（因为关联表查询有问题）
  // 先标记需要主题筛选
  const needsTopicFilter = filter.topics && filter.topics.length > 0

  if (filter.startDate) {
    query = query.gte('created_at', filter.startDate)
  }

  if (filter.endDate) {
    query = query.lte('created_at', filter.endDate)
  }

  if (filter.search) {
    query = query.ilike('content', `%${filter.search}%`)
  }

  // 置信度筛选（如果字段存在）
  if (filter.confidenceLevel) {
    try {
      switch (filter.confidenceLevel) {
        case ConfidenceLevel.HIGH:
          query = query.gte('confidence_score', 7).lte('confidence_score', 10)
          break
        case ConfidenceLevel.MEDIUM:
          query = query.gte('confidence_score', 4).lte('confidence_score', 6)
          break
        case ConfidenceLevel.LOW:
          query = query.gte('confidence_score', 1).lte('confidence_score', 3)
          break
        case ConfidenceLevel.UNRATED:
          query = query.is('confidence_score', null)
          break
      }
    } catch (e) {
      // 如果字段不存在，忽略置信度筛选
      console.warn('⚠️ confidence_score 字段不存在，已跳过置信度筛选')
    }
  } else {
    if (filter.confidenceMin !== undefined) {
      try {
        query = query.gte('confidence_score', filter.confidenceMin)
      } catch (e) {
        console.warn('⚠️ confidence_score 字段不存在，已跳过置信度最小值筛选')
      }
    }
    if (filter.confidenceMax !== undefined) {
      try {
        query = query.lte('confidence_score', filter.confidenceMax)
      } catch (e) {
        console.warn('⚠️ confidence_score 字段不存在，已跳过置信度最大值筛选')
      }
    }
  }

  // 应用排序
  if (sort) {
    query = query.order(sort.field, { ascending: sort.direction === 'asc' })
  } else {
    // 默认按创建时间倒序
    query = query.order('created_at', { ascending: false })
  }

  // 应用分页
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch knowledge entries: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      data: [],
      total: count || 0,
      page,
      limit,
      totalPages: 0,
    }
  }

  // 获取所有条目的ID，用于查询关联表
  const entryIds = data.map((entry: any) => entry.id)

  // 单独查询关联表获取主题关联
  const { data: relations } = await supabase
    .from('knowledge_entry_topics')
    .select('knowledge_entry_id, topic_id')
    .in('knowledge_entry_id', entryIds)

  // 构建 entry_id -> topic_ids 映射
  const entryTopicsMap = new Map<string, string[]>()
  relations?.forEach((rel: any) => {
    const entryId = rel.knowledge_entry_id
    const topicId = rel.topic_id
    if (!entryTopicsMap.has(entryId)) {
      entryTopicsMap.set(entryId, [])
    }
    entryTopicsMap.get(entryId)!.push(topicId)
  })

  // 处理主题关联数据并应用主题筛选
  let entries: KnowledgeEntry[] = (data || []).map((entry: any) => {
    const topic_ids = entryTopicsMap.get(entry.id) || []
    return {
      ...entry,
      topic_ids,
    }
  })

  // 如果设置了主题筛选，在这里应用
  if (needsTopicFilter && filter.topics) {
    entries = entries.filter((entry) => {
      // 检查条目是否有任一匹配的主题
      return entry.topic_ids?.some((tid: string) => filter.topics!.includes(tid))
    })
    // 重新计算总数（如果需要精确分页，可能需要先筛选再分页）
    // 这里简化处理，只筛选结果，不重新计算总数
  }

  const totalPages = count ? Math.ceil(count / limit) : 0

  return {
    data: entries,
    total: count || 0,
    page,
    limit,
    totalPages,
  }
}

/**
 * 获取单个知识库条目
 * @param id 条目 ID
 * @param user_address 用户地址，用于数据隔离验证
 */
export async function getKnowledgeEntryById(
  id: string,
  user_address: string
): Promise<KnowledgeEntry | null> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!user_address) {
    throw new Error('user_address is required for data isolation')
  }

  // 先查询主表，同时验证 user_address
  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase()) // 数据隔离：只查询当前用户的数据
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // 未找到记录
    }
    throw new Error(`Failed to fetch knowledge entry: ${error.message}`)
  }

  // 单独查询关联表获取主题关联
  const { data: relations } = await supabase
    .from('knowledge_entry_topics')
    .select('topic_id')
    .eq('knowledge_entry_id', id)

  // 处理主题关联数据
  const topic_ids = relations?.map((rel: any) => rel.topic_id) || []

  return {
    ...data,
    topic_ids,
  }
}

/**
 * 创建知识库条目
 * @param input 创建输入，必须包含 user_address
 */
export async function createKnowledgeEntry(
  input: KnowledgeEntryCreateInput
): Promise<KnowledgeEntry> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!input.user_address) {
    throw new Error('user_address is required for data isolation')
  }

  const { topic_ids, user_address, ...entryData } = input

  // 准备插入数据，包含所有字段（包括 confidence_score 和 user_address）
  const insertData: any = {
    content: entryData.content,
    category: entryData.category,
    tags: entryData.tags || [],
    user_address: user_address.toLowerCase(), // 数据隔离：设置用户地址
  }

  // 如果提供了 confidence_score，直接包含在插入数据中
  if (entryData.confidence_score !== undefined && entryData.confidence_score !== null) {
    insertData.confidence_score = entryData.confidence_score
  }

  // 创建条目（直接包含 confidence_score）
  let { data, error } = await supabase
    .from('knowledge_entries')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    // 如果错误是关于 confidence_score 字段的，可能是 schema cache 问题
    // 尝试不带 confidence_score 重试
    if (error.message.includes('confidence_score') || error.message.includes('schema cache')) {
      const { confidence_score, ...insertDataWithoutConfidence } = insertData
      const { data: retryData, error: retryError } = await supabase
        .from('knowledge_entries')
        .insert(insertDataWithoutConfidence)
        .select()
        .single()

      if (retryError) {
        // 如果重试仍然失败，检查是否是其他原因
        if (retryError.message.includes('confidence_score')) {
          // 字段真的不存在，提供更友好的错误信息
          throw new Error(
            `创建失败：数据库中没有 'confidence_score' 字段。请运行迁移文件 'supabase/migrations/20240102000000_add_confidence_score.sql' 来添加该字段。`
          )
        }
        throw new Error(`Failed to create knowledge entry: ${retryError.message}`)
      }
      data = retryData
      // 如果字段不存在，只记录警告
      console.warn(
        '⚠️ confidence_score 字段不存在，已跳过设置置信度评分。请运行迁移文件添加该字段。'
      )
    } else {
      throw new Error(`Failed to create knowledge entry: ${error.message}`)
    }
  }

  // 重新获取数据（包含所有字段）
  const finalData = await getKnowledgeEntryById(data.id, user_address)
  if (!finalData) {
    throw new Error('Failed to fetch created entry')
  }

  // 如果有主题关联，创建关联记录
  if (topic_ids && topic_ids.length > 0) {
    // 验证 topic_ids 是否存在
    const { data: existingTopics } = await supabase
      .from('topics')
      .select('id')
      .in('id', topic_ids)

    const validTopicIds = existingTopics?.map((t) => t.id) || []
    const invalidTopicIds = topic_ids.filter((id) => !validTopicIds.includes(id))

    if (invalidTopicIds.length > 0) {
      console.warn('Some topic IDs are invalid:', invalidTopicIds)
    }

    if (validTopicIds.length > 0) {
      const relations = validTopicIds.map((topic_id) => ({
        knowledge_entry_id: data.id,
        topic_id,
      }))

      const { error: relationError } = await supabase
        .from('knowledge_entry_topics')
        .insert(relations)

      if (relationError) {
        console.error('Failed to create topic relations:', relationError)
        // 如果关联创建失败，仍然抛出错误，因为这是用户期望的行为
        throw new Error(`创建主题关联失败: ${relationError.message}`)
      }
    }
  }

  // 返回最终数据（包含所有字段和关联）
  return finalData
}

/**
 * 更新知识库条目
 * @param id 条目 ID
 * @param input 更新输入，必须包含 user_address 用于数据隔离验证
 */
export async function updateKnowledgeEntry(
  id: string,
  input: KnowledgeEntryUpdateInput
): Promise<KnowledgeEntry> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!input.user_address) {
    throw new Error('user_address is required for data isolation')
  }

  // 验证 ID 是否是有效的 UUID
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('Invalid entry ID: id cannot be undefined or null')
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error(`Invalid entry ID format: ${id}`)
  }

  const { user_address, ...updateInput } = input

  // 清理输入数据中的 topic_ids
  const cleanedInput = { ...updateInput }
  if (cleanedInput.topic_ids !== undefined) {
    if (Array.isArray(cleanedInput.topic_ids)) {
      // 过滤掉无效的 UUID
      cleanedInput.topic_ids = cleanedInput.topic_ids.filter((topic_id: any) => {
        if (typeof topic_id !== 'string') return false
        if (topic_id === 'undefined' || topic_id === 'null' || topic_id === '') return false
        return uuidRegex.test(topic_id)
      })
    } else {
      // 如果不是数组，设为 undefined
      delete cleanedInput.topic_ids
    }
  }

  const { topic_ids, ...updateData } = cleanedInput

  // 准备更新数据，只包含需要更新的字段
  const updateFields: any = {}
  
  if (updateData.content !== undefined) {
    updateFields.content = updateData.content
  }
  if (updateData.category !== undefined) {
    updateFields.category = updateData.category
  }
  if (updateData.tags !== undefined) {
    updateFields.tags = updateData.tags
  }
  // 只有当 confidence_score 有值时才添加（如果字段不存在会忽略）
  if (updateData.confidence_score !== undefined && updateData.confidence_score !== null) {
    updateFields.confidence_score = updateData.confidence_score
  } else if (updateData.confidence_score === null) {
    // 允许设置为 null（取消评分）
    updateFields.confidence_score = null
  }

  // 如果没有要更新的字段，直接返回当前数据
  if (Object.keys(updateFields).length === 0 && topic_ids === undefined) {
    const entry = await getKnowledgeEntryById(id, user_address)
    if (!entry) {
      throw new Error('Knowledge entry not found')
    }
    return entry
  }

  // 更新条目，同时验证 user_address（数据隔离）
  const { data, error } = await supabase
    .from('knowledge_entries')
    .update(updateFields)
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase()) // 数据隔离：只更新当前用户的数据
    .select()
    .single()

  if (error) {
    // 如果错误是关于 confidence_score 字段的，可能是字段不存在
    if (error.message.includes('confidence_score') || error.message.includes('schema cache')) {
      // 如果只有 confidence_score 字段需要更新，且字段不存在，则跳过该字段
      if (Object.keys(updateFields).length === 1 && 'confidence_score' in updateFields) {
        console.warn(
          '⚠️ confidence_score 字段不存在，已跳过更新。请运行迁移文件添加该字段。'
        )
        // 返回当前数据，不进行更新
        const entry = await getKnowledgeEntryById(id, user_address)
        if (!entry) {
          throw new Error('Knowledge entry not found')
        }
        return entry
      }
      // 如果有其他字段需要更新，移除 confidence_score 后重试
      const { confidence_score, ...fieldsWithoutConfidence } = updateFields
      const { data: retryData, error: retryError } = await supabase
        .from('knowledge_entries')
        .update(fieldsWithoutConfidence)
        .eq('id', id)
        .select()
        .single()

      if (retryError) {
        throw new Error(`Failed to update knowledge entry: ${retryError.message}`)
      }

      console.warn(
        '⚠️ confidence_score 字段不存在，已跳过更新该字段。请运行迁移文件添加该字段。'
      )

      // 获取更新后的数据
      const entry = await getKnowledgeEntryById(id, user_address)
      return entry!
    }
    throw new Error(`Failed to update knowledge entry: ${error.message}`)
  }

  // 如果有主题关联更新，先删除旧关联，再创建新关联
  if (topic_ids !== undefined) {
    // 删除旧关联
    const { error: deleteError } = await supabase
      .from('knowledge_entry_topics')
      .delete()
      .eq('knowledge_entry_id', id)

    if (deleteError) {
      console.error('Failed to delete old topic relations:', deleteError)
      // 不抛出错误，继续创建新关联
    }

    // 创建新关联（如果 topic_ids 是空数组，则只是删除旧关联，不创建新关联）
    if (topic_ids && Array.isArray(topic_ids) && topic_ids.length > 0) {
      // 验证 topic_ids 都是有效的 UUID 字符串，过滤掉无效值
      const validTopicIds = topic_ids.filter((topic_id) => {
        // 类型检查
        if (typeof topic_id !== 'string') {
          console.warn('Invalid topic_id type:', typeof topic_id, topic_id)
          return false
        }
        // 过滤掉字符串 "undefined" 和 "null"
        if (topic_id === 'undefined' || topic_id === 'null' || topic_id === '') {
          console.warn('Invalid topic_id value:', topic_id)
          return false
        }
        // UUID 格式验证
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(topic_id)) {
          console.warn('Invalid topic_id format:', topic_id)
          return false
        }
        return true
      })

      if (validTopicIds.length > 0) {
        const relations = validTopicIds.map((topic_id) => ({
          knowledge_entry_id: id,
          topic_id,
        }))

        const { error: relationError } = await supabase
          .from('knowledge_entry_topics')
          .insert(relations)

        if (relationError) {
          console.error('Failed to create topic relations:', relationError)
          throw new Error(`创建主题关联失败: ${relationError.message}`)
        }
      }
    }
  }

  // 获取更新后的完整数据（包含主题关联）
  const entry = await getKnowledgeEntryById(id, user_address)
  return entry!
}

/**
 * 删除知识库条目
 * @param id 条目 ID
 * @param user_address 用户地址，用于数据隔离验证
 */
export async function deleteKnowledgeEntry(
  id: string,
  user_address: string
): Promise<void> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!user_address) {
    throw new Error('user_address is required for data isolation')
  }

  // 先验证条目是否属于当前用户
  const { data: entry } = await supabase
    .from('knowledge_entries')
    .select('id')
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase())
    .single()

  if (!entry) {
    throw new Error('Knowledge entry not found or access denied')
  }

  // 删除关联表记录（级联删除会自动处理）
  await supabase
    .from('knowledge_entry_topics')
    .delete()
    .eq('knowledge_entry_id', id)

  // 删除条目
  const { error } = await supabase
    .from('knowledge_entries')
    .delete()
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase()) // 数据隔离：只删除当前用户的数据

  if (error) {
    throw new Error(`Failed to delete knowledge entry: ${error.message}`)
  }
}

/**
 * 导出知识库条目（支持筛选条件）
 * @param filter 筛选条件，必须包含 user_address 用于数据隔离
 */
export async function exportKnowledgeEntries(
  filter?: KnowledgeEntryFilter
): Promise<KnowledgeEntry[]> {
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!filter?.user_address) {
    throw new Error('user_address is required for data isolation')
  }

  // 先查询主表，不包含关联表
  let query = supabase
    .from('knowledge_entries')
    .select('*')
    .eq('user_address', filter.user_address.toLowerCase()) // 数据隔离：只查询当前用户的数据

  // 应用筛选条件（与 getKnowledgeEntries 相同的逻辑）
  if (filter?.category) {
    query = query.eq('category', filter.category)
  }

  if (filter?.tags && filter.tags.length > 0) {
    query = query.contains('tags', filter.tags)
  }

  // 主题筛选需要在获取数据后手动处理
  const needsTopicFilter = filter?.topics && filter.topics.length > 0

  if (filter?.startDate) {
    query = query.gte('created_at', filter.startDate)
  }

  if (filter?.endDate) {
    query = query.lte('created_at', filter.endDate)
  }

  if (filter?.search) {
    query = query.ilike('content', `%${filter.search}%`)
  }

  // 置信度筛选（如果字段不存在，会在后续处理中忽略）
  if (filter?.confidenceLevel) {
    try {
      switch (filter.confidenceLevel) {
        case ConfidenceLevel.HIGH:
          query = query.gte('confidence_score', 7).lte('confidence_score', 10)
          break
        case ConfidenceLevel.MEDIUM:
          query = query.gte('confidence_score', 4).lte('confidence_score', 6)
          break
        case ConfidenceLevel.LOW:
          query = query.gte('confidence_score', 1).lte('confidence_score', 3)
          break
        case ConfidenceLevel.UNRATED:
          query = query.is('confidence_score', null)
          break
      }
    } catch (e) {
      // 如果字段不存在，忽略置信度筛选
      console.warn('confidence_score 字段不存在，已跳过置信度筛选')
    }
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to export knowledge entries: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // 获取所有条目的ID，用于查询关联表
  const entryIds = data.map((entry: any) => entry.id)

  // 单独查询关联表获取主题关联
  const { data: relations } = await supabase
    .from('knowledge_entry_topics')
    .select('knowledge_entry_id, topic_id')
    .in('knowledge_entry_id', entryIds)

  // 构建 entry_id -> topic_ids 映射
  const entryTopicsMap = new Map<string, string[]>()
  relations?.forEach((rel: any) => {
    const entryId = rel.knowledge_entry_id
    const topicId = rel.topic_id
    if (!entryTopicsMap.has(entryId)) {
      entryTopicsMap.set(entryId, [])
    }
    entryTopicsMap.get(entryId)!.push(topicId)
  })

  // 处理主题关联数据并应用主题筛选
  let entries: KnowledgeEntry[] = (data || []).map((entry: any) => {
    const topic_ids = entryTopicsMap.get(entry.id) || []
    return {
      ...entry,
      topic_ids,
    }
  })

  // 如果设置了主题筛选，在这里应用
  if (needsTopicFilter && filter?.topics) {
    entries = entries.filter((entry) => {
      // 检查条目是否有任一匹配的主题
      return entry.topic_ids?.some((tid: string) => filter.topics!.includes(tid))
    })
  }

  return entries
}

