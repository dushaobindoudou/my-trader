-- 交易模块数据库迁移
-- 创建交易相关的表结构

-- 1. 交易记录表 (trades)
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(100) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop')),
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'failed')),
  order_id VARCHAR(100),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trades_user_address ON trades(user_address);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_order_id ON trades(order_id);

-- 添加注释
COMMENT ON TABLE trades IS '交易记录表';
COMMENT ON COLUMN trades.user_address IS '用户 Web3 地址，用于数据隔离';
COMMENT ON COLUMN trades.symbol IS '交易对，如 BTC/USD';
COMMENT ON COLUMN trades.side IS '交易方向：buy/sell';
COMMENT ON COLUMN trades.order_type IS '订单类型：market/limit/stop';
COMMENT ON COLUMN trades.status IS '订单状态：pending/filled/cancelled/failed';

-- 2. 持仓表 (positions)
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(100) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
  size DECIMAL(20, 8) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
  realized_pnl DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_address, symbol, side)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_positions_user_address ON positions(user_address);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_updated_at ON positions(updated_at DESC);

-- 添加注释
COMMENT ON TABLE positions IS '持仓表';
COMMENT ON COLUMN positions.user_address IS '用户 Web3 地址，用于数据隔离';
COMMENT ON COLUMN positions.symbol IS '交易对';
COMMENT ON COLUMN positions.side IS '持仓方向：long/short';

-- 3. 交易策略记录表 (trading_strategies)
-- 注意：K线数据不存储在数据库中，直接从 Hyperliquid API 获取
CREATE TABLE IF NOT EXISTS trading_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(100) NOT NULL,
  strategy_name VARCHAR(100),
  symbol VARCHAR(50) NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('buy', 'sell', 'hold')),
  reason TEXT,
  confidence DECIMAL(5, 4) CHECK (confidence >= 0 AND confidence <= 1),
  executed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trading_strategies_user_address ON trading_strategies(user_address);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_symbol ON trading_strategies(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_created_at ON trading_strategies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_executed ON trading_strategies(executed);

-- 添加注释
COMMENT ON TABLE trading_strategies IS '交易策略记录表';
COMMENT ON COLUMN trading_strategies.user_address IS '用户 Web3 地址，用于数据隔离';
COMMENT ON COLUMN trading_strategies.strategy_name IS '策略名称';
COMMENT ON COLUMN trading_strategies.action IS '策略动作：buy/sell/hold';
COMMENT ON COLUMN trading_strategies.confidence IS '置信度：0-1';

-- 创建 updated_at 触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 trades 表添加 updated_at 触发器
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 positions 表添加 updated_at 触发器
DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

