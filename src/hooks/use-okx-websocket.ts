/**
 * OKX WebSocket Hook
 * 用于在 React 组件中管理 WebSocket 连接和订阅
 */

import { useEffect, useRef, useCallback } from 'react'
import {
  getOKXWebSocketClient,
  type Subscription,
  type MessageCallback,
  type WebSocketMessage,
} from '@/services/okx-websocket'

export interface UseWebSocketOptions {
  autoConnect?: boolean
  onError?: (error: Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

/**
 * 使用 OKX WebSocket 的 Hook
 */
export function useOKXWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, onError, onConnect, onDisconnect } = options
  const clientRef = useRef(getOKXWebSocketClient())
  const callbacksRef = useRef<Map<string, Set<MessageCallback>>>(new Map())

  useEffect(() => {
    const client = clientRef.current

    // 设置回调
    if (onError) {
      client.onError(onError)
    }
    if (onConnect) {
      client.onConnect(onConnect)
    }
    if (onDisconnect) {
      client.onDisconnect(onDisconnect)
    }

    // 自动连接
    if (autoConnect) {
      client.connect().catch((error) => {
        if (onError) {
          onError(error)
        }
      })
    }

    // 清理函数
    return () => {
      callbacksRef.current.clear()
    }
  }, [autoConnect, onError, onConnect, onDisconnect])

  /**
   * 订阅数据流
   */
  const subscribe = useCallback(
    (subscription: Subscription, callback: MessageCallback) => {
      const client = clientRef.current
      const key = getSubscriptionKey(subscription)

      // 存储回调
      if (!callbacksRef.current.has(key)) {
        callbacksRef.current.set(key, new Set())
      }
      callbacksRef.current.get(key)!.add(callback)

      // 订阅
      const unsubscribe = client.subscribe(subscription, callback)

      // 返回取消订阅函数
      return () => {
        const callbacks = callbacksRef.current.get(key)
        if (callbacks) {
          callbacks.delete(callback)
          if (callbacks.size === 0) {
            callbacksRef.current.delete(key)
          }
        }
        unsubscribe()
      }
    },
    []
  )

  /**
   * 取消订阅
   */
  const unsubscribe = useCallback((subscription: Subscription, callback: MessageCallback) => {
    const client = clientRef.current
    const key = getSubscriptionKey(subscription)

    const callbacks = callbacksRef.current.get(key)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        callbacksRef.current.delete(key)
      }
    }

    client.unsubscribe(subscription, callback)
  }, [])

  /**
   * 检查连接状态
   */
  const isConnected = useCallback(() => {
    return clientRef.current.isConnected()
  }, [])

  /**
   * 手动连接
   */
  const connect = useCallback(() => {
    return clientRef.current.connect()
  }, [])

  /**
   * 手动断开连接
   */
  const disconnect = useCallback(() => {
    clientRef.current.disconnect()
  }, [])

  return {
    subscribe,
    unsubscribe,
    isConnected,
    connect,
    disconnect,
  }
}

/**
 * 订阅 K线数据的 Hook（使用 index-candle 频道）
 */
export function useOKXCandleSubscription(
  instId: string,
  interval: string,
  onMessage: (message: WebSocketMessage) => void,
  enabled: boolean = true
) {
  const { subscribe } = useOKXWebSocket({ autoConnect: enabled })

  useEffect(() => {
    if (!enabled || !instId || !interval) {
      return
    }

    const subscription: Subscription = {
      channel: 'index-candle',
      instId,
      interval,
    }

    const unsubscribe = subscribe(subscription, onMessage)

    return () => {
      unsubscribe()
    }
  }, [instId, interval, enabled, subscribe, onMessage])
}

/**
 * 订阅交易数据的 Hook
 */
export function useOKXTradesSubscription(
  instId: string,
  onMessage: (message: WebSocketMessage) => void,
  enabled: boolean = true
) {
  const { subscribe } = useOKXWebSocket({ autoConnect: enabled })

  useEffect(() => {
    if (!enabled || !instId) {
      return
    }

    const subscription: Subscription = {
      channel: 'trades',
      instId,
    }

    const unsubscribe = subscribe(subscription, onMessage)

    return () => {
      unsubscribe()
    }
  }, [instId, enabled, subscribe, onMessage])
}

/**
 * 订阅订单簿数据的 Hook
 */
export function useOKXBooksSubscription(
  instId: string,
  onMessage: (message: WebSocketMessage) => void,
  enabled: boolean = true,
  depth?: number
) {
  const { subscribe } = useOKXWebSocket({ autoConnect: enabled })

  useEffect(() => {
    if (!enabled || !instId) {
      return
    }

    const subscription: Subscription = {
      channel: 'books',
      instId,
      depth,
    }

    const unsubscribe = subscribe(subscription, onMessage)

    return () => {
      unsubscribe()
    }
  }, [instId, enabled, depth, subscribe, onMessage])
}

/**
 * 生成订阅键
 */
function getSubscriptionKey(subscription: Subscription): string {
  if (subscription.channel === 'candles') {
    const interval = subscription.interval || '1H'
    return `candles:${interval}:${subscription.instId}`
  }
  if (subscription.channel === 'books') {
    const depth = (subscription as any).depth
    return depth ? `books${depth}:${subscription.instId}` : `books:${subscription.instId}`
  }
  return `${subscription.channel}:${subscription.instId}`
}

