import { okx } from '@/services/okx'
import type { KlineInterval } from '@/types/trading'

/**
 * 从 OKX 获取 K 线数据
 * 不存储到数据库，直接从 API 获取
 */
export async function getKlinesFromOKX(
  symbol: string,
  interval: KlineInterval,
  limit: number = 100,
  after?: number,
  before?: number
): Promise<Array<{
  time: number
  open: string
  high: string
  low: string
  close: string
  volume: string
}>> {
  if (!symbol) {
    throw new Error('symbol is required')
  }

  try {
    const klines = await okx.getKlines(symbol, interval, limit, after, before)
    return Array.isArray(klines) ? klines : []
  } catch (error) {
    throw new Error(
      `Failed to fetch klines from OKX: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * 获取 OKX 行情信息
 */
export async function getTickerFromOKX(symbol?: string) {
  try {
    return await okx.getTicker(symbol)
  } catch (error) {
    throw new Error(
      `Failed to fetch ticker from OKX: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * 获取最新价格（直接调用 OKX ticker 数据）
 */
export async function getLatestPriceFromOKX(symbol: string): Promise<number | null> {
  if (!symbol) {
    return null
  }

  try {
    const ticker = await okx.getTicker(symbol)
    if (ticker && ticker.length > 0) {
      return Number.parseFloat(ticker[0].lastPrice)
    }
    return null
  } catch (error) {
    console.error('Failed to fetch latest price from OKX:', error)
    return null
  }
}

