/**
 * 订单簿组件
 * 使用 WebSocket 实时显示订单簿数据
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOKXBooksSubscription } from '@/hooks/use-okx-websocket'
import type { WebSocketMessage } from '@/services/okx-websocket'
import { Loader2, Activity, Circle } from 'lucide-react'

interface OrderBookProps {
  coin: string
  maxLevels?: number
}

interface WsLevel {
  px: string
  sz: string
  n?: number
}

interface WsBook {
  coin: string
  levels: [WsLevel[], WsLevel[]] // [bids, asks]
  time: number
}

export function OrderBook({ coin, maxLevels = 20 }: OrderBookProps) {
  const [book, setBook] = useState<WsBook | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  // 将交易对转换为 OKX 格式（如 BTC-USDT）
  const normalizeCoin = (coin: string): string => {
    if (coin.includes('-')) {
      return coin
    }
    return `${coin}-USDT`
  }

  // 处理 WebSocket 消息
  const handleBookMessage = useCallback(
    (message: WebSocketMessage) => {
      if (message.channel === 'subscriptionResponse') {
        setIsConnected(true)
        return
      }

      if (message.channel === 'l2Book' && message.data) {
        setIsConnected(true)
        const bookData = message.data as WsBook
        setBook(bookData)
      }
    },
    []
  )

  // 订阅订单簿数据
  const normalizedCoin = normalizeCoin(coin)
  useOKXBooksSubscription(normalizedCoin, handleBookMessage, !!coin, 20)

  // 格式化价格和数量
  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(2)
  }

  const formatSize = (size: string) => {
    return parseFloat(size).toFixed(4)
  }

  // 计算累计数量
  const calculateCumulative = (levels: WsLevel[], isBid: boolean) => {
    let cumulative = 0
    return levels.map((level) => {
      cumulative += parseFloat(level.sz)
      return {
        ...level,
        cumulative,
      }
    })
  }

  const bids = book?.levels[0] || []
  const asks = book?.levels[1] || []

  const bidsWithCumulative = calculateCumulative(bids, true)
  const asksWithCumulative = calculateCumulative(asks, false)

  const maxCumulative = Math.max(
    bidsWithCumulative[bidsWithCumulative.length - 1]?.cumulative || 0,
    asksWithCumulative[asksWithCumulative.length - 1]?.cumulative || 0
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>订单簿</CardTitle>
            <CardDescription>{coin}</CardDescription>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
            {isConnected ? (
              <>
                <Activity className="h-3 w-3" />
                实时
              </>
            ) : (
              <>
                <Circle className="h-3 w-3" />
                离线
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !book ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !book ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            暂无数据
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* 卖单（Asks） */}
            <div>
              <div className="mb-2 text-sm font-semibold text-red-600">卖单</div>
              <div className="space-y-1">
                {asksWithCumulative.slice(0, maxLevels).map((ask, index) => {
                  const widthPercent = ((ask.cumulative / maxCumulative) * 100).toFixed(2)
                  return (
                    <div
                      key={index}
                      className="relative flex items-center justify-between text-sm hover:bg-muted/50 rounded px-2 py-1"
                    >
                      <div
                        className="absolute left-0 top-0 h-full bg-red-500/10 rounded"
                        style={{ width: `${widthPercent}%` }}
                      />
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className="text-red-600 font-medium">{formatPrice(ask.px)}</span>
                        <span className="text-muted-foreground">{formatSize(ask.sz)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 买单（Bids） */}
            <div>
              <div className="mb-2 text-sm font-semibold text-green-600">买单</div>
              <div className="space-y-1">
                {bidsWithCumulative.slice(0, maxLevels).map((bid, index) => {
                  const widthPercent = ((bid.cumulative / maxCumulative) * 100).toFixed(2)
                  return (
                    <div
                      key={index}
                      className="relative flex items-center justify-between text-sm hover:bg-muted/50 rounded px-2 py-1"
                    >
                      <div
                        className="absolute left-0 top-0 h-full bg-green-500/10 rounded"
                        style={{ width: `${widthPercent}%` }}
                      />
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className="text-green-600 font-medium">{formatPrice(bid.px)}</span>
                        <span className="text-muted-foreground">{formatSize(bid.sz)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

