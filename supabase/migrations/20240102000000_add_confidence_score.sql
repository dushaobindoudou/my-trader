-- 为 knowledge_entries 表添加置信度评分字段
-- 置信度评分：1-10 分制，用于评估信息的可靠程度

-- 添加置信度评分字段
ALTER TABLE knowledge_entries 
ADD COLUMN IF NOT EXISTS confidence_score INTEGER 
CHECK (confidence_score IS NULL OR (confidence_score >= 1 AND confidence_score <= 10));

-- 添加索引以便按置信度筛选和排序
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_confidence_score 
ON knowledge_entries(confidence_score) 
WHERE confidence_score IS NOT NULL;

-- 添加注释说明
COMMENT ON COLUMN knowledge_entries.confidence_score IS '置信度评分，1-10分制，1表示不可靠，10表示非常可靠。NULL表示未评分';

