'use client'

import { useRouter } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export default function NewTradePage() {
  const router = useRouter()

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
          <div>
            <h1 className="text-2xl font-bold tracking-tight">新建交易</h1>
            <p className="text-muted-foreground">创建新的交易订单</p>
          </div>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>交易信息</CardTitle>
              <CardDescription>填写交易订单详情</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 交易对 */}
              <div className="space-y-2">
                <Label htmlFor="symbol">交易对</Label>
                <Select defaultValue="BTC">
                  <SelectTrigger id="symbol">
                    <SelectValue placeholder="选择交易对" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="SOL">SOL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 交易方向 */}
              <div className="space-y-2">
                <Label htmlFor="side">交易方向</Label>
                <Select defaultValue="buy">
                  <SelectTrigger id="side">
                    <SelectValue placeholder="选择方向" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">买入</SelectItem>
                    <SelectItem value="sell">卖出</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 订单类型 */}
              <div className="space-y-2">
                <Label htmlFor="orderType">订单类型</Label>
                <Select defaultValue="market">
                  <SelectTrigger id="orderType">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">市价单</SelectItem>
                    <SelectItem value="limit">限价单</SelectItem>
                    <SelectItem value="stop">止损单</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 数量 */}
              <div className="space-y-2">
                <Label htmlFor="quantity">数量</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              {/* 价格（限价单和止损单需要） */}
              <div className="space-y-2">
                <Label htmlFor="price">价格（限价单/止损单）</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  市价单不需要填写价格
                </p>
              </div>

              {/* 实时价格显示 */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">当前价格</span>
                  <span className="text-lg font-semibold">$65,000.00</span>
                </div>
              </div>

              {/* 风险提示 */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ 风险提示：交易有风险，投资需谨慎。请确保您了解相关风险后再进行交易。
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    // TODO: 提交交易
                    router.push('/trades')
                  }}
                >
                  提交订单
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}

