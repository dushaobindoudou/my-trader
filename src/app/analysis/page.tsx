'use client'

import { useState, useEffect } from 'react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Database,
  Globe,
  Flame,
  BarChart3,
  Coins,
  Activity,
} from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'

// ============================================================================
// 类型定义
// ============================================================================

interface MarketOverview {
  total_market_cap: { usd: number }
  total_volume: { usd: number }
  market_cap_percentage: { [key: string]: number }
  market_cap_change_percentage_24h_usd: number
}

interface MarketTrends {
  btc_dominance: number
  eth_dominance: number
  altcoin_market_cap: number
  defi_market_cap?: number
  defi_dominance?: number
}

interface MarketActivity {
  active_cryptocurrencies: number
  markets: number
  upcoming_icos?: number
  ongoing_icos?: number
  ended_icos?: number
}

interface DefiData {
  market_cap: number
  volume_24h: number
  dominance: number
  top_coin_name: string
  top_coin_dominance: number
  eth_ratio: number
}

interface TrendingCoin {
  id: string
  name: string
  symbol: string
  market_cap_rank: number
  price_btc: number
  score: number
  thumb: string
}

interface FearGreedIndex {
  value: number
  value_classification: string
  timestamp: number | string
}

interface MarketIndicesData {
  marketOverview: MarketOverview | null
  marketTrends: MarketTrends | null
  marketActivity: MarketActivity | null
  defiData: DefiData | null
  trendingCoins: TrendingCoin[]
  fearGreedIndex: {
    current: FearGreedIndex | null
    history: FearGreedIndex[]
  }
  dataSource: 'cache' | 'coingecko' | 'coinmarketcap'
  cacheAge?: number
  timestamp: string
}

// ============================================================================
// 组件
// ============================================================================

