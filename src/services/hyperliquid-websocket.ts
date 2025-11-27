/**
 * Hyperliquid WebSocket 客户端
 * 根据官方文档：https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
 */

// WebSocket 连接地址
const HYPERLIQUID_WS_URL = 'wss://api.hyperliquid.xyz/ws'

// 订阅类型
export type SubscriptionType =
  | 'allMids'
  | 'notification'
  | 'webData2'
  | 'candle'
  | 'l2Book'
  | 'trades'
  | 'orderUpdates'
  | 'userEvents'
  | 'userFills'
  | 'userFundings'
  | 'userNonFundingLedgerUpdates'
  | 'activeAssetCtx'
  | 'activeAssetData'
  | 'userTwapSliceFills'
  | 'userTwapHistory'
  | 'bbo'

// 订阅配置
export interface CandleSubscription {
  type: 'candle'
  coin: string
  interval: string // "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "12h", "1d", "3d", "1w", "1M"
}

export interface L2BookSubscription {
  type: 'l2Book'
  coin: string
  nSigFigs?: number
  mantissa?: number
}

export interface TradesSubscription {
  type: 'trades'
  coin: string
}

export interface AllMidsSubscription {
  type: 'allMids'
  dex?: string
}

export interface UserSubscription {
  type: 'userFills' | 'userFundings' | 'userNonFundingLedgerUpdates' | 'orderUpdates' | 'userEvents' | 'webData2' | 'notification' | 'userTwapSliceFills' | 'userTwapHistory'
  user: string
  aggregateByTime?: boolean // 仅用于 userFills
}

export interface ActiveAssetCtxSubscription {
  type: 'activeAssetCtx'
  coin: string
}

export interface ActiveAssetDataSubscription {
  type: 'activeAssetData'
  user: string
  coin: string
}

export interface BboSubscription {
  type: 'bbo'
  coin: string
}

export type Subscription =
  | CandleSubscription
  | L2BookSubscription
  | TradesSubscription
  | AllMidsSubscription
  | UserSubscription
  | ActiveAssetCtxSubscription
  | ActiveAssetDataSubscription
  | BboSubscription

// WebSocket 消息格式
interface SubscribeMessage {
  method: 'subscribe'
  subscription: Subscription
}

interface UnsubscribeMessage {
  method: 'unsubscribe'
  subscription: Subscription
}

// Candle 数据类型（根据 Hyperliquid 文档）
export interface Candle {
  time: number // 时间戳（秒）
  open: string // 开盘价
  high: string // 最高价
  low: string // 最低价
  close: string // 收盘价
  volume: string // 交易量
}

// WebSocket 响应消息
export interface WebSocketMessage {
  channel: string
  data: any // 根据 channel 类型，可能是 Candle[]、WsTrade[]、WsBook 等
  isSnapshot?: boolean
}

// 回调函数类型
export type MessageCallback = (message: WebSocketMessage) => void
export type ErrorCallback = (error: Error) => void
export type ConnectionCallback = () => void

// WebSocket 客户端类
export class HyperliquidWebSocketClient {
  private ws: WebSocket | null = null
  private subscriptions: Map<string, Set<MessageCallback>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private shouldReconnect = true
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isConnecting = false

  // 回调函数
  private onErrorCallback: ErrorCallback | null = null
  private onConnectCallback: ConnectionCallback | null = null
  private onDisconnectCallback: ConnectionCallback | null = null

  constructor() {
    // 浏览器环境检查
    if (typeof window === 'undefined') {
      console.warn('HyperliquidWebSocketClient: Running in server environment, WebSocket will not work')
    }
  }

  /**
   * 连接到 WebSocket 服务器
   */
  connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true

      try {
        this.ws = new WebSocket(HYPERLIQUID_WS_URL)

        this.ws.onopen = () => {
          console.log('Hyperliquid WebSocket: Connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          if (this.onConnectCallback) {
            this.onConnectCallback()
          }
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            console.log('Hyperliquid WebSocket: Raw message received:', event.data)
            const message: WebSocketMessage = JSON.parse(event.data)
            console.log('Hyperliquid WebSocket: Parsed message:', message)
            this.handleMessage(message)
          } catch (error) {
            console.error('Hyperliquid WebSocket: Failed to parse message', error, 'Raw data:', event.data)
          }
        }

