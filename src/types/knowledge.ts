// 知识库模块类型定义

// 主分类枚举
export enum Category {
  INSTITUTIONAL_COST = '机构成本',
  MARKET_NEWS = '市场新闻',
  RESEARCH_OPINION = '研报观点',
  MACRO_DATA = '宏观数据',
  PERSONAL_INSIGHT = '个人见解',
}

// 置信度等级
export enum ConfidenceLevel {
  HIGH = 'high', // 7-10分
  MEDIUM = 'medium', // 4-6分
  LOW = 'low', // 1-3分
  UNRATED = 'unrated', // 未评分
}

// 知识库条目
export interface KnowledgeEntry {
  id: string
  content: string
  category: Category
  tags: string[]
  confidence_score: number | null // 1-10分制，可选
  created_at: string
  updated_at: string
  topic_ids?: string[] // 关联的主题ID列表
  topics?: Topic[] // 关联的主题对象列表（可选，用于展示）
}

// 创建知识库条目输入
export interface KnowledgeEntryCreateInput {
  content: string
  category: Category | string // 支持自定义分类
  tags?: string[]
  confidence_score?: number | null // 1-10分制，可选
  topic_ids?: string[] // 关联的主题ID列表
}

// 更新知识库条目输入
export interface KnowledgeEntryUpdateInput {
  content?: string
  category?: Category | string // 支持自定义分类
  tags?: string[]
  confidence_score?: number | null
  topic_ids?: string[] // 更新主题关联
}

// 知识库条目筛选条件
export interface KnowledgeEntryFilter {
  category?: Category | string // 支持自定义分类筛选
  tags?: string[] // 多选标签
  topics?: string[] // 多选主题ID
  startDate?: string // ISO 日期字符串
  endDate?: string // ISO 日期字符串
  search?: string // 关键词搜索
  confidenceMin?: number // 置信度最小值
  confidenceMax?: number // 置信度最大值
  confidenceLevel?: ConfidenceLevel // 置信度等级筛选
}

// 知识库条目排序
export interface KnowledgeEntrySort {
  field: 'created_at' | 'updated_at' | 'confidence_score'
  direction: 'asc' | 'desc'
}

// 知识库条目列表查询参数
export interface KnowledgeEntryListParams {
  filter?: KnowledgeEntryFilter
  sort?: KnowledgeEntrySort
  page?: number
  limit?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

