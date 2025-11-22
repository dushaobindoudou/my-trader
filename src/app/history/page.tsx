'use client'

import { useRouter } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { History, Search, Filter } from 'lucide-react'

export default function HistoryPage() {
  const router = useRouter()

  // TODO: 从 API 获取交易历史
  const trades: Array<{
    id: string
    symbol: string
    side: string
    order_type: string
    quantity: number
    price: number | null
    status: string
    created_at: string
  }> = []

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">交易历史</h1>
          <p className="text-muted-foreground">查看所有交易记录</p>
        </div>

        <div className="grid gap-6">
          {/* 筛选器 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                筛选条件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">交易对</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="全部" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="SOL">SOL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">交易方向</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="全部" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="buy">买入</SelectItem>
                      <SelectItem value="sell">卖出</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">订单状态</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="全部" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="filled">已成交</SelectItem>
                      <SelectItem value="pending">待成交</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                      <SelectItem value="failed">失败</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">搜索</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索订单ID..."
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 交易列表 */}
          <Card>
            <CardHeader>
              <CardTitle>交易记录</CardTitle>
              <CardDescription>共 {trades.length} 条记录</CardDescription>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                <div className="space-y-4">
                  {trades.map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/analysis/trading/${trade.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold">{trade.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(trade.created_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {trade.side === 'buy' ? '买入' : '卖出'}
                          </p>
                          <p className="text-sm">
                            {trade.order_type === 'market' ? '市价单' : 
                             trade.order_type === 'limit' ? '限价单' : '止损单'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">数量</p>
                          <p className="text-sm font-semibold">{trade.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">价格</p>
                          <p className="text-sm font-semibold">
                            {trade.price ? `$${trade.price.toLocaleString()}` : '-'}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(trade.status)}>
                        {getStatusText(trade.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
