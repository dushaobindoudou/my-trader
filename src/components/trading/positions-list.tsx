/**
 * 持仓列表组件
 */

'use client'

import { useState, useEffect } from 'react'
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
import type { Position } from '@/types/trading'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

interface PositionsListProps {
  symbol?: string
}

export function PositionsList({ symbol }: PositionsListProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPositions()
  }, [symbol])

  const fetchPositions = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (symbol) {
        params.append('symbol', symbol)
      }

      const response = await fetch(`/api/positions?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch positions')
      }

      const data = await response.json()
      setPositions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      console.error('Failed to fetch positions:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSideColor = (side: string) => {
    return side === 'long' ? 'text-green-600' : 'text-red-600'
  }

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>持仓列表</CardTitle>
            <CardDescription>当前持仓信息</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPositions} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '刷新'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center h-[200px] text-red-500">
            {error}
          </div>
        ) : loading && positions.length === 0 ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : positions.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            暂无持仓
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>交易对</TableHead>
                <TableHead>方向</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>开仓价格</TableHead>
                <TableHead>当前价格</TableHead>
                <TableHead>未实现盈亏</TableHead>
                <TableHead>已实现盈亏</TableHead>
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell>{position.symbol}</TableCell>
                  <TableCell>
                    <Badge className={getSideColor(position.side)}>
                      {position.side === 'long' ? '做多' : '做空'}
                    </Badge>
                  </TableCell>
                  <TableCell>{position.size}</TableCell>
                  <TableCell>${position.entry_price.toFixed(2)}</TableCell>
                  <TableCell>
                    {position.current_price ? `$${position.current_price.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className={getPnlColor(position.unrealized_pnl)}>
                    ${position.unrealized_pnl.toFixed(2)}
                  </TableCell>
                  <TableCell className={getPnlColor(position.realized_pnl)}>
                    ${position.realized_pnl.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(position.updated_at), 'yyyy-MM-dd HH:mm:ss')}
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

