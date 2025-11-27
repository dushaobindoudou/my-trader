-- 添加用户地址字段到知识库条目表
-- 用于根据 Web3 地址隔离不同用户的数据

-- 为 knowledge_entries 表添加 user_address 字段
ALTER TABLE knowledge_entries 
ADD COLUMN IF NOT EXISTS user_address VARCHAR(100);

-- 创建索引以便快速查询特定用户的数据
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_user_address 
ON knowledge_entries(user_address);

-- 添加注释说明
COMMENT ON COLUMN knowledge_entries.user_address IS '用户 Web3 地址，用于数据隔离';

-- 为其他需要数据隔离的表也添加 user_address 字段
-- 分析历史表
ALTER TABLE analysis_history 
ADD COLUMN IF NOT EXISTS user_address VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_analysis_history_user_address 
ON analysis_history(user_address);

-- 投资决策表
ALTER TABLE trade_records 
ADD COLUMN IF NOT EXISTS user_address VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_trade_records_user_address 
ON trade_records(user_address);

-- 观察标的表
ALTER TABLE watchlist 
ADD COLUMN IF NOT EXISTS user_address VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_address 
ON watchlist(user_address);

-- 资产组合表
ALTER TABLE asset_portfolio 
ADD COLUMN IF NOT EXISTS user_address VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_asset_portfolio_user_address 
ON asset_portfolio(user_address);

-- 现金记录表
ALTER TABLE cash_transactions 
ADD COLUMN IF NOT EXISTS user_address VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_address 
ON cash_transactions(user_address);

-- 添加注释
COMMENT ON COLUMN analysis_history.user_address IS '用户 Web3 地址，用于数据隔离';
COMMENT ON COLUMN trade_records.user_address IS '用户 Web3 地址，用于数据隔离';
COMMENT ON COLUMN watchlist.user_address IS '用户 Web3 地址，用于数据隔离';
COMMENT ON COLUMN asset_portfolio.user_address IS '用户 Web3 地址，用于数据隔离';
COMMENT ON COLUMN cash_transactions.user_address IS '用户 Web3 地址，用于数据隔离';