        this.ws.onerror = (error) => {
          console.error('Hyperliquid WebSocket: Error', error)
          this.isConnecting = false
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('WebSocket error'))
          }
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('Hyperliquid WebSocket: Disconnected')
          this.isConnecting = false
          this.stopHeartbeat()
          if (this.onDisconnectCallback) {
            this.onDisconnectCallback()
          }
          // 自动重连
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
            console.log(`Hyperliquid WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
            setTimeout(() => {
              this.connect().catch(console.error)
            }, delay)
          }
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.shouldReconnect = false
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.subscriptions.clear()
  }

  /**
   * 订阅数据流
   */
  subscribe(subscription: Subscription, callback: MessageCallback): () => void {
    const key = this.getSubscriptionKey(subscription)
    console.log('Hyperliquid WebSocket: Subscribing to:', key, 'WebSocket state:', this.ws?.readyState)

    // 添加回调
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set())
    }
    this.subscriptions.get(key)!.add(callback)

    // 如果已连接，发送订阅消息
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Hyperliquid WebSocket: WebSocket is open, sending subscribe immediately')
      this.sendSubscribe(subscription)
    } else {
      // 如果未连接，先连接
      console.log('Hyperliquid WebSocket: WebSocket not open, connecting first...')
      this.connect().then(() => {
        console.log('Hyperliquid WebSocket: Connected, now sending subscribe')
        this.sendSubscribe(subscription)
      }).catch((error) => {
        console.error('Hyperliquid WebSocket: Failed to connect for subscription:', error)
      })
    }

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(subscription, callback)
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscription: Subscription, callback: MessageCallback): void {
    const key = this.getSubscriptionKey(subscription)
    const callbacks = this.subscriptions.get(key)

    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.subscriptions.delete(key)
        // 发送取消订阅消息
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.sendUnsubscribe(subscription)
        }
      }
    }
  }

  /**
   * 设置错误回调
   */
  onError(callback: ErrorCallback): void {
    this.onErrorCallback = callback
  }

  /**
   * 设置连接回调
   */
  onConnect(callback: ConnectionCallback): void {
    this.onConnectCallback = callback
  }

  /**
   * 设置断开连接回调
   */
  onDisconnect(callback: ConnectionCallback): void {
    this.onDisconnectCallback = callback
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * 发送订阅消息
   */
  private sendSubscribe(subscription: Subscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Hyperliquid WebSocket: Cannot subscribe, WebSocket not open. State:', this.ws?.readyState)
      return
    }

    const message: SubscribeMessage = {
      method: 'subscribe',
      subscription,
    }

    const messageStr = JSON.stringify(message)
    console.log('Hyperliquid WebSocket: Sending subscribe message:', messageStr)
    this.ws.send(messageStr)
  }

  /**
   * 发送取消订阅消息
   */
  private sendUnsubscribe(subscription: Subscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    const message: UnsubscribeMessage = {
      method: 'unsubscribe',
      subscription,
    }

    this.ws.send(JSON.stringify(message))
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    const channel = message.channel
    console.log('Hyperliquid WebSocket: Handling message, channel:', channel, 'subscriptions:', this.subscriptions.size)

    // 处理订阅响应
    if (channel === 'subscriptionResponse') {
      // 订阅确认，可以忽略或记录
      console.log('Hyperliquid WebSocket: Subscription response received')
      // 也发送给订阅者，让他们知道订阅成功
      for (const [key, callbacks] of this.subscriptions.entries()) {
        callbacks.forEach((callback) => {
          try {
            callback(message)
          } catch (error) {
            console.error('Hyperliquid WebSocket: Callback error', error)
          }
        })
      }
      return
    }

    // 分发消息到对应的订阅者
    let matched = false
    for (const [key, callbacks] of this.subscriptions.entries()) {
      if (this.isChannelMatch(channel, key)) {
        console.log('Hyperliquid WebSocket: Message matched subscription key:', key, 'callbacks:', callbacks.size)
        matched = true
        callbacks.forEach((callback) => {
          try {
            callback(message)
          } catch (error) {
            console.error('Hyperliquid WebSocket: Callback error', error)
          }
        })
      }
    }
    
    if (!matched) {
      console.warn('Hyperliquid WebSocket: No subscription matched for channel:', channel, 'Available keys:', Array.from(this.subscriptions.keys()))
    }
  }

  /**
   * 检查频道是否匹配订阅
   */
  private isChannelMatch(channel: string, subscriptionKey: string): boolean {
    // 精确匹配或频道包含订阅类型
    if (channel === subscriptionKey) {
      return true
    }
    // 对于 candle 订阅，频道格式为 "candle"，订阅键为 "candle:COIN:INTERVAL"
    // 对于 l2Book 订阅，频道格式为 "l2Book"，订阅键为 "l2Book:COIN"
    // 对于 trades 订阅，频道格式为 "trades"，订阅键为 "trades:COIN"
    const subscriptionType = subscriptionKey.split(':')[0]
    return channel === subscriptionType
  }

  /**
   * 生成订阅键
   */
  private getSubscriptionKey(subscription: Subscription): string {
    if ('coin' in subscription) {
      return `${subscription.type}:${subscription.coin}${'interval' in subscription ? `:${subscription.interval}` : ''}`
    } else if ('user' in subscription) {
      return `${subscription.type}:${subscription.user}`
    } else {
      return subscription.type
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    // Hyperliquid WebSocket 可能需要心跳，根据文档实现
    // 目前文档中没有明确提到心跳，但可以添加作为保活机制
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // 可以发送 ping 消息（如果支持）
        // 或者简单地检查连接状态
      }
    }, 30000) // 30秒心跳
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

// 创建单例实例
let wsClientInstance: HyperliquidWebSocketClient | null = null

/**
 * 获取 WebSocket 客户端单例
 */
export function getWebSocketClient(): HyperliquidWebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new HyperliquidWebSocketClient()
  }
  return wsClientInstance
}

