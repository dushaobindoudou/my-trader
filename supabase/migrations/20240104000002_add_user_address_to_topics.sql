-- 为 topics 表添加 user_address 字段
-- 用于根据 Web3 地址隔离不同用户的主题数据

-- 为 topics 表添加 user_address 字段
ALTER TABLE topics 
ADD COLUMN IF NOT EXISTS user_address VARCHAR(100);

-- 创建索引以便快速查询特定用户的主题
CREATE INDEX IF NOT EXISTS idx_topics_user_address 
ON topics(user_address);

-- 修改唯一约束：主题名称在同一用户下唯一（而不是全局唯一）
-- 先删除旧的唯一约束
ALTER TABLE topics 
DROP CONSTRAINT IF EXISTS topics_name_key;

-- 创建新的唯一约束：同一用户下的主题名称唯一
CREATE UNIQUE INDEX IF NOT EXISTS unique_topic_name_per_user 
ON topics(user_address, name) 
WHERE user_address IS NOT NULL;

-- 添加注释说明
COMMENT ON COLUMN topics.user_address IS '用户 Web3 地址，用于数据隔离';

