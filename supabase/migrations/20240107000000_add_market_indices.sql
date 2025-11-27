-- 市场指数表
-- 用于存储市场全局指数数据，支持数据缓存减少 API 调用

-- 市场指数快照表 (market_indices_snapshot)
-- 存储全局市场数据的快照，用于缓存和历史记录
CREATE TABLE IF NOT EXISTS market_indices_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 全球市场数据
  total_market_cap_usd DECIMAL(30, 2),
  total_volume_24h_usd DECIMAL(30, 2),
  market_cap_change_24h_percent DECIMAL(10, 4),
  
  -- 主导地位数据
  btc_dominance DECIMAL(10, 4),
  eth_dominance DECIMAL(10, 4),
  
  -- 市场活跃度
  active_cryptocurrencies INTEGER,
  active_exchanges INTEGER,
  active_market_pairs INTEGER,
  
  -- ICO 数据
  upcoming_icos INTEGER DEFAULT 0,
  ongoing_icos INTEGER DEFAULT 0,
  ended_icos INTEGER DEFAULT 0,
  
  -- DeFi 数据
  defi_market_cap_usd DECIMAL(30, 2),
  defi_volume_24h_usd DECIMAL(30, 2),
  defi_dominance DECIMAL(10, 4),
  top_defi_coin_name VARCHAR(100),
  top_defi_coin_dominance DECIMAL(10, 4),
  
  -- 衍生品数据
  derivatives_volume_24h_usd DECIMAL(30, 2),
  
  -- 稳定币数据
  stablecoin_market_cap_usd DECIMAL(30, 2),
  stablecoin_volume_24h_usd DECIMAL(30, 2),
  
  -- 恐惧与贪婪指数（从外部 API 获取时存储）
  fear_greed_value INTEGER,
  fear_greed_classification VARCHAR(50),
  
  -- 数据来源
  source VARCHAR(50) NOT NULL DEFAULT 'coingecko' CHECK (source IN ('coingecko', 'coinmarketcap', 'alternative.me')),
  
  -- 原始数据（JSON 格式存储完整响应）
  raw_data JSONB,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 用户关联（可选，用于多用户场景）
  user_address VARCHAR(100)
);

-- 恐惧与贪婪指数历史表 (fear_greed_history)
-- 单独存储恐惧与贪婪指数的历史数据
CREATE TABLE IF NOT EXISTS fear_greed_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
  value_classification VARCHAR(50) NOT NULL,
  record_date DATE NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'coingecko' CHECK (source IN ('coingecko', 'coinmarketcap', 'alternative.me')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 每天每个来源只有一条记录
  UNIQUE(record_date, source)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_market_indices_snapshot_created_at 
  ON market_indices_snapshot(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_indices_snapshot_source 
  ON market_indices_snapshot(source);
CREATE INDEX IF NOT EXISTS idx_market_indices_snapshot_user 
  ON market_indices_snapshot(user_address) WHERE user_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fear_greed_history_date 
  ON fear_greed_history(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_fear_greed_history_source 
  ON fear_greed_history(source);

-- 添加注释
COMMENT ON TABLE market_indices_snapshot IS '市场指数快照表，存储全局市场数据用于缓存和历史分析';
COMMENT ON COLUMN market_indices_snapshot.total_market_cap_usd IS '加密货币总市值（USD）';
COMMENT ON COLUMN market_indices_snapshot.btc_dominance IS 'BTC 市值占比（%）';
COMMENT ON COLUMN market_indices_snapshot.eth_dominance IS 'ETH 市值占比（%）';
COMMENT ON COLUMN market_indices_snapshot.defi_market_cap_usd IS 'DeFi 总市值（USD）';
COMMENT ON COLUMN market_indices_snapshot.fear_greed_value IS '恐惧与贪婪指数（0-100）';
COMMENT ON COLUMN market_indices_snapshot.raw_data IS '原始 API 响应的完整 JSON 数据';

COMMENT ON TABLE fear_greed_history IS '恐惧与贪婪指数历史表，按天存储指数变化';
COMMENT ON COLUMN fear_greed_history.value IS '恐惧与贪婪指数值（0-100，0=极度恐惧，100=极度贪婪）';
COMMENT ON COLUMN fear_greed_history.value_classification IS '指数分类（Extreme Fear/Fear/Neutral/Greed/Extreme Greed）';

-- 创建获取最新快照的函数
CREATE OR REPLACE FUNCTION get_latest_market_snapshot(p_source VARCHAR DEFAULT 'coingecko')
RETURNS market_indices_snapshot AS $$
BEGIN
  RETURN (
    SELECT *
    FROM market_indices_snapshot
    WHERE source = p_source
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- 创建检查缓存是否过期的函数（默认 5 分钟缓存）
CREATE OR REPLACE FUNCTION is_market_cache_valid(p_source VARCHAR DEFAULT 'coingecko', p_cache_minutes INTEGER DEFAULT 5)
RETURNS BOOLEAN AS $$
DECLARE
  latest_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT created_at INTO latest_time
  FROM market_indices_snapshot
  WHERE source = p_source
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF latest_time IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN (NOW() - latest_time) < (p_cache_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- 启用 RLS
ALTER TABLE market_indices_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE fear_greed_history ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（所有用户可读取，服务账户可写入）
CREATE POLICY "Allow public read access to market_indices_snapshot"
  ON market_indices_snapshot FOR SELECT
  USING (true);

CREATE POLICY "Allow service role to insert market_indices_snapshot"
  ON market_indices_snapshot FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to fear_greed_history"
  ON fear_greed_history FOR SELECT
  USING (true);

CREATE POLICY "Allow service role to insert fear_greed_history"
  ON fear_greed_history FOR INSERT
  WITH CHECK (true);