export default function AnalysisPage() {
  const [data, setData] = useState<MarketIndicesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMarketIndices()
  }, [])

  const fetchMarketIndices = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/market/indices', {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: MarketIndicesData = await response.json()
      setData(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market indices'
      setError(errorMessage)
      console.error('Failed to fetch market indices:', err)
    } finally {
      setLoading(false)
    }
  }

  // 格式化货币
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-'
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return `$${value.toLocaleString()}`
  }

  // 格式化百分比
  const formatPercent = (value: number | null | undefined, decimals: number = 2) => {
    if (value === null || value === undefined) return '-'
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
  }

  // 获取数据源图标和颜色
  const getDataSourceInfo = (source: string) => {
    switch (source) {
      case 'cache':
        return { icon: Database, color: 'text-amber-500', label: '缓存' }
      case 'coingecko':
        return { icon: Globe, color: 'text-green-500', label: 'CoinGecko' }
      case 'coinmarketcap':
        return { icon: Globe, color: 'text-blue-500', label: 'CoinMarketCap' }
      default:
        return { icon: Globe, color: 'text-gray-500', label: '未知' }
    }
  }

  return (
    <AuthenticatedLayout>
      <Main>
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">市场分析</h1>
            <p className="text-muted-foreground">
              全球加密货币市场数据概览
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* 数据来源标签 */}
            {data && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {(() => {
                  const info = getDataSourceInfo(data.dataSource)
                  const Icon = info.icon
                  return (
                    <>
                      <Icon className={`h-4 w-4 ${info.color}`} />
                      <span>{info.label}</span>
                      {data.cacheAge !== undefined && (
                        <span className="text-xs">
                          ({Math.floor(data.cacheAge / 60)}分钟前)
                        </span>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
            <Button onClick={fetchMarketIndices} disabled={loading} variant="outline">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              刷新数据
            </Button>
          </div>
        </div>

        {/* 错误状态 */}
        {error ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-lg font-semibold mb-2">加载失败</p>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchMarketIndices} variant="outline">
                  重试
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          /* 加载状态 */
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* 数据展示 */
          <div className="grid gap-6">
            {/* 市场总览卡片 */}
            {data?.marketOverview && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总市值</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(data.marketOverview.total_market_cap.usd)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      加密货币总市值
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">24h 交易量</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(data.marketOverview.total_volume.usd)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      全球24小时交易量
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">24h 市值变化</CardTitle>
                    {data.marketOverview.market_cap_change_percentage_24h_usd >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        data.marketOverview.market_cap_change_percentage_24h_usd >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatPercent(data.marketOverview.market_cap_change_percentage_24h_usd)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      市值变化百分比
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">BTC 占比</CardTitle>
                    <Coins className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(data.marketOverview.market_cap_percentage.btc ?? 0).toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      比特币市值占比
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 恐惧与贪婪指数 */}
            {data?.fearGreedIndex?.current && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg ${
                          data.fearGreedIndex.current.value >= 75
                            ? 'bg-red-100 text-red-600'
                            : data.fearGreedIndex.current.value >= 55
                            ? 'bg-orange-100 text-orange-600'
                            : data.fearGreedIndex.current.value >= 45
                            ? 'bg-yellow-100 text-yellow-600'
                            : data.fearGreedIndex.current.value >= 25
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        {data.fearGreedIndex.current.value >= 75 ? '🔥' :
                         data.fearGreedIndex.current.value >= 55 ? '😊' :
                         data.fearGreedIndex.current.value >= 45 ? '😐' :
                         data.fearGreedIndex.current.value >= 25 ? '😰' : '😱'}
                      </div>
                      <div>
                        <CardTitle>恐惧与贪婪指数</CardTitle>
                        <CardDescription>市场情绪指标（数据来源: CoinMarketCap）</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-lg px-4 py-2 ${
                        data.fearGreedIndex.current.value >= 75
                          ? 'border-red-500 text-red-600'
                          : data.fearGreedIndex.current.value >= 55
                          ? 'border-orange-500 text-orange-600'
                          : data.fearGreedIndex.current.value >= 45
                          ? 'border-yellow-500 text-yellow-600'
                          : data.fearGreedIndex.current.value >= 25
                          ? 'border-blue-500 text-blue-600'
                          : 'border-purple-500 text-purple-600'
                      }`}
                    >
                      {data.fearGreedIndex.current.value_classification}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* 当前指数值 */}
                    <div className="flex items-center gap-6">
                      <div
                        className={`text-6xl font-bold ${
                          data.fearGreedIndex.current.value >= 75
                            ? 'text-red-600'
                            : data.fearGreedIndex.current.value >= 55
                            ? 'text-orange-600'
                            : data.fearGreedIndex.current.value >= 45
                            ? 'text-yellow-600'
                            : data.fearGreedIndex.current.value >= 25
                            ? 'text-blue-600'
                            : 'text-purple-600'
                        }`}
                      >
                        {data.fearGreedIndex.current.value}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground mb-2">
                          {data.fearGreedIndex.current.value >= 75
                            ? '市场极度贪婪，可能存在过热风险'
                            : data.fearGreedIndex.current.value >= 55
                            ? '市场情绪偏向贪婪，投资者信心较强'
                            : data.fearGreedIndex.current.value >= 45
                            ? '市场情绪中性，观望情绪浓厚'
                            : data.fearGreedIndex.current.value >= 25
                            ? '市场情绪偏向恐惧，可能存在抄底机会'
                            : '市场极度恐惧，恐慌性抛售明显'}
                        </div>
                        <Progress
                          value={data.fearGreedIndex.current.value}
                          className={`h-3 ${
                            data.fearGreedIndex.current.value >= 75
                              ? '[&>div]:bg-red-500'
                              : data.fearGreedIndex.current.value >= 55
                              ? '[&>div]:bg-orange-500'
                              : data.fearGreedIndex.current.value >= 45
                              ? '[&>div]:bg-yellow-500'
                              : data.fearGreedIndex.current.value >= 25
                              ? '[&>div]:bg-blue-500'
                              : '[&>div]:bg-purple-500'
                          }`}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>极度恐惧 (0)</span>
                          <span>中性 (50)</span>
                          <span>极度贪婪 (100)</span>
                        </div>
                      </div>
                    </div>

                    {/* 历史数据 */}
                    {data.fearGreedIndex.history.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-3">近期趋势</h4>
                        <div className="flex gap-1 overflow-x-auto pb-2">
                          {data.fearGreedIndex.history.slice(0, 30).map((item, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-center min-w-[24px]"
                              title={`${item.value} - ${item.value_classification}`}
                            >
                              <div
                                className={`w-5 h-5 rounded text-xs flex items-center justify-center text-white font-medium ${
                                  item.value >= 75
                                    ? 'bg-red-500'
                                    : item.value >= 55
                                    ? 'bg-orange-500'
                                    : item.value >= 45
                                    ? 'bg-yellow-500'
                                    : item.value >= 25
                                    ? 'bg-blue-500'
                                    : 'bg-purple-500'
                                }`}
                              >
                                {item.value}
                              </div>
                              {index % 7 === 0 && (
                                <span className="text-[10px] text-muted-foreground mt-1">
                                  {format(new Date(item.timestamp), 'MM/dd')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* DeFi 数据 */}
            {data?.defiData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <CardTitle>DeFi 市场数据</CardTitle>
                  </div>
                  <CardDescription>去中心化金融市场概览</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">DeFi 总市值</div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data.defiData.market_cap)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">24h 交易量</div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data.defiData.volume_24h)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">DeFi 主导地位</div>
                      <div className="text-2xl font-bold">
                        {data.defiData.dominance.toFixed(2)}%
                      </div>
                      <Progress value={data.defiData.dominance} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">头部 DeFi 项目</div>
                      <div className="text-2xl font-bold">{data.defiData.top_coin_name}</div>
                      <p className="text-xs text-muted-foreground">
                        占 DeFi 市值的 {data.defiData.top_coin_dominance.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 热门币种 */}
            {data?.trendingCoins && data.trendingCoins.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <CardTitle>热门搜索币种</CardTitle>
                  </div>
                  <CardDescription>过去24小时最受关注的加密货币</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {data.trendingCoins.map((coin, index) => (
                      <div
                        key={coin.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                          #{index + 1}
                        </div>
                        <div className="w-8 h-8 relative flex-shrink-0">
                          {coin.thumb ? (
                            <Image
                              src={coin.thumb}
                              alt={coin.name}
                              width={32}
                              height={32}
                              className="rounded-full"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-xs">
                              {coin.symbol.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{coin.name}</div>
                          <div className="text-xs text-muted-foreground uppercase">
                            {coin.symbol}
                          </div>
                        </div>
                        {coin.market_cap_rank > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            #{coin.market_cap_rank}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 市场主导地位 */}
            {data?.marketOverview && (
              <Card>
                <CardHeader>
                  <CardTitle>市场主导地位</CardTitle>
                  <CardDescription>主要加密货币的市值占比分布</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(data.marketOverview.market_cap_percentage)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([symbol, percentage]) => (
                        <div key={symbol} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium uppercase">{symbol}</span>
                            <span className="text-muted-foreground">
                              {percentage.toFixed(2)}%
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 市场趋势指标 */}
            {data?.marketTrends && (
              <Card>
                <CardHeader>
                  <CardTitle>市场趋势指标</CardTitle>
                  <CardDescription>市场结构和趋势分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">BTC 主导地位</div>
                      <div className="text-2xl font-bold">
                        {data.marketTrends.btc_dominance.toFixed(2)}%
                      </div>
                      <Progress value={data.marketTrends.btc_dominance} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        比特币市值占整个市场的比例
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">ETH 主导地位</div>
                      <div className="text-2xl font-bold">
                        {data.marketTrends.eth_dominance.toFixed(2)}%
                      </div>
                      <Progress value={data.marketTrends.eth_dominance} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        以太坊市值占整个市场的比例
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">山寨币总市值</div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data.marketTrends.altcoin_market_cap)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        除 BTC 和 ETH 外的其他加密货币总市值
                      </p>
                    </div>
                    {data.marketTrends.defi_market_cap !== undefined && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">DeFi 总市值</div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(data.marketTrends.defi_market_cap)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          去中心化金融协议的总市值
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 市场活跃度指标 */}
            {data?.marketActivity && (
              <Card>
                <CardHeader>
                  <CardTitle>市场活跃度指标</CardTitle>
                  <CardDescription>市场参与度和活跃程度</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">活跃加密货币</div>
                      <div className="text-2xl font-bold">
                        {data.marketActivity.active_cryptocurrencies.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        当前市场上有交易的加密货币总数
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">交易市场数量</div>
                      <div className="text-2xl font-bold">
                        {data.marketActivity.markets.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        全球加密货币交易市场总数
                      </p>
                    </div>
                    {data.marketActivity.ongoing_icos !== undefined && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">进行中的 ICO</div>
                        <div className="text-2xl font-bold">
                          {data.marketActivity.ongoing_icos}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          当前正在进行的首次代币发行
                        </p>
                      </div>
                    )}
                    {data.marketActivity.upcoming_icos !== undefined && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">即将开始的 ICO</div>
                        <div className="text-2xl font-bold">
                          {data.marketActivity.upcoming_icos}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          计划中的首次代币发行
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 数据说明 */}
            <Card>
              <CardHeader>
                <CardTitle>数据说明</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    <strong>数据来源：</strong>
                    所有市场数据来自 CoinGecko API，数据每 5 分钟自动更新并缓存到数据库。
                  </p>
                  <p>
                    <strong>DeFi 数据：</strong>
                    包括去中心化金融协议的总市值、交易量和市场主导地位。
                  </p>
                  <p>
                    <strong>市场趋势指标：</strong>
                    BTC/ETH 主导地位反映市场集中度，山寨币市值反映市场多样性。
                  </p>
                  <p>
                    <strong>热门币种：</strong>
                    基于 CoinGecko 搜索热度排名，反映市场关注焦点。
                  </p>
                  {data?.timestamp && (
                    <p className="pt-2 border-t">
                      <strong>最后更新：</strong>{' '}
                      {format(new Date(data.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </AuthenticatedLayout>
  )
}
