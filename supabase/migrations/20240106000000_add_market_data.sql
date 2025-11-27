-- 市场数据表
-- 用于存储从 CoinMarketCap、CoinGecko 等 API 获取的市场数据

-- 市场数据表 (market_data)
CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(50) NOT NULL,
  name VARCHAR(200),
  source VARCHAR(50) NOT NULL CHECK (source IN ('coinmarketcap', 'coingecko', 'cryptocompare')),
  price_usd DECIMAL(20, 8),
  market_cap_usd DECIMAL(30, 2),
  volume_24h_usd DECIMAL(30, 2),
  price_change_24h DECIMAL(10, 4),
  price_change_percent_24h DECIMAL(10, 4),
  rank INTEGER,
  circulating_supply DECIMAL(30, 2),
  total_supply DECIMAL(30, 2),
  max_supply DECIMAL(30, 2),
  data JSONB, -- 存储原始 API 响应的完整数据
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, source) -- 每个数据源每个币种只有一条记录
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_source ON market_data(source);
CREATE INDEX IF NOT EXISTS idx_market_data_updated_at ON market_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_rank ON market_data(rank) WHERE rank IS NOT NULL;

-- 添加注释
COMMENT ON TABLE market_data IS '市场数据表，存储从多个数据源获取的加密货币市场信息';
COMMENT ON COLUMN market_data.symbol IS '币种符号，如 BTC, ETH';
COMMENT ON COLUMN market_data.name IS '币种名称';
COMMENT ON COLUMN market_data.source IS '数据来源：coinmarketcap, coingecko, cryptocompare';
COMMENT ON COLUMN market_data.price_usd IS '当前价格（USD）';
COMMENT ON COLUMN market_data.market_cap_usd IS '市值（USD）';
COMMENT ON COLUMN market_data.volume_24h_usd IS '24小时交易量（USD）';
COMMENT ON COLUMN market_data.price_change_24h IS '24小时价格变化（USD）';
COMMENT ON COLUMN market_data.price_change_percent_24h IS '24小时价格变化百分比';
COMMENT ON COLUMN market_data.rank IS '市值排名';
COMMENT ON COLUMN market_data.data IS '原始 API 响应的完整 JSON 数据';

-- 为 market_data 表添加 updated_at 触发器
DROP TRIGGER IF EXISTS update_market_data_updated_at ON market_data;
CREATE TRIGGER update_market_data_updated_at
  BEFORE UPDATE ON market_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

