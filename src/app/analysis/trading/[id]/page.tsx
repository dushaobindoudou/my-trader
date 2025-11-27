'use client'

import { useRouter, useParams } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, X } from 'lucide-react'

export default function TradeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tradeId = params.id as string

  // TODO: 从 API 获取交易详情
  const trade = {
    id: tradeId,
    symbol: 'BTC',
    side: 'buy',
    order_type: 'limit',
    quantity: 0.1,
    price: 65000,
    status: 'pending',
    created_at: '2024-01-05T10:00:00Z',
    executed_at: null,
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'filled':
        return '已成交'
      case 'pending':
        return '待成交'
      case 'cancelled':
        return '已取消'
      case 'failed':
        return '失败'
      default:
        return status
    }
  }

  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">交易详情</h1>
            <p className="text-muted-foreground">订单 ID: {tradeId}</p>
          </div>
          {trade.status === 'pending' && (
            <Button
              variant="destructive"
              onClick={() => {
                // TODO: 取消订单
                router.push('/analysis/trading')
              }}
            >
              <X className="mr-2 h-4 w-4" />
              取消订单
            </Button>
          )}
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">交易对</p>
                  <p className="text-lg font-semibold">{trade.symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">交易方向</p>
                  <p className="text-lg font-semibold">
                    {trade.side === 'buy' ? '买入' : '卖出'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">订单类型</p>
                  <p className="text-lg font-semibold">
                    {trade.order_type === 'market' ? '市价单' : 
                     trade.order_type === 'limit' ? '限价单' : '止损单'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">订单状态</p>
                  <Badge className={getStatusColor(trade.status)}>
                    {getStatusText(trade.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">数量</p>
                  <p className="text-lg font-semibold">{trade.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">价格</p>
                  <p className="text-lg font-semibold">
                    {trade.price ? `$${trade.price.toLocaleString()}` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle>时间信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">创建时间</p>
                  <p className="text-sm">
                    {new Date(trade.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">执行时间</p>
                  <p className="text-sm">
                    {trade.executed_at
                      ? new Date(trade.executed_at).toLocaleString('zh-CN')
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 相关图表 */}
          <Card>
            <CardHeader>
              <CardTitle>价格走势</CardTitle>
              <CardDescription>交易对价格走势图（待集成）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                <p className="text-muted-foreground">价格走势图表</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}

