/**
 * 交易历史列表组件
 * 暂时注释掉，待修复 API 调用问题
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface TradeHistoryProps {
  symbol?: string
  limit?: number
}

export function TradeHistory({ symbol, limit = 50 }: TradeHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>交易历史</CardTitle>
        <CardDescription>最近的交易记录</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
          <p>交易历史功能暂时不可用</p>
          <p className="text-sm mt-2">正在修复中...</p>
        </div>
      </CardContent>
    </Card>
  )
}

/* 原始实现已注释，待修复 API 调用问题
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Trade } from '@/types/trading'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

interface TradeHistoryProps {
  symbol?: string
  limit?: number
}

export function TradeHistory({ symbol, limit = 50 }: TradeHistoryProps) {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTrades()
  }, [symbol])

  const fetchTrades = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(symbol && { symbol }),
      })

      const response = await fetch(`/api/trades?${params.toString()}`)
      
      // 先尝试解析响应（无论成功或失败）
      let data: any
      try {
        data = await response.json()
      } catch (parseError) {
        // 如果无法解析 JSON，使用状态文本作为错误消息
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        throw new Error('Failed to parse response')
      }
      
      if (!response.ok) {
        // 如果响应不成功，从解析的数据中获取错误消息
        const errorMessage = data?.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      // API 返回格式：{ data: Trade[], total: number, page: number, limit: number, total_pages: number }
      setTrades(data.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(errorMessage)
      console.error('Failed to fetch trades:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-gray-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getSideColor = (side: string) => {
    return side === 'buy' ? 'text-green-600' : 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>交易历史</CardTitle>
            <CardDescription>最近的交易记录</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTrades} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '刷新'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center h-[200px] text-red-500">
            {error}
          </div>
        ) : loading && trades.length === 0 ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <p>暂无交易记录</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/analysis/trading/new')}
            >
              创建第一笔交易
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>交易对</TableHead>
                <TableHead>方向</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow
                  key={trade.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/analysis/trading/${trade.id}`)}
                >
                  <TableCell>
                    {trade.executed_at
                      ? format(new Date(trade.executed_at), 'yyyy-MM-dd HH:mm:ss')
                      : format(new Date(trade.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>{trade.symbol}</TableCell>
                  <TableCell className={getSideColor(trade.side)}>
                    {trade.side === 'buy' ? '买入' : '卖出'}
                  </TableCell>
                  <TableCell>
                    {trade.order_type === 'market' ? '市价' : trade.order_type === 'limit' ? '限价' : '止损'}
                  </TableCell>
                  <TableCell>{trade.quantity}</TableCell>
                  <TableCell>
                    {trade.price ? `$${trade.price.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(trade.status)}>
                      {trade.status === 'filled'
                        ? '已成交'
                        : trade.status === 'pending'
                        ? '待成交'
                        : trade.status === 'cancelled'
                        ? '已取消'
                        : '失败'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
*/

