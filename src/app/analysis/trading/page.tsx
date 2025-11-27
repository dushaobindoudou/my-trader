'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { KlineChart } from '@/components/trading/kline-chart'
import { TradeHistory } from '@/components/trading/trade-history'
import { PositionsList } from '@/components/trading/positions-list'
import { OrderBook } from '@/components/trading/order-book'
import { TradesStream } from '@/components/trading/trades-stream'

export default function TradingAnalysisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [symbol, setSymbol] = useState<string>(searchParams.get('symbol') || 'BTC')
  const [symbols, setSymbols] = useState<Array<{ name: string }>>([])
  const [loadingSymbols, setLoadingSymbols] = useState(false)

  useEffect(() => {
    fetchSymbols()
  }, [])

  const fetchSymbols = async () => {
    setLoadingSymbols(true)
    try {
      // 使用 OKX 接口，只需要 ETH/USDT 和 BTC/USDT 两个交易对
      setSymbols([
        { name: 'BTC' },
        { name: 'ETH' },
      ])
    } catch (error) {
      console.error('Failed to fetch symbols:', error)
      // 如果出错，使用默认交易对
      setSymbols([
        { name: 'BTC' },
        { name: 'ETH' },
      ])
    } finally {
      setLoadingSymbols(false)
    }
  }

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol)
    router.push(`/analysis/trading?symbol=${newSymbol}`)
  }

  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">交易分析</h1>
            <p className="text-muted-foreground">查看市场数据和交易历史</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={symbol} onValueChange={handleSymbolChange} disabled={loadingSymbols}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="选择交易对" />
              </SelectTrigger>
              <SelectContent>
                {loadingSymbols ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  symbols.length > 0 ? (
                    symbols.map((s) => (
                      <SelectItem key={s.name} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="BTC">BTC</SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Button onClick={() => router.push(`/analysis/trading/new?symbol=${symbol}`)}>
              <Plus className="mr-2 h-4 w-4" />
              新建交易
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* K线图表 */}
          <KlineChart symbol={symbol} />

          {/* 订单簿和实时交易流 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OrderBook coin={symbol} maxLevels={20} />
            <TradesStream coin={symbol} maxTrades={50} />
          </div>

          {/* 交易历史和持仓 */}
          <Tabs defaultValue="history" className="w-full">
            <TabsList>
              <TabsTrigger value="history">
                交易历史
              </TabsTrigger>
              <TabsTrigger value="positions">
                持仓
              </TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="mt-4">
              <TradeHistory symbol={symbol} limit={50} />
            </TabsContent>
            <TabsContent value="positions" className="mt-4">
              <PositionsList symbol={symbol} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}

