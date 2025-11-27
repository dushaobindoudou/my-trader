/**
 * K线图表组件
 * 支持不同时间周期的切换
 * 使用 OKX API 获取K线数据
 * 使用 lightweight-charts 绘制专业的K线图
 * 集成 MA, MACD, RSI 指标
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  HistogramData,
  Time, 
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CrosshairMode,
  LineStyle,
  SeriesMarker,
  LineData,
  WhitespaceData
} from 'lightweight-charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { KlineInterval } from '@/types/trading'
import { okx } from '@/services/okx'
import { useOKXCandleSubscription } from '@/hooks/use-okx-websocket'
import type { WebSocketMessage } from '@/services/okx-websocket'
import { Loader2, Activity, Settings } from 'lucide-react'
import { calculateSMA, calculateMACD, calculateRSI } from '@/lib/indicators'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface KlineChartProps {
  symbol: string
  defaultInterval?: KlineInterval
  height?: number
  markers?: SeriesMarker<Time>[]
}

// K线数据格式（与 OKX API 返回格式一致）
interface Candle {
  time: number // 秒级时间戳
  open: string
  high: string
  low: string
  close: string
  volume: string
}

const intervals: Array<{ value: KlineInterval; label: string }> = [
  { value: '1min', label: '1分钟' },
  { value: '5min', label: '5分钟' },
  { value: '1h', label: '1小时' },
  { value: '4h', label: '4小时' },
  { value: '1d', label: '1天' },
  { value: '3d', label: '3天' },
  { value: '1w', label: '1周' },
]

// 将内部时间周期映射到 OKX WebSocket 格式（index-candle 频道）
function mapIntervalToOKXWS(interval: KlineInterval): string {
  const mapping: Record<KlineInterval, string> = {
    '1min': '1m',
    '5min': '5m',
    '1h': '1H',
    '4h': '4H',
    '1d': '1D',
    '3d': '3D',
    '1w': '1W',
  }
  return mapping[interval] || '1H'
}

// 将交易对符号转换为 OKX 指数格式
function normalizeSymbol(symbol: string): string {
  if (symbol.includes('-')) {
    if (symbol.endsWith('-USDT')) {
      return symbol.replace('-USDT', '-USD')
    } else if (symbol.endsWith('-USD')) {
      return symbol
    } else {
      return symbol
    }
  } else {
    return `${symbol}-USD`
  }
}

export function KlineChart({ symbol, defaultInterval = '1h', height = 600, markers = [] }: KlineChartProps) {
  const [interval, setInterval] = useState<KlineInterval>(defaultInterval)
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // 指标开关状态
  const [showMA, setShowMA] = useState(true)
  const [showMACD, setShowMACD] = useState(true)
  const [showRSI, setShowRSI] = useState(true)
  const [containerReady, setContainerReady] = useState(false)
  
  // 图表引用
  const mainChartContainerRef = useRef<HTMLDivElement>(null)
  const macdChartContainerRef = useRef<HTMLDivElement>(null)
  const rsiChartContainerRef = useRef<HTMLDivElement>(null)
  
  const mainChartRef = useRef<IChartApi | null>(null)
  const macdChartRef = useRef<IChartApi | null>(null)
  const rsiChartRef = useRef<IChartApi | null>(null)
  
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  
  // MA Series
  const maSeriesRefs = useRef<{ [key: number]: ISeriesApi<'Line'> | null }>({})
  
  // MACD Series
  const macdSeriesRefs = useRef<{
    histogram: ISeriesApi<'Histogram'> | null,
    macd: ISeriesApi<'Line'> | null,
    signal: ISeriesApi<'Line'> | null
  }>({ histogram: null, macd: null, signal: null })
  
  // RSI Series
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  
  const hasReceivedInitialDataRef = useRef(false)
  const isFetchingMoreRef = useRef(false)
  const hasMoreDataRef = useRef(true)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSyncingRef = useRef(false)
  const candlesRef = useRef<Candle[]>([]) // 用于在回调中访问最新的 candles
  const loadMoreHistoryRef = useRef<(() => Promise<void>) | null>(null) // 用于在回调中访问最新的 loadMoreHistory
  
  // 批量获取 K 线数据（OKX API 单次最多 100 条）
  const fetchKlinesBatch = useCallback(async (
    symbol: string,
    interval: KlineInterval,
    totalLimit: number,
    before?: number
  ): Promise<Candle[]> => {
    const allData: Candle[] = []
    const batchSize = 100 // OKX 单次最大限制
    const batches = Math.ceil(totalLimit / batchSize)
    let currentBefore = before
    
    for (let i = 0; i < batches; i++) {
      const limit = i === batches - 1 ? totalLimit - allData.length : batchSize
      const batchData = await okx.getKlines(symbol, interval, limit, undefined, currentBefore)
      
      if (batchData.length === 0) break
      
      // okx.getKlines 已经返回正序数据（从旧到新），直接使用
      allData.push(...batchData)
      
      // 更新 before 为最早的时间戳（毫秒），用于获取更早的数据
      if (batchData.length > 0) {
        currentBefore = batchData[0].time * 1000
      }
      
      // 如果返回的数据少于请求的数量，说明没有更多数据了
      if (batchData.length < limit) break
      
      // 添加小延迟，避免请求过快
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    // 确保数据按时间正序排列（从旧到新）
    return allData.sort((a, b) => a.time - b.time)
  }, [])
  
  // 从 OKX REST API 获取初始历史数据
  const fetchInitialKlines = useCallback(async () => {
    if (!symbol) return

    try {
      setError(null)
      setLoading(true)
      
      console.log('[KlineChart] Fetching initial klines for', symbol, interval)
      
      // 根据时间周期动态调整初始加载数量
      // 短周期（1min, 5min）需要更多数据，长周期（1d, 1w）可以少一些
      let initialLimit = 5000 // 默认 5000 条
      if (interval === '1min') {
        initialLimit = 10000 // 1分钟周期加载 10000 条（约 7 天）
      } else if (interval === '5min') {
        initialLimit = 8000 // 5分钟周期加载 8000 条（约 28 天）
      } else if (interval === '1h') {
        initialLimit = 5000 // 1小时周期加载 5000 条（约 208 天）
      } else if (interval === '4h') {
        initialLimit = 3000 // 4小时周期加载 3000 条（约 500 天）
      } else if (interval === '1d') {
        initialLimit = 2000 // 1天周期加载 2000 条（约 5.5 年）
      } else {
        initialLimit = 1500 // 其他周期加载 1500 条
      }
      
      // 获取初始历史数据
      const data = await fetchKlinesBatch(symbol, interval, initialLimit)
      
      console.log('[KlineChart] Received data:', data.length, 'candles')
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('[KlineChart] First candle:', data[0])
        console.log('[KlineChart] Last candle:', data[data.length - 1])
        setCandles(data)
        hasReceivedInitialDataRef.current = true
        hasMoreDataRef.current = true
        setLoading(false)
      } else {
        console.error('[KlineChart] No data received')
        setError('无法获取 K 线数据')
        setLoading(false)
      }
    } catch (err) {
      console.error('[KlineChart] Error fetching klines:', err)
      setError(err instanceof Error ? err.message : '无法获取 K 线数据')
      setLoading(false)
    }
  }, [symbol, interval, fetchKlinesBatch])

  // 加载更多历史数据（使用 ref 避免重建图表）
  const loadMoreHistory = useCallback(async () => {
    const currentCandles = candlesRef.current
    if (isFetchingMoreRef.current || !hasMoreDataRef.current || currentCandles.length === 0) return
    
    try {
      isFetchingMoreRef.current = true
      const oldestCandle = currentCandles[0]
      let currentBefore = oldestCandle.time * 1000
      const allNewData: Candle[] = []
      
      // 根据时间周期动态调整每次加载的数量
      let loadMoreLimit = 5000 // 默认每次加载 5000 条
      if (interval === '1min') {
        loadMoreLimit = 10000 // 1分钟周期每次加载 10000 条
      } else if (interval === '5min') {
        loadMoreLimit = 8000 // 5分钟周期每次加载 8000 条
      } else if (interval === '1h') {
        loadMoreLimit = 5000 // 1小时周期每次加载 5000 条
      } else if (interval === '4h') {
        loadMoreLimit = 3000 // 4小时周期每次加载 3000 条
      } else if (interval === '1d') {
        loadMoreLimit = 2000 // 1天周期每次加载 2000 条
      }
      
      // 连续调用2次，获取更早的数据
      for (let i = 0; i < 2; i++) {
        // 批量获取更早的数据
        const data = await fetchKlinesBatch(symbol, interval, loadMoreLimit, currentBefore)
        
        if (Array.isArray(data) && data.length > 0) {
          // 过滤掉重复数据（如果有）
          const newData = data.filter(item => item.time < (i === 0 ? oldestCandle.time : currentBefore / 1000))
          
          if (newData.length > 0) {
            allNewData.push(...newData)
            // 更新 currentBefore 为本次获取的最早时间戳，用于下次调用
            currentBefore = newData[0].time * 1000
            
            // 如果返回的数据少于请求的数量，说明没有更多数据了
            if (data.length < loadMoreLimit) {
              hasMoreDataRef.current = false
              break
            }
          } else {
            hasMoreDataRef.current = false
            break
          }
        } else {
          hasMoreDataRef.current = false
          break
        }
        
        // 在两次调用之间添加小延迟，避免请求过快
        if (i < 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // 合并所有新数据并更新状态
      if (allNewData.length > 0) {
        // 去重并排序
        const uniqueNewData = allNewData
          .filter((v, i, a) => a.findIndex(t => t.time === v.time) === i)
          .sort((a, b) => a.time - b.time)
        
        setCandles(prev => {
          // 确保新数据的时间都小于现有数据的最早时间
          const filteredNewData = uniqueNewData.filter(item => item.time < prev[0]?.time)
          if (filteredNewData.length > 0) {
            return [...filteredNewData, ...prev]
          }
          return prev
        })
      } else {
        hasMoreDataRef.current = false
      }
    } catch (err) {
      console.error('Failed to load more history:', err)
    } finally {
      isFetchingMoreRef.current = false
    }
  }, [symbol, interval, fetchKlinesBatch])

  // WebSocket 消息处理
  const handleCandleMessage = useCallback(
    (message: WebSocketMessage) => {
      if (message.channel === 'subscriptionResponse') {
        setIsConnected(true)
        if (!hasReceivedInitialDataRef.current) {
          setLoading(true)
        }
        return
      }

      if ((message.channel.startsWith('candles:') || message.channel.startsWith('index-candle')) && message.data) {
        setIsConnected(true)
        
        let candleData: Candle[] = []
        if (Array.isArray(message.data)) {
          candleData = message.data.map((item: any) => ({
            time: item.time,
            open: String(item.open || 0),
            high: String(item.high || 0),
            low: String(item.low || 0),
            close: String(item.close || 0),
            volume: String(item.volume || 0),
          }))
        }

        if (candleData.length > 0) {
          setCandles((prev) => {
            if (prev.length === 0 && candleData.length > 0) {
              hasReceivedInitialDataRef.current = true
              setLoading(false)
              return candleData.sort((a, b) => a.time - b.time)
            }

            const updated = [...prev]
            candleData.forEach((newCandle) => {
              const index = updated.findIndex((c) => c.time === newCandle.time)
              if (index >= 0) {
                updated[index] = newCandle
              } else {
                updated.push(newCandle)
              }
            })
            return updated.sort((a, b) => a.time - b.time)
          })
          setError(null)
        }
      }
    },
    []
  )

  // 订阅 WebSocket
  const normalizedSymbol = normalizeSymbol(symbol)
  const wsInterval = mapIntervalToOKXWS(interval)
  useOKXCandleSubscription(
    normalizedSymbol,
    wsInterval,
    handleCandleMessage,
    !!symbol
  )

  // 同步 candles 到 ref
  useEffect(() => {
    candlesRef.current = candles
  }, [candles])
  
  // 同步 loadMoreHistory 到 ref
  useEffect(() => {
    loadMoreHistoryRef.current = loadMoreHistory
  }, [loadMoreHistory])

  // 检查容器是否准备好
  useEffect(() => {
    if (mainChartContainerRef.current) {
      const checkReady = (): boolean => {
        const container = mainChartContainerRef.current
        if (container && container.clientWidth > 0 && container.clientHeight > 0) {
          console.log('[KlineChart] Container is ready:', {
            width: container.clientWidth,
            height: container.clientHeight,
          })
          setContainerReady(true)
          return true
        }
        return false
      }
      
      // 立即检查
      if (checkReady()) {
        return // 已经准备好了，不需要监听
      }
      
      // 如果还没准备好，使用 ResizeObserver 监听
      const observer = new ResizeObserver(() => {
        checkReady()
      })
      observer.observe(mainChartContainerRef.current)
      
      // 也使用定时器作为备用
      const timer = window.setInterval(() => {
        checkReady()
      }, 100)
      
      return () => {
        observer.disconnect()
        window.clearInterval(timer)
      }
    } else {
      setContainerReady(false)
    }
  }, [loading]) // 当 loading 状态改变时重新检查

  // 初始化和清理
  useEffect(() => {
    if (!symbol) return
    
    // 重置所有状态
    setCandles([])
    setLoading(true)
    setError(null)
    setIsConnected(false)
    setContainerReady(false) // 重置容器准备状态
    hasReceivedInitialDataRef.current = false
    isFetchingMoreRef.current = false
    hasMoreDataRef.current = true
    
    fetchInitialKlines()
  }, [symbol, interval, fetchInitialKlines])

  // 图表初始化和同步
  useEffect(() => {
    console.log('[KlineChart] Chart initialization effect triggered', {
      containerReady,
      hasContainer: !!mainChartContainerRef.current,
      containerWidth: mainChartContainerRef.current?.clientWidth,
      containerHeight: mainChartContainerRef.current?.clientHeight,
    })
    
    if (!containerReady || !mainChartContainerRef.current) {
      console.log('[KlineChart] Container not ready yet, skipping initialization')
      return
    }

    console.log('[KlineChart] Creating charts...')
    
    // 清理旧图表
    if (mainChartRef.current) {
      mainChartRef.current.remove()
      mainChartRef.current = null
    }
    if (macdChartRef.current) {
      macdChartRef.current.remove()
      macdChartRef.current = null
    }
    if (rsiChartRef.current) {
      rsiChartRef.current.remove()
      rsiChartRef.current = null
    }

    // 通用配置
    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: '#0f0f0f' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#363c4e', visible: true },
        horzLines: { color: '#363c4e', visible: true },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#4c4c4c',
      },
      rightPriceScale: {
        borderColor: '#4c4c4c',
        autoScale: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
    }

    // 1. 主图表
    const mainChartHeight = showMACD || showRSI ? Math.floor(height * 0.6) : height
    const mainChart = createChart(mainChartContainerRef.current, {
      ...chartOptions,
      height: mainChartHeight,
      width: mainChartContainerRef.current.clientWidth,
    })
    mainChartRef.current = mainChart
    console.log('[KlineChart] Main chart created:', { height: mainChartHeight, width: mainChartContainerRef.current.clientWidth })

    const candlestickSeries = mainChart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })
    candlestickSeriesRef.current = candlestickSeries

    const volumeSeries = mainChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume', // 独立 scale
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      visible: false,
    })
    volumeSeriesRef.current = volumeSeries

    // MA Series 初始化（根据当前状态设置可见性）
    const maColors = { 10: '#E91E63', 60: '#FF9800', 120: '#2196F3', 200: '#9C27B0' }
    const currentShowMA = showMA // 捕获当前状态
    ;[10, 60, 120, 200].forEach(period => {
      maSeriesRefs.current[period] = mainChart.addSeries(LineSeries, {
        color: maColors[period as keyof typeof maColors],
        lineWidth: 1,
        visible: currentShowMA,
        priceScaleId: 'right',
      })
    })

    // 2. MACD 图表
    if (macdChartContainerRef.current && showMACD) {
      const macdChart = createChart(macdChartContainerRef.current, {
        ...chartOptions,
        height: Math.floor(height * 0.2), // MACD 占 20%
        width: macdChartContainerRef.current.clientWidth,
      })
      macdChartRef.current = macdChart
      
      macdSeriesRefs.current.histogram = macdChart.addSeries(HistogramSeries, { color: '#26a69a' })
      macdSeriesRefs.current.macd = macdChart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1 })
      macdSeriesRefs.current.signal = macdChart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 1 })
    }

    // 3. RSI 图表
    if (rsiChartContainerRef.current && showRSI) {
      const rsiChart = createChart(rsiChartContainerRef.current, {
        ...chartOptions,
        height: Math.floor(height * 0.2), // RSI 占 20%
        width: rsiChartContainerRef.current.clientWidth,
      })
      rsiChartRef.current = rsiChart
      
      // 添加 RSI 参考线 (70, 30)
      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: '#7E57C2',
        lineWidth: 1,
      })
      rsiSeriesRef.current = rsiSeries
      
      // 可以添加固定的水平线作为参考
      // lightweight-charts 不支持直接添加静态线，可以通过 createPriceLine 在数据加载后添加
    }

    // 4. 同步时间轴（修复拖动 bug）
    const charts = [mainChart, macdChartRef.current, rsiChartRef.current].filter(Boolean) as IChartApi[]
    
    // 使用防抖和标志位避免循环触发
    charts.forEach((chart, chartIndex) => {
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (!range || isSyncingRef.current) return
        
        // 清除之前的定时器
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current)
        }
        
        // 防抖处理
        syncTimeoutRef.current = setTimeout(() => {
          isSyncingRef.current = true
          
          try {
            // 同步其他图表
            charts.forEach((c, idx) => {
              if (c !== chart && c) {
                const currentRange = c.timeScale().getVisibleLogicalRange()
                // 只有当范围真正不同时才更新，避免循环触发
                if (!currentRange || 
                    currentRange.from !== range.from || 
                    currentRange.to !== range.to) {
                  c.timeScale().setVisibleLogicalRange(range)
                }
              }
            })
            
            // 滚动加载逻辑（只在主图表滚动到最左侧时触发）
            if (range.from < 10 && chart === mainChart && !isFetchingMoreRef.current) {
              loadMoreHistoryRef.current?.()
            }
          } finally {
            // 延迟重置标志位，确保同步完成
            setTimeout(() => {
              isSyncingRef.current = false
            }, 50)
          }
        }, 10) // 10ms 防抖
      })
    })

    // 响应式调整 - 使用 ResizeObserver
    const resizeObservers: ResizeObserver[] = []
    
    if (mainChartContainerRef.current) {
      const mainObserver = new ResizeObserver((entries) => {
        if (entries[0] && mainChartRef.current) {
          const { width, height } = entries[0].contentRect
          mainChartRef.current.applyOptions({ width, height: mainChartHeight })
        }
      })
      mainObserver.observe(mainChartContainerRef.current)
      resizeObservers.push(mainObserver)
    }
    
    if (macdChartContainerRef.current && showMACD) {
      const macdObserver = new ResizeObserver((entries) => {
        if (entries[0] && macdChartRef.current) {
          const { width } = entries[0].contentRect
          macdChartRef.current.applyOptions({ width })
        }
      })
      macdObserver.observe(macdChartContainerRef.current)
      resizeObservers.push(macdObserver)
    }
    
    if (rsiChartContainerRef.current && showRSI) {
      const rsiObserver = new ResizeObserver((entries) => {
        if (entries[0] && rsiChartRef.current) {
          const { width } = entries[0].contentRect
          rsiChartRef.current.applyOptions({ width })
        }
      })
      rsiObserver.observe(rsiChartContainerRef.current)
      resizeObservers.push(rsiObserver)
    }
    
    // 保留 window resize 作为备用
    const handleResize = () => {
      if (mainChartContainerRef.current && mainChartRef.current) {
        mainChartRef.current.applyOptions({ width: mainChartContainerRef.current.clientWidth })
      }
      if (macdChartContainerRef.current && macdChartRef.current) {
        macdChartRef.current.applyOptions({ width: macdChartContainerRef.current.clientWidth })
      }
      if (rsiChartContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({ width: rsiChartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObservers.forEach(observer => observer.disconnect())
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }
      mainChart.remove()
      macdChartRef.current?.remove()
      rsiChartRef.current?.remove()
      
      // 清理引用
      mainChartRef.current = null
      macdChartRef.current = null
      rsiChartRef.current = null
      isSyncingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerReady, height, showMACD, showRSI]) // 添加 containerReady 依赖

  // 单独处理 MA 系列的显示/隐藏（避免重建图表）
  useEffect(() => {
    // 只在图表已初始化后更新
    if (mainChartRef.current) {
      Object.values(maSeriesRefs.current).forEach(series => {
        if (series) {
          series.applyOptions({ visible: showMA })
        }
      })
    }
  }, [showMA])

  // 数据更新和指标计算
  useEffect(() => {
    console.log('[KlineChart] Data update effect triggered, candles count:', candles.length)
    
    if (candles.length === 0) {
      console.log('[KlineChart] No candles to display')
      return
    }
    
    // 确保数据唯一且排序，避免 "data must be asc ordered by time" 错误
    const uniqueCandles = candles
      .filter((v, i, a) => a.findIndex(t => t.time === v.time) === i) // 去重：保留每个时间戳的第一个
      .sort((a, b) => a.time - b.time) // 按时间排序
    
    console.log('[KlineChart] Unique candles:', uniqueCandles.length)
    console.log('[KlineChart] Time range:', {
      first: new Date(uniqueCandles[0]?.time * 1000).toISOString(),
      last: new Date(uniqueCandles[uniqueCandles.length - 1]?.time * 1000).toISOString()
    })
    
    const closePrices = uniqueCandles.map(c => parseFloat(c.close))
    
    // 1. 更新 K 线数据
    const candlestickData = uniqueCandles.map(c => ({
      time: c.time as Time,
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close),
    }))
    
    console.log('[KlineChart] Setting candlestick data:', candlestickData.length, 'items')
    if (candlestickData.length > 0) {
      console.log('[KlineChart] First candlestick:', candlestickData[0])
      console.log('[KlineChart] Last candlestick:', candlestickData[candlestickData.length - 1])
    }
    
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(candlestickData)
      console.log('[KlineChart] Candlestick data set successfully')
    } else {
      console.warn('[KlineChart] candlestickSeriesRef is null')
    }
    
    // 设置 Markers
    if (markers.length > 0 && candlestickSeriesRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (candlestickSeriesRef.current as any).setMarkers(markers)
    }

    // 2. 更新成交量
    const volumeData = uniqueCandles.map(c => ({
      time: c.time as Time,
      value: parseFloat(c.volume),
      color: parseFloat(c.close) >= parseFloat(c.open) ? '#26a69a80' : '#ef535080',
    }))
    volumeSeriesRef.current?.setData(volumeData)

    // 3. 更新 MA
    if (showMA) {
      [10, 60, 120, 200].forEach(period => {
        const series = maSeriesRefs.current[period]
        if (series) {
          const maData = calculateSMA(closePrices, period)
          const lineData: (LineData | WhitespaceData)[] = uniqueCandles.map((c, i) => ({
             time: c.time as Time,
             value: maData[i] ?? NaN // 使用 NaN 这里的类型定义可能需要注意，lightweight-charts 可能不接受 null/NaN
          })).filter(d => !isNaN(d.value as number)) // 过滤掉无效数据
          series.setData(lineData as LineData[])
        }
      })
    }

    // 4. 更新 MACD
    if (showMACD && macdSeriesRefs.current.macd) {
      const { macd, signal, histogram } = calculateMACD(closePrices)
      
      const macdData = uniqueCandles.map((c, i) => ({ time: c.time as Time, value: macd[i] ?? NaN })).filter(d => !isNaN(d.value as number))
      const signalData = uniqueCandles.map((c, i) => ({ time: c.time as Time, value: signal[i] ?? NaN })).filter(d => !isNaN(d.value as number))
      const histogramData = uniqueCandles.map((c, i) => ({ 
        time: c.time as Time, 
        value: histogram[i] ?? NaN,
        color: (histogram[i] ?? 0) >= 0 ? '#26a69a' : '#ef5350'
      })).filter(d => !isNaN(d.value as number))
      
      macdSeriesRefs.current.macd?.setData(macdData as LineData[])
      macdSeriesRefs.current.signal?.setData(signalData as LineData[])
      macdSeriesRefs.current.histogram?.setData(histogramData as HistogramData[])
    }

    // 5. 更新 RSI
    if (showRSI && rsiSeriesRef.current) {
      const rsi = calculateRSI(closePrices)
      const rsiData = uniqueCandles.map((c, i) => ({ time: c.time as Time, value: rsi[i] ?? NaN })).filter(d => !isNaN(d.value as number))
      rsiSeriesRef.current.setData(rsiData as LineData[])
      
      // 添加 30/70 参考线 (lightweight-charts 没有原生参考线，可以用 createPriceLine 但只在 LineSeries 上有效)
      // 这里简单处理，可以考虑添加恒定值的 LineSeries 但性能不好。
      // 正规做法是利用 Primitive 或 createPriceLine，但这里为了简便省略。
    }
    
  }, [candles, showMA, showMACD, showRSI, markers])

  // 计算当前价格信息
  const currentPrice = candles.length > 0 ? parseFloat(candles[candles.length - 1].close) : null
  const priceChange = candles.length > 1 
    ? parseFloat(candles[candles.length - 1].close) - parseFloat(candles[0].close)
    : 0
  const priceChangePercent = candles.length > 1 && parseFloat(candles[0].close) !== 0
    ? ((priceChange / parseFloat(candles[0].close)) * 100).toFixed(2)
    : '0.00'

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {symbol}
              <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1 text-xs font-normal">
                <Activity className="h-3 w-3" />
                {isConnected ? '已连接' : '未连接'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {currentPrice !== null && (
                <span className="text-lg font-semibold">
                  ${currentPrice.toFixed(2)}{' '}
                  <span className={priceChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {priceChange >= 0 ? '+' : ''}{priceChangePercent}%
                  </span>
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* 指标设置 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Settings className="h-3.5 w-3.5" />
                  指标
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">技术指标</h4>
                    <p className="text-sm text-muted-foreground">显示/隐藏图表指标</p>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-ma">MA (10/60/120/200)</Label>
                      <Switch id="show-ma" checked={showMA} onCheckedChange={setShowMA} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-macd">MACD</Label>
                      <Switch id="show-macd" checked={showMACD} onCheckedChange={setShowMACD} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-rsi">RSI</Label>
                      <Switch id="show-rsi" checked={showRSI} onCheckedChange={setShowRSI} />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Select value={interval} onValueChange={(value) => setInterval(value as KlineInterval)}>
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervals.map((int) => (
                  <SelectItem key={int.value} value={int.value}>{int.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex h-[500px] items-center justify-center text-red-500">{error}</div>
        ) : loading && candles.length === 0 ? (
          <div className="flex h-[500px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {/* 主图表 (K线 + MA) */}
            <div 
              ref={mainChartContainerRef} 
              className="w-full"
              style={{ 
                height: `${showMACD || showRSI ? Math.floor(height * 0.6) : height}px`,
                minHeight: `${showMACD || showRSI ? Math.floor(height * 0.6) : height}px`
              }} 
            />
            
            {/* MACD */}
            {showMACD && (
              <div 
                ref={macdChartContainerRef} 
                className="w-full"
                style={{ 
                  height: `${Math.floor(height * 0.2)}px`,
                  minHeight: `${Math.floor(height * 0.2)}px`
                }} 
              />
            )}
            
            {/* RSI */}
            {showRSI && (
              <div 
                ref={rsiChartContainerRef} 
                className="w-full"
                style={{ 
                  height: `${Math.floor(height * 0.2)}px`,
                  minHeight: `${Math.floor(height * 0.2)}px`
                }} 
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
