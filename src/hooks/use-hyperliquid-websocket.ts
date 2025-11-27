/**
 * Hyperliquid WebSocket Hook
 * 用于在 React 组件中管理 WebSocket 连接和订阅
 */

import { useEffect, useRef, useCallback } from 'react'
import {
  getWebSocketClient,
  type Subscription,
  type MessageCallback,
  type WebSocketMessage,
} from '@/services/hyperliquid-websocket'

export interface UseWebSocketOptions {
  autoConnect?: boolean
  onError?: (error: Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

/**
 * 使用 Hyperliquid WebSocket 的 Hook
 */
export function useHyperliquidWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, onError, onConnect, onDisconnect } = options
  const clientRef = useRef(getWebSocketClient())
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
        console.error('Failed to connect WebSocket:', error)
        if (onError) {
          onError(error)
        }
      })
    }

    // 清理函数
    return () => {
      // 取消所有订阅
      callbacksRef.current.forEach((callbacks, key) => {
        callbacks.forEach((callback) => {
          // 这里需要知道对应的 subscription，但我们已经存储了
          // 为了简化，我们可以在订阅时存储 subscription
        })
      })
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
 * 订阅 K线数据的 Hook
 */
export function useCandleSubscription(
  coin: string,
  interval: string,
  onMessage: (message: WebSocketMessage) => void,
  enabled: boolean = true
) {
  const { subscribe } = useHyperliquidWebSocket({ autoConnect: enabled })

  useEffect(() => {
    if (!enabled || !coin || !interval) {
      return
    }

    const subscription = {
      type: 'candle' as const,
      coin,
      interval,
    }

    const unsubscribe = subscribe(subscription, onMessage)

    return () => {
      unsubscribe()
    }
  }, [coin, interval, enabled, subscribe, onMessage])
}

/**
 * 订阅交易数据的 Hook
 */
export function useTradesSubscription(
  coin: string,
  onMessage: (message: WebSocketMessage) => void,
  enabled: boolean = true
) {
  const { subscribe } = useHyperliquidWebSocket({ autoConnect: enabled })

  useEffect(() => {
    if (!enabled || !coin) {
      return
    }

    const subscription = {
      type: 'trades' as const,
      coin,
    }

    const unsubscribe = subscribe(subscription, onMessage)

    return () => {
      unsubscribe()
    }
  }, [coin, enabled, subscribe, onMessage])
}

/**
 * 订阅订单簿数据的 Hook
 */
export function useL2BookSubscription(
  coin: string,
  onMessage: (message: WebSocketMessage) => void,
  enabled: boolean = true,
  nSigFigs?: number,
  mantissa?: number
) {
  const { subscribe } = useHyperliquidWebSocket({ autoConnect: enabled })

  useEffect(() => {
    if (!enabled || !coin) {
      return
    }

    const subscription: any = {
      type: 'l2Book' as const,
      coin,
    }

    if (nSigFigs !== undefined) {
      subscription.nSigFigs = nSigFigs
    }
    if (mantissa !== undefined) {
      subscription.mantissa = mantissa
    }

    const unsubscribe = subscribe(subscription, onMessage)

    return () => {
      unsubscribe()
    }
  }, [coin, enabled, nSigFigs, mantissa, subscribe, onMessage])
}

/**
 * 订阅用户成交记录的 Hook
 */
export function useUserFillsSubscription(
  user: string,
  onMessage: (message: WebSocketMessage) => void,
  enabled: boolean = true,
  aggregateByTime?: boolean
) {
  const { subscribe } = useHyperliquidWebSocket({ autoConnect: enabled })

  useEffect(() => {
    if (!enabled || !user) {
      return
    }

    const subscription: any = {
      type: 'userFills' as const,
      user,
    }

    if (aggregateByTime !== undefined) {
      subscription.aggregateByTime = aggregateByTime
    }

    const unsubscribe = subscribe(subscription, onMessage)

    return () => {
      unsubscribe()
    }
  }, [user, enabled, aggregateByTime, subscribe, onMessage])
}

/**
 * 生成订阅键
 */
function getSubscriptionKey(subscription: Subscription): string {
  if ('coin' in subscription) {
    return `${subscription.type}:${subscription.coin}${'interval' in subscription ? `:${subscription.interval}` : ''}`
  } else if ('user' in subscription) {
    return `${subscription.type}:${subscription.user}`
  } else {
    return subscription.type
  }
}

