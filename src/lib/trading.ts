/**
 * 交易相关数据库操作函数
 */

import { createAdminClient } from './supabase/admin'
import type {
  Trade,
  TradeCreateInput,
  TradeFilter,
  TradeSort,
  TradeListParams,
  PaginatedResponse,
  Position,
} from '@/types/trading'

/**
 * 创建交易记录
 */
export async function createTrade(
  user_address: string,
  input: TradeCreateInput
): Promise<Trade> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('trades')
    .insert({
      user_address: user_address.toLowerCase(),
      symbol: input.symbol,
      side: input.side,
      order_type: input.order_type,
      quantity: input.quantity,
      price: input.price || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create trade: ${error.message}`)
  }

  return data as Trade
}

/**
 * 更新交易记录
 */
export async function updateTrade(
  id: string,
  user_address: string,
  updates: Partial<{
    status: string
    order_id: string
    executed_at: string
    price: number
  }>
): Promise<Trade> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('trades')
    .update(updates)
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase())
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update trade: ${error.message}`)
  }

  return data as Trade
}

/**
 * 获取交易记录列表
 */
export async function getTrades(
  params: TradeListParams = {}
): Promise<PaginatedResponse<Trade>> {
  const { filter = {}, sort, page = 1, limit = 20 } = params
  const supabase = createAdminClient()

  // 验证 user_address（必需）
  if (!filter.user_address) {
    throw new Error('user_address is required for data isolation')
  }

  let query = supabase
    .from('trades')
    .select('*', { count: 'exact' })
    .eq('user_address', filter.user_address.toLowerCase())

  // 应用筛选条件
  if (filter.symbol) {
    query = query.eq('symbol', filter.symbol)
  }

  if (filter.side) {
    query = query.eq('side', filter.side)
  }

  if (filter.status) {
    query = query.eq('status', filter.status)
  }

  if (filter.start_date) {
    query = query.gte('created_at', filter.start_date)
  }

  if (filter.end_date) {
    query = query.lte('created_at', filter.end_date)
  }

  // 应用排序
  if (sort) {
    query = query.order(sort.field, { ascending: sort.direction === 'asc' })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // 应用分页
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch trades: ${error.message}`)
  }

  return {
    data: (data || []) as Trade[],
    total: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  }
}

/**
 * 根据 ID 获取交易记录
 */
export async function getTradeById(
  id: string,
  user_address: string
): Promise<Trade | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase())
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch trade: ${error.message}`)
  }

  return data as Trade
}

/**
 * 删除交易记录
 */
export async function deleteTrade(
  id: string,
  user_address: string
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase())

  if (error) {
    throw new Error(`Failed to delete trade: ${error.message}`)
  }
}

/**
 * 创建或更新持仓
 */
export async function upsertPosition(
  user_address: string,
  position: {
    symbol: string
    side: 'long' | 'short'
    size: number
    entry_price: number
    current_price?: number
    unrealized_pnl?: number
    realized_pnl?: number
  }
): Promise<Position> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('positions')
    .upsert(
      {
        user_address: user_address.toLowerCase(),
        ...position,
        current_price: position.current_price || null,
        unrealized_pnl: position.unrealized_pnl || 0,
        realized_pnl: position.realized_pnl || 0,
      },
      {
        onConflict: 'user_address,symbol,side',
      }
    )
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to upsert position: ${error.message}`)
  }

  return data as Position
}

/**
 * 获取持仓列表
 */
export async function getPositions(
  user_address: string,
  symbol?: string
): Promise<Position[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('positions')
    .select('*')
    .eq('user_address', user_address.toLowerCase())

  if (symbol) {
    query = query.eq('symbol', symbol)
  }

  query = query.order('updated_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch positions: ${error.message}`)
  }

  return (data || []) as Position[]
}

/**
 * 删除持仓
 */
export async function deletePosition(
  id: string,
  user_address: string
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', id)
    .eq('user_address', user_address.toLowerCase())

  if (error) {
    throw new Error(`Failed to delete position: ${error.message}`)
  }
}

