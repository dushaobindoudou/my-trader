// 主题模块类型定义

// 主题
export interface Topic {
  id: string
  name: string
  description?: string | null
  color?: string | null // 十六进制颜色，如 #FF5733
  icon?: string | null // 图标名称或emoji
  created_at: string
  updated_at: string
  entry_count?: number // 条目数量（可选，用于展示）
}

// 创建主题输入
export interface TopicCreateInput {
  name: string
  description?: string
  color?: string
  icon?: string
}

// 更新主题输入
export interface TopicUpdateInput {
  name?: string
  description?: string
  color?: string
  icon?: string
}

// 主题与条目数量（用于列表展示）
export interface TopicWithEntryCount extends Topic {
  entry_count: number
}

