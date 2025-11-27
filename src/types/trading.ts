/**
 * 交易模块类型定义
 */

// 交易方向
export type TradeSide = 'buy' | 'sell'

// 订单类型
export type OrderType = 'market' | 'limit' | 'stop'

// 订单状态
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'failed'

// 持仓方向
export type PositionSide = 'long' | 'short'

// 策略动作
export type StrategyAction = 'buy' | 'sell' | 'hold'

// K线时间周期
export type KlineInterval = '1min' | '5min' | '1h' | '4h' | '1d' | '3d' | '1w'

// 交易记录
export interface Trade {
  id: string
  user_address: string
  symbol: string
  side: TradeSide
  order_type: OrderType
  quantity: number
  price: number | null
  status: OrderStatus
  order_id: string | null
  executed_at: string | null
  created_at: string
  updated_at: string
}

// 创建交易输入
export interface TradeCreateInput {
  symbol: string
  side: TradeSide
  order_type: OrderType
  quantity: number
  price?: number
}

// 交易筛选条件
export interface TradeFilter {
  user_address: string
  symbol?: string
  side?: TradeSide
  status?: OrderStatus
  start_date?: string
  end_date?: string
}

// 交易排序
export interface TradeSort {
  field: 'created_at' | 'executed_at' | 'price' | 'quantity'
  direction: 'asc' | 'desc'
}

// 交易列表参数
export interface TradeListParams {
  filter?: TradeFilter
  sort?: TradeSort
  page?: number
  limit?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// 持仓
export interface Position {
  id: string
  user_address: string
  symbol: string
  side: PositionSide
  size: number
  entry_price: number
  current_price: number | null
  unrealized_pnl: number
  realized_pnl: number
  created_at: string
  updated_at: string
}

// K线数据
export interface Kline {
  id: string
  symbol: string
  interval: KlineInterval
  open_time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  created_at: string
  updated_at: string
}

// K线查询参数
export interface KlineQueryParams {
  symbol: string
  interval: KlineInterval
  start_time?: string
  end_time?: string
  limit?: number
}

// 行情数据
export interface Ticker {
  symbol: string
  price: number
  change_24h: number
  change_percent_24h: number
  volume_24h: number
  high_24h: number
  low_24h: number
}

// 账户余额
export interface Balance {
  asset: string
  free: number
  locked: number
  total: number
}

// 账户摘要
export interface AccountSummary {
  total_balance: number
  available_balance: number
  positions_count: number
  open_orders_count: number
  total_unrealized_pnl: number
  total_realized_pnl: number
}

// 交易策略记录
export interface TradingStrategy {
  id: string
  user_address: string
  strategy_name: string | null
  symbol: string
  action: StrategyAction
  reason: string | null
  confidence: number | null
  executed: boolean
  created_at: string
}

// 创建策略记录输入
export interface TradingStrategyCreateInput {
  strategy_name?: string
  symbol: string
  action: StrategyAction
  reason?: string
  confidence?: number
  executed?: boolean
}

// 策略记录筛选条件
export interface TradingStrategyFilter {
  user_address: string
  symbol?: string
  action?: StrategyAction
  executed?: boolean
  start_date?: string
  end_date?: string
}

