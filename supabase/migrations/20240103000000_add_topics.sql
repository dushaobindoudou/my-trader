-- 添加主题（Topics）功能
-- 主题用于对知识库条目进行分组管理，方便查看和快速添加到分析上下文

-- 主题表
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- 主题颜色（十六进制，如 #FF5733）
  icon VARCHAR(50), -- 主题图标（可选）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 知识库条目与主题的关联表（多对多关系）
CREATE TABLE IF NOT EXISTS knowledge_entry_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_entry_topic UNIQUE(knowledge_entry_id, topic_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(name);
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_entry_topics_entry_id ON knowledge_entry_topics(knowledge_entry_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entry_topics_topic_id ON knowledge_entry_topics(topic_id);

-- 为 topics 表添加更新时间触发器
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加注释说明
COMMENT ON TABLE topics IS '主题表，用于对知识库条目进行分组管理';
COMMENT ON TABLE knowledge_entry_topics IS '知识库条目与主题的关联表，支持一个条目属于多个主题';
COMMENT ON COLUMN topics.color IS '主题颜色（十六进制），用于UI显示';
COMMENT ON COLUMN topics.icon IS '主题图标名称或emoji';

