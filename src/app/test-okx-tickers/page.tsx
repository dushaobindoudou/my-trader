'use client'

import { useState, useEffect, useRef } from 'react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, Play, Square } from 'lucide-react'
import { getOKXWebSocketClient, WebSocketMessage, TickersSubscription } from '@/services/okx-websocket'

export default function TestOKXTickersPage() {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<Array<{ time: number; channel: string; data: any }>>([])
  const [error, setError] = useState<string | null>(null)
  const [subscribedBTC, setSubscribedBTC] = useState(false)
  const [subscribedSPOT, setSubscribedSPOT] = useState(false)
  const unsubscribeBTCRef = useRef<(() => void) | null>(null)
  const unsubscribeSPOTRef = useRef<(() => void) | null>(null)

  const client = getOKXWebSocketClient()

  useEffect(() => {
    // 设置连接回调
    client.onConnect(() => {
      console.log('OKX WebSocket: Connected')
      setConnected(true)
      setError(null)
    })

    // 设置断开连接回调
    client.onDisconnect(() => {
      console.log('OKX WebSocket: Disconnected')
      setConnected(false)
    })

    // 设置错误回调
    client.onError((err) => {
      console.error('OKX WebSocket: Error', err)
      setError(err.message)
    })

    // 清理函数
    return () => {
      if (unsubscribeBTCRef.current) {
        unsubscribeBTCRef.current()
      }
      if (unsubscribeSPOTRef.current) {
        unsubscribeSPOTRef.current()
      }
    }
  }, [])

  const handleConnect = async () => {
    try {
      setError(null)
      await client.connect()
    } catch (err: any) {
      setError(err.message || '连接失败')
    }
  }

  const handleDisconnect = () => {
    if (unsubscribeBTCRef.current) {
      unsubscribeBTCRef.current()
      unsubscribeBTCRef.current = null
    }
    if (unsubscribeSPOTRef.current) {
      unsubscribeSPOTRef.current()
      unsubscribeSPOTRef.current = null
    }
    setSubscribedBTC(false)
    setSubscribedSPOT(false)
    client.disconnect()
  }

  const handleSubscribeBTC = () => {
    if (!connected) {
      setError('请先连接 WebSocket')
      return
    }

    const subscription: TickersSubscription = {
      channel: 'tickers',
      instId: 'BTC-USDT',
    }

    const unsubscribe = client.subscribe(subscription, (message: WebSocketMessage) => {
      console.log('OKX WebSocket: BTC-USDT Ticker message', message)
      setMessages((prev) => [
        {
          time: Date.now(),
          channel: message.channel,
          data: message.data,
        },
        ...prev.slice(0, 49), // 只保留最近 50 条消息
      ])
    })

    unsubscribeBTCRef.current = unsubscribe
    setSubscribedBTC(true)
  }

  const handleSubscribeSPOT = () => {
    if (!connected) {
      setError('请先连接 WebSocket')
      return
    }

    const unsubscribe = client.subscribeSpotUSDTTickers((message: WebSocketMessage) => {
      console.log('OKX WebSocket: SPOT USDT Tickers message', message)
      setMessages((prev) => [
        {
          time: Date.now(),
          channel: message.channel,
          data: message.data,
        },
        ...prev.slice(0, 49), // 只保留最近 50 条消息
      ])
    })

    unsubscribeSPOTRef.current = unsubscribe
    setSubscribedSPOT(true)
  }

  const handleUnsubscribeBTC = () => {
    if (unsubscribeBTCRef.current) {
      unsubscribeBTCRef.current()
      unsubscribeBTCRef.current = null
      setSubscribedBTC(false)
    }
  }

  const handleUnsubscribeSPOT = () => {
    if (unsubscribeSPOTRef.current) {
      unsubscribeSPOTRef.current()
      unsubscribeSPOTRef.current = null
      setSubscribedSPOT(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">OKX Tickers WebSocket 测试</h1>
          <p className="text-muted-foreground">测试 OKX WebSocket Tickers 订阅功能</p>
        </div>

        <div className="grid gap-6">
          {/* 连接控制 */}
          <Card>
            <CardHeader>
              <CardTitle>连接控制</CardTitle>
              <CardDescription>管理 WebSocket 连接状态</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {connected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    连接状态: {connected ? '已连接' : '未连接'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {!connected ? (
                  <Button onClick={handleConnect}>
                    <Play className="mr-2 h-4 w-4" />
                    连接
                  </Button>
                ) : (
                  <Button onClick={handleDisconnect} variant="destructive">
                    <Square className="mr-2 h-4 w-4" />
                    断开连接
                  </Button>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 订阅控制 */}
          {connected && (
            <Card>
              <CardHeader>
                <CardTitle>订阅控制</CardTitle>
                <CardDescription>订阅 Tickers 数据流</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">BTC-USDT Ticker</p>
                      <p className="text-xs text-muted-foreground">
                        订阅单个交易对的 ticker 数据
                      </p>
                    </div>
                    {subscribedBTC ? (
                      <Button onClick={handleUnsubscribeBTC} variant="outline" size="sm">
                        取消订阅
                      </Button>
                    ) : (
                      <Button onClick={handleSubscribeBTC} size="sm">
                        订阅
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">SPOT USDT Tickers</p>
                      <p className="text-xs text-muted-foreground">
                        订阅所有币币（SPOT）频道的 USDT 交易对
                      </p>
                    </div>
                    {subscribedSPOT ? (
                      <Button onClick={handleUnsubscribeSPOT} variant="outline" size="sm">
                        取消订阅
                      </Button>
                    ) : (
                      <Button onClick={handleSubscribeSPOT} size="sm">
                        订阅
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 消息列表 */}
          {messages.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>接收到的消息</CardTitle>
                    <CardDescription>
                      共 {messages.length} 条消息（最多显示 50 条）
                    </CardDescription>
                  </div>
                  <Button onClick={clearMessages} variant="outline" size="sm">
                    清空
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className="p-3 bg-muted rounded text-sm space-y-1 border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-muted-foreground">
                          {new Date(msg.time).toLocaleTimeString()}
                        </span>
                        <span className="font-medium">{msg.channel}</span>
                      </div>
                      <pre className="text-xs overflow-auto max-h-[200px]">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}

