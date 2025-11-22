'use client'

import { useRouter } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, TrendingUp, TrendingDown } from 'lucide-react'

export default function WatchlistPage() {
  const router = useRouter()

  // TODO: 从 API 获取观察列表
  const watchlist = [
    {
      id: '1',
      symbol: 'BTC',
      current_price: 65000,
      target_price: 70000,
      change_24h: 2.5,
      status: 'watching',
    },
    {
      id: '2',
      symbol: 'ETH',
      current_price: 2750,
      target_price: 3000,
      change_24h: -1.2,
      status: 'watching',
    },
  ]

  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">观察列表</h1>
            <p className="text-muted-foreground">跟踪感兴趣的标的</p>
          </div>
          <Button onClick={() => {
            // TODO: 打开添加标的对话框
          }}>
            <Plus className="mr-2 h-4 w-4" />
            添加标的
          </Button>
        </div>

        <div className="grid gap-6">
          {watchlist.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无观察标的</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      // TODO: 打开添加标的对话框
                    }}
                  >
                    添加第一个标的
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {watchlist.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/analysis/trading?symbol=${item.symbol}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">{item.symbol}</CardTitle>
                        <CardDescription>当前价格</CardDescription>
                      </div>
                      <Badge className="bg-blue-500">
                        {item.status === 'watching' ? '观察中' : '已触发'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">当前价格</p>
                          <p className="text-2xl font-bold">
                            ${item.current_price.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">目标价格</p>
                          <p className="text-2xl font-bold">
                            ${item.target_price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.change_24h >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span
                          className={`text-sm font-semibold ${
                            item.change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {item.change_24h >= 0 ? '+' : ''}
                          {item.change_24h}%
                        </span>
                        <span className="text-sm text-muted-foreground">24h</span>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">
                          距离目标价格
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {(
                              ((item.target_price - item.current_price) /
                                item.current_price) *
                              100
                            ).toFixed(2)}
                            %
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/analysis/trading/new?symbol=${item.symbol}`)
                            }}
                          >
                            快速交易
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
