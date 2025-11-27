import { hyperliquid } from '@/services/hyperliquid'
import type { KlineInterval } from '@/types/trading'

/**
 * 直接从 Hyperliquid 获取 K 线数据
 * 不存储到数据库，直接从 API 获取
 */
export async function getKlinesFromHyperliquid(
  symbol: string,
  interval: KlineInterval,
  startTime?: number,
  endTime?: number,
  limit: number = 500
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
    const klines = await hyperliquid.getKlines(symbol, interval, startTime, endTime, limit)
    return Array.isArray(klines) ? klines : []
  } catch (error) {
    throw new Error(
      `Failed to fetch klines from Hyperliquid: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * 获取 Hyperliquid 行情信息
 */
export async function getTickerFromHyperliquid(symbol?: string) {
  try {
    return await hyperliquid.getTicker(symbol)
  } catch (error) {
    throw new Error(
      `Failed to fetch ticker from Hyperliquid: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * 获取最新价格（直接调用 Hyperliquid ticker 数据）
 */
export async function getLatestPrice(symbol: string): Promise<number | null> {
  if (!symbol) {
    return null
  }

  try {
    const ticker = await hyperliquid.getTicker(symbol)
    if (ticker && ticker.length > 0) {
      return Number.parseFloat(ticker[0].lastPrice)
    }
    return null
  } catch (error) {
    console.error('Failed to fetch latest price from Hyperliquid:', error)
    return null
  }
}
