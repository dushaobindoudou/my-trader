/**
 * 实时交易流组件
 * 使用 WebSocket 实时显示交易数据
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOKXTradesSubscription } from '@/hooks/use-okx-websocket'
import type { WebSocketMessage } from '@/services/okx-websocket'
import { format } from 'date-fns'
import { Loader2, Activity, Circle } from 'lucide-react'

interface TradesStreamProps {
  coin: string
  maxTrades?: number
}

interface WsTrade {
  instId?: string
  tradeId?: string
  coin?: string
  side: string
  px: string
  sz: string
  hash?: string
  time: number
  tid?: number
  count?: number
  users?: [string, string] // [buyer, seller]
}

export function TradesStream({ coin, maxTrades = 50 }: TradesStreamProps) {
  const [trades, setTrades] = useState<WsTrade[]>([])
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
  const handleTradesMessage = useCallback(
    (message: WebSocketMessage) => {
      if (message.channel === 'subscriptionResponse') {
        setIsConnected(true)
        return
      }

      if (message.channel === 'trades' && message.data) {
        setIsConnected(true)
        const tradesData = message.data as WsTrade[]

        setTrades((prev) => {
          // 合并新交易，按时间排序
          const updated = [...prev, ...tradesData]
          updated.sort((a, b) => b.time - a.time)
          // 限制数量
          return updated.slice(0, maxTrades)
        })
      }
    },
    [maxTrades]
  )

  // 订阅交易数据
  const normalizedCoin = normalizeCoin(coin)
  useOKXTradesSubscription(normalizedCoin, handleTradesMessage, !!coin)

  // 格式化价格和数量
  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(2)
  }

  const formatSize = (size: string) => {
    return parseFloat(size).toFixed(4)
  }

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm:ss')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>实时交易</CardTitle>
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
        {loading && trades.length === 0 ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : trades.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            暂无交易数据
          </div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {trades.map((trade, index) => {
              const isBuy = trade.side === 'B' || trade.side === 'buy'
              return (
                <div
                  key={`${trade.tradeId || trade.tid || index}-${trade.time}-${index}`}
                  className="flex items-center justify-between text-sm hover:bg-muted/50 rounded px-2 py-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{formatTime(trade.time)}</span>
                    <span
                      className={`font-medium ${
                        isBuy ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatPrice(trade.px)}
                    </span>
                    <span className="text-muted-foreground">{formatSize(trade.sz)}</span>
                  </div>
                  <Badge variant={isBuy ? 'default' : 'destructive'} className="text-xs">
                    {isBuy ? '买' : '卖'}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

