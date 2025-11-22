'use client'

import { useRouter } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

export default function PortfolioPage() {
  const router = useRouter()

  // TODO: 从 API 获取投资组合数据
  const portfolio = {
    total_balance: 125000,
    available_balance: 50000,
    total_unrealized_pnl: 25000,
    total_realized_pnl: 0,
    positions_count: 2,
  }

  const positions = [
    {
      id: '1',
      symbol: 'BTC',
      side: 'long',
      size: 0.5,
      entry_price: 60000,
      current_price: 65000,
      unrealized_pnl: 2500,
    },
    {
      id: '2',
      symbol: 'ETH',
      side: 'long',
      size: 2.0,
      entry_price: 2500,
      current_price: 2750,
      unrealized_pnl: 500,
    },
  ]

  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">投资组合</h1>
          <p className="text-muted-foreground">跟踪资产组合和盈亏情况</p>
        </div>

        <div className="grid gap-6">
          {/* 资产总览 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>总资产</CardDescription>
                <CardTitle className="text-2xl">
                  ¥{portfolio.total_balance.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>可用余额</CardDescription>
                <CardTitle className="text-2xl">
                  ¥{portfolio.available_balance.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  未实现盈亏
                </CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  +¥{portfolio.total_unrealized_pnl.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>持仓数量</CardDescription>
                <CardTitle className="text-2xl">
                  {portfolio.positions_count}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* 持仓详情 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>持仓详情</CardTitle>
                  <CardDescription>当前持仓信息</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/analysis/trading')}
                >
                  查看全部
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>暂无持仓</p>
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
                  {positions.map((position) => (
                    <div
                      key={position.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/analysis/trading?symbol=${position.symbol}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold text-lg">{position.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {position.side === 'long' ? '做多' : '做空'} {position.size}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">开仓价格</p>
                          <p className="text-sm font-semibold">
                            ${position.entry_price.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">当前价格</p>
                          <p className="text-sm font-semibold">
                            ${position.current_price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">未实现盈亏</p>
                        <p
                          className={`text-lg font-semibold ${
                            position.unrealized_pnl >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {position.unrealized_pnl >= 0 ? '+' : ''}
                          ${position.unrealized_pnl.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 资产分布图表 */}
          <Card>
            <CardHeader>
              <CardTitle>资产分布</CardTitle>
              <CardDescription>持仓资产分布图（待集成）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                <p className="text-muted-foreground">资产分布图表</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
