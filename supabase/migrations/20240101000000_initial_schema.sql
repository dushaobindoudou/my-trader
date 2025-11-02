-- 初始数据库 schema
-- 从 Prisma schema 迁移到 Supabase

-- 启用必要的扩展
-- Supabase 使用 PostgreSQL 内置的 gen_random_uuid()，不需要 uuid-ossp
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 信息条目表
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_entries_category ON knowledge_entries(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_tags ON knowledge_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_created_at ON knowledge_entries(created_at);

-- LLM配置表
CREATE TABLE IF NOT EXISTS llm_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  api_url VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent配置表
CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_configs_is_default ON agent_configs(is_default);
CREATE INDEX IF NOT EXISTS idx_agent_configs_is_active ON agent_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_configs_created_at ON agent_configs(created_at);

-- 分析历史表
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  context_ids TEXT[] DEFAULT '{}',
  agent_config_id UUID NOT NULL,
  responses JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_history_context_ids ON analysis_history USING GIN(context_ids);
CREATE INDEX IF NOT EXISTS idx_analysis_history_agent_config_id ON analysis_history(agent_config_id);

-- 投资决策表
CREATE TABLE IF NOT EXISTS trade_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  price DECIMAL(15, 4),
  quantity DECIMAL(15, 6),
  reason TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_trade_records_asset ON trade_records(asset);
CREATE INDEX IF NOT EXISTS idx_trade_records_created_at ON trade_records(created_at);

-- 观察标的表
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  target_price DECIMAL(15, 4),
  current_price DECIMAL(15, 4),
  status VARCHAR(20) NOT NULL DEFAULT '观察中',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_watchlist_asset ON watchlist(asset);
CREATE INDEX IF NOT EXISTS idx_watchlist_status ON watchlist(status);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON watchlist(created_at);

-- 资产组合表
CREATE TABLE IF NOT EXISTS asset_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset VARCHAR(50) NOT NULL,
  asset_type VARCHAR(20) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  avg_cost_price DECIMAL(15, 4) NOT NULL,
  current_price DECIMAL(15, 4),
  total_cost DECIMAL(15, 2) NOT NULL,
  current_value DECIMAL(15, 2),
  unrealized_pnl DECIMAL(15, 2),
  realized_pnl DECIMAL(15, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_portfolio_asset ON asset_portfolio(asset);
CREATE INDEX IF NOT EXISTS idx_asset_portfolio_asset_type ON asset_portfolio(asset_type);
CREATE INDEX IF NOT EXISTS idx_asset_portfolio_updated_at ON asset_portfolio(updated_at);

-- 现金记录表
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency VARCHAR(10) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_currency ON cash_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_transaction_type ON cash_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_created_at ON cash_transactions(created_at);

-- 链上资产定义表（支持原生与 ERC20）
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id INTEGER NOT NULL,
  symbol VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  asset_type VARCHAR(20) NOT NULL, -- NATIVE | ERC20
  contract_address VARCHAR(100),
  decimals INTEGER NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_chain_contract UNIQUE(chain_id, contract_address)
);

CREATE INDEX IF NOT EXISTS idx_assets_chain_id ON assets(chain_id);
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);

-- 用户导入资产表（按钱包地址归属）
CREATE TABLE IF NOT EXISTS imported_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(100) NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_wallet_asset UNIQUE(wallet_address, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_imported_assets_wallet_address ON imported_assets(wallet_address);

-- 资产余额快照表（每次导入或手动触发快照都会记录）
CREATE TABLE IF NOT EXISTS asset_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(100) NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  block_number BIGINT NOT NULL,
  -- 使用人类可读的小数化数量，避免前端频繁换算
  balance DECIMAL(40, 18) NOT NULL,
  -- 同时存储原始最小单位字符串，防止精度丢失（如 wei）
  balance_raw VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_snapshots_wallet_address ON asset_snapshots(wallet_address);
CREATE INDEX IF NOT EXISTS idx_asset_snapshots_asset_id ON asset_snapshots(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_snapshots_created_at ON asset_snapshots(created_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_knowledge_entries_updated_at BEFORE UPDATE ON knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlist_updated_at BEFORE UPDATE ON watchlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_portfolio_updated_at BEFORE UPDATE ON asset_portfolio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

