/**
 * OKX WebSocket 客户端
 * 用于订阅实时K线数据和交易量
 * 文档：https://www.okx.com/docs-v5/zh/#websocket-api-public-channel
 */

// WebSocket 连接地址
const OKX_WS_PUBLIC_URL = 'wss://ws.okx.com:8443/ws/v5/public'  // 公共频道：trades, candles, books, tickers 等
const OKX_WS_BUSINESS_URL = 'wss://ws.okx.com:8443/ws/v5/business'  // 业务频道：index-candle, mark-price-candle 等

// 判断频道类型，返回对应的 WebSocket URL
function getWebSocketUrl(channel: string): string {
  // 业务频道列表
  const businessChannels = [
    'index-candle',
    'mark-price-candle',
  ]
  
  // 检查是否是业务频道
  for (const businessChannel of businessChannels) {
    if (channel.startsWith(businessChannel)) {
      return OKX_WS_BUSINESS_URL
    }
  }
  
  // 默认使用公共频道
  return OKX_WS_PUBLIC_URL
}

// 订阅类型
export type SubscriptionType = 'candles' | 'index-candle' | 'trades' | 'ticker' | 'tickers' | 'books'

// K线订阅配置（公共频道）
export interface CandleSubscription {
  channel: 'candles'
  instId: string // 交易对，如 BTC-USDT
  interval?: string // 时间周期，如 1m, 5m, 1H, 4H, 1D, 1W
}

// 指数K线订阅配置（业务频道）
export interface IndexCandleSubscription {
  channel: 'index-candle'
  instId: string // 现货指数，如 BTC-USD
  interval?: string // 时间周期，如 1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 12H, 1D, 2D, 3D, 5D, 1W, 1M, 3M
}

// 交易订阅配置
export interface TradesSubscription {
  channel: 'trades'
  instId: string
  instType?: 'SPOT' | 'MARGIN' | 'SWAP' | 'FUTURES' | 'OPTION' // 产品类型，默认为 SPOT
}

// Ticker 订阅配置（单个）
export interface TickerSubscription {
  channel: 'ticker'
  instId: string
}

// Tickers 订阅配置（支持按产品类型订阅）
export interface TickersSubscription {
  channel: 'tickers'
  instId?: string // 单个产品ID，可选
  instType?: 'SPOT' | 'MARGIN' | 'SWAP' | 'FUTURES' | 'OPTION' | 'ANY' // 产品类型
  instFamily?: string // 交易品种
}

// 订单簿订阅配置
export interface BooksSubscription {
  channel: 'books'
  instId: string
  depth?: number // 深度，如 5, 20, 400
}

export type Subscription = CandleSubscription | IndexCandleSubscription | TradesSubscription | TickerSubscription | TickersSubscription | BooksSubscription

// WebSocket 消息格式
interface SubscribeMessage {
  op: 'subscribe'
  args: Array<{
    channel: string
    instId: string
  }>
}

interface UnsubscribeMessage {
  op: 'unsubscribe'
  args: Array<{
    channel: string
    instId: string
  }>
}

// OKX K线数据格式
export interface OKXCandle {
  ts: string // 开始时间（毫秒时间戳）
  o: string // 开盘价
  h: string // 最高价
  l: string // 最低价
  c: string // 收盘价
  vol: string // 交易量（以交易货币为单位）
  volCcy: string // 交易量（以计价货币为单位）
  volCcyQuote: string // 交易量（以报价货币为单位）
  confirm: string // K线状态（0: 未完结, 1: 已完结）
}

// 转换后的 Candle 格式
export interface Candle {
  time: number // 秒级时间戳
  open: string
  high: string
  low: string
  close: string
  volume: string
}

// WebSocket 响应消息
export interface WebSocketMessage {
  channel: string
  data: any // 根据 channel 类型，可能是 OKXCandle[]、Trade[] 等
  isSnapshot?: boolean
}

// 回调函数类型
export type MessageCallback = (message: WebSocketMessage) => void
export type ErrorCallback = (error: Error) => void
export type ConnectionCallback = () => void

// WebSocket 连接管理器
class WebSocketConnection {
  private ws: WebSocket | null = null
  private wsUrl: string
  private subscriptions: Map<string, Set<MessageCallback>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private shouldReconnect = true
  private heartbeatInterval: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private lastMessageTime: number = 0
  private isConnecting = false

  // 回调函数
  private onErrorCallback: ErrorCallback | null = null
  private onConnectCallback: ConnectionCallback | null = null
  private onDisconnectCallback: ConnectionCallback | null = null
  private onMessageCallback: ((data: any) => void) | null = null  // 消息回调

  constructor(url: string) {
    this.wsUrl = url
  }

  // 设置消息回调
  setMessageCallback(callback: (data: any) => void) {
    this.onMessageCallback = callback
  }

  // 获取订阅
  getSubscriptions(): Map<string, Set<MessageCallback>> {
    return this.subscriptions
  }

  // 获取 WebSocket URL
  getUrl(): string {
    return this.wsUrl
  }

  // 设置回调函数
  setErrorCallback(callback: ErrorCallback | null) {
    this.onErrorCallback = callback
  }

  setConnectCallback(callback: ConnectionCallback | null) {
    this.onConnectCallback = callback
  }

  setDisconnectCallback(callback: ConnectionCallback | null) {
    this.onDisconnectCallback = callback
  }

  // 连接方法
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true

      try {
        this.ws = new WebSocket(this.wsUrl)

        this.ws.onopen = () => {
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          
          // 连接成功后，发送所有待发送的订阅消息
          this.subscriptions.forEach((callbacks, key) => {
            if (callbacks.size > 0) {
              // 从订阅键中恢复订阅信息
              const parts = key.split(':')
              if (parts.length >= 2) {
                const channelPart = parts[0]
                const instId = parts[parts.length - 1]
                let channel: string
                let interval: string | undefined
                
                // 检查是否是 index-candle 频道（格式：index-candle1H）
                if (channelPart.startsWith('index-candle')) {
                  channel = 'index-candle'
                  const intervalMatch = channelPart.match(/^index-candle(.+)$/)
                  if (intervalMatch) {
                    interval = intervalMatch[1]
                  }
                } else if (channelPart.startsWith('candles:')) {
                  channel = 'candles'
                  const candlesParts = channelPart.split(':')
                  if (candlesParts.length >= 2) {
                    interval = candlesParts[1]
                  }
                } else if (channelPart.startsWith('books')) {
                  channel = 'books'
                } else {
                  channel = channelPart === 'l2Book' ? 'books' : channelPart
                }
                
                // 重建订阅对象
                const subscription: any = {
                  channel,
                  instId,
                }
                if (interval) {
                  subscription.interval = interval
                }
                
                // 注意：这里需要传入 getChannelName 和 getSubscriptionKey 方法
                // 但由于 WebSocketConnection 无法访问 OKXWebSocketClient 的方法
                // 我们需要在外部处理，或者传递这些方法
                // 暂时注释掉，因为连接恢复时应该由 OKXWebSocketClient 处理
                // this.sendSubscribeMessage(subscription, getChannelName, getSubscriptionKey)
              }
            }
          })
          
          if (this.onConnectCallback) {
            this.onConnectCallback()
          }
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            this.lastMessageTime = Date.now()
            this.resetHeartbeatTimer()
            
            let data: any
            if (typeof event.data === 'string') {
              if (event.data === 'pong') {
                console.log('OKX WebSocket: Heartbeat pong received')
                return
              }
              data = JSON.parse(event.data)
            } else {
              data = event.data
            }
            // 通过回调传递消息给外部处理
            if (this.onMessageCallback) {
              this.onMessageCallback(data)
            }
          } catch (error) {
            console.error('OKX WebSocket: Failed to parse message', error, 'Raw data:', event.data)
          }
        }

        this.ws.onerror = (error) => {
          console.error('OKX WebSocket: Error', error)
          this.isConnecting = false
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('WebSocket error'))
          }
          reject(error)
        }

        this.ws.onclose = (event) => {
          this.isConnecting = false
          this.stopHeartbeat()
          if (this.onDisconnectCallback) {
            this.onDisconnectCallback()
          }

          // 自动重连
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            const delay = this.reconnectDelay * this.reconnectAttempts
            setTimeout(() => {
              this.connect().catch((error) => {
                console.error('OKX WebSocket: Reconnect failed', error)
              })
            }, delay)
          }
        }
      } catch (error) {
        this.isConnecting = false
        if (this.onErrorCallback) {
          this.onErrorCallback(error instanceof Error ? error : new Error('Failed to create WebSocket'))
        }
        reject(error)
      }
    })
  }

  // 断开连接
  disconnect() {
    this.shouldReconnect = false
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.subscriptions.clear()
  }

  // 发送订阅消息
  sendSubscribeMessage(subscription: Subscription, getChannelName: (sub: Subscription) => string, getSubscriptionKey: (sub: Subscription) => string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('OKX WebSocket: Cannot subscribe, WebSocket not open. State:', this.ws?.readyState)
      return
    }

    const channelName = getChannelName(subscription)
    const arg: any = {
      channel: channelName,
    }
    
    // 根据频道类型添加不同的参数
    if (subscription.channel === 'candles') {
      arg.instId = subscription.instId
    } else if (subscription.channel === 'index-candle') {
      let instId = subscription.instId
      if (instId.endsWith('-USDT')) {
        instId = instId.replace('-USDT', '-USD')
      } else if (!instId.endsWith('-USD') && !instId.includes('-')) {
        instId = `${instId}-USD`
      }
      arg.instId = instId
    } else if (subscription.channel === 'trades') {
      const tradesSub = subscription as TradesSubscription
      arg.instId = tradesSub.instId
      arg.instType = tradesSub.instType || 'SPOT'
    } else if (subscription.channel === 'tickers') {
      const tickersSub = subscription as TickersSubscription
      if (tickersSub.instId) {
        arg.instId = tickersSub.instId
      }
      if (tickersSub.instType) {
        arg.instType = tickersSub.instType
      }
      if (tickersSub.instFamily) {
        arg.instFamily = tickersSub.instFamily
      }
    } else if (subscription.channel === 'books') {
      arg.instId = subscription.instId
    } else {
      arg.instId = subscription.instId
    }

    const message = {
      op: 'subscribe',
      args: [arg],
    }

    this.ws.send(JSON.stringify(message))
  }

  // 发送取消订阅消息
  sendUnsubscribeMessage(subscription: Subscription, getChannelName: (sub: Subscription) => string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    const channelName = getChannelName(subscription)
    const arg: any = {
      channel: channelName,
    }
    
    if (subscription.channel === 'tickers') {
      const tickersSub = subscription as TickersSubscription
      if (tickersSub.instId) {
        arg.instId = tickersSub.instId
      }
      if (tickersSub.instType) {
        arg.instType = tickersSub.instType
      }
      if (tickersSub.instFamily) {
        arg.instFamily = tickersSub.instFamily
      }
    } else {
      arg.instId = subscription.instId
    }

    const message = {
      op: 'unsubscribe',
      args: [arg],
    }

    this.ws.send(JSON.stringify(message))
  }


  // 启动心跳
  private startHeartbeat() {
    this.stopHeartbeat()
    this.lastMessageTime = Date.now()
    this.resetHeartbeatTimer()
  }

  // 重置心跳定时器
  private resetHeartbeatTimer() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    this.heartbeatTimer = setTimeout(() => {
      const timeSinceLastMessage = Date.now() - this.lastMessageTime
      if (timeSinceLastMessage >= 25000) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          try {
            this.ws.send('ping')
            setTimeout(() => {
              if (Date.now() - this.lastMessageTime > 30000) {
                console.warn('OKX WebSocket: No pong received after ping, connection may be lost')
              }
            }, 5000)
          } catch (e) {
            console.error('OKX WebSocket: Failed to send ping', e)
          }
        }
      }
      this.resetHeartbeatTimer()
    }, 25000)
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // 检查连接状态
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  // 获取 WebSocket 实例（用于消息处理）
  getWebSocket(): WebSocket | null {
    return this.ws
  }
}

// WebSocket 客户端类
export class OKXWebSocketClient {
  private publicConnection: WebSocketConnection  // 公共频道连接
  private businessConnection: WebSocketConnection  // 业务频道连接
  private subscriptions: Map<string, Set<MessageCallback>> = new Map()

  // 回调函数
  private onErrorCallback: ErrorCallback | null = null
  private onConnectCallback: ConnectionCallback | null = null
  private onDisconnectCallback: ConnectionCallback | null = null

  constructor() {
    // 初始化两个独立的 WebSocket 连接
    this.publicConnection = new WebSocketConnection(OKX_WS_PUBLIC_URL)
    this.businessConnection = new WebSocketConnection(OKX_WS_BUSINESS_URL)
    
    // 设置公共连接的消息回调
    this.publicConnection.setMessageCallback((data) => {
      this.handleMessage(data, this.publicConnection)
    })
    
    // 设置业务连接的消息回调
    this.businessConnection.setMessageCallback((data) => {
      this.handleMessage(data, this.businessConnection)
    })
    
    // 设置连接的回调
    this.publicConnection.setErrorCallback((error) => {
      if (this.onErrorCallback) {
        this.onErrorCallback(error)
      }
    })
    this.publicConnection.setConnectCallback(() => {
      if (this.onConnectCallback) {
        this.onConnectCallback()
      }
    })
    this.publicConnection.setDisconnectCallback(() => {
      if (this.onDisconnectCallback) {
        this.onDisconnectCallback()
      }
    })
    
    this.businessConnection.setErrorCallback((error) => {
      if (this.onErrorCallback) {
        this.onErrorCallback(error)
      }
    })
    this.businessConnection.setConnectCallback(() => {
      if (this.onConnectCallback) {
        this.onConnectCallback()
      }
    })
    this.businessConnection.setDisconnectCallback(() => {
      if (this.onDisconnectCallback) {
        this.onDisconnectCallback()
      }
    })
  }

  /**
   * 根据频道类型获取对应的连接
   */
  private getConnectionForChannel(channel: string): WebSocketConnection {
    if (channel.startsWith('index-candle') || channel.startsWith('mark-price-candle')) {
      return this.businessConnection
    }
    return this.publicConnection
  }

  /**
   * 连接到 WebSocket 服务器（已废弃，由 doSubscribe 自动处理）
   * 保留此方法以保持向后兼容
   */
  connect(url?: string): Promise<void> {
    // 不再需要手动连接，doSubscribe 会自动处理
    return Promise.resolve()
  }

  /**
   * 断开连接
   */
  disconnect() {
    // 断开所有连接
    this.publicConnection.disconnect()
    this.businessConnection.disconnect()
    this.subscriptions.clear()
  }

  /**
   * 订阅数据流
   */
  subscribe(subscription: Subscription, callback: MessageCallback): () => void {
    // 直接执行订阅，doSubscribe 会处理连接
    return this.doSubscribe(subscription, callback)
  }

  /**
   * 执行订阅
   */
  private doSubscribe(subscription: Subscription, callback: MessageCallback): () => void {
    const key = this.getSubscriptionKey(subscription)
    const channelName = this.getChannelName(subscription)
    
    // 根据频道类型选择正确的连接
    const connection = this.getConnectionForChannel(channelName)
    const connectionSubscriptions = connection.getSubscriptions()

    // 存储回调到对应的连接
    if (!connectionSubscriptions.has(key)) {
      connectionSubscriptions.set(key, new Set())
    }
    connectionSubscriptions.get(key)!.add(callback)
    
    // 同时存储到主订阅映射中（用于统一管理）
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set())
    }
    this.subscriptions.get(key)!.add(callback)

    // 如果这是该频道的第一个订阅，且连接已打开，发送订阅消息
    if (connectionSubscriptions.get(key)!.size === 1) {
      if (connection.isConnected()) {
        connection.sendSubscribeMessage(subscription, this.getChannelName.bind(this), this.getSubscriptionKey.bind(this))
      } else {
        // 如果未连接，先连接
        connection.connect().then(() => {
          connection.sendSubscribeMessage(subscription, this.getChannelName.bind(this), this.getSubscriptionKey.bind(this))
        }).catch((error) => {
          console.error('OKX WebSocket: Failed to connect for subscription', error)
        })
      }
    }

    // 返回取消订阅函数
    return () => {
      const callbacks = connectionSubscriptions.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          connectionSubscriptions.delete(key)
          // 如果没有订阅了，发送取消订阅消息
          if (connection.isConnected()) {
            connection.sendUnsubscribeMessage(subscription, this.getChannelName.bind(this))
          }
        }
      }
      
      // 同时从主订阅映射中删除
      const mainCallbacks = this.subscriptions.get(key)
      if (mainCallbacks) {
        mainCallbacks.delete(callback)
        if (mainCallbacks.size === 0) {
          this.subscriptions.delete(key)
        }
      }
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscription: Subscription, callback: MessageCallback) {
    const key = this.getSubscriptionKey(subscription)
    const channelName = this.getChannelName(subscription)
    const connection = this.getConnectionForChannel(channelName)
    const connectionSubscriptions = connection.getSubscriptions()
    
    const callbacks = connectionSubscriptions.get(key)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        connectionSubscriptions.delete(key)
        if (connection.isConnected()) {
          connection.sendUnsubscribeMessage(subscription, this.getChannelName.bind(this))
        }
      }
    }
    
    // 同时从主订阅映射中删除
    const mainCallbacks = this.subscriptions.get(key)
    if (mainCallbacks) {
      mainCallbacks.delete(callback)
      if (mainCallbacks.size === 0) {
        this.subscriptions.delete(key)
      }
    }
  }


  /**
   * 获取频道名称
   */
  private getChannelName(subscription: Subscription): string {
    if (subscription.channel === 'candles') {
      // K线频道格式：candles:{interval}
      const interval = subscription.interval || '1H'
      return `candles:${interval}`
    }
    if (subscription.channel === 'index-candle') {
      // 指数K线频道格式：index-candle{interval}
      const interval = subscription.interval || '1H'
      // 将间隔格式转换为 OKX 格式（如 1H -> index-candle1H, 5m -> index-candle5m）
      return `index-candle${interval}`
    }
    if (subscription.channel === 'books') {
      // 订单簿频道：官方仅支持 books、books5、books-l2-tbt 等少量固定值
      // 仅在特定深度（5）时使用专有频道，其余情况下使用标准 books
      const depth = (subscription as BooksSubscription).depth
      if (depth === 5) {
        return 'books5'
      }
      return 'books'
    }
    if (subscription.channel === 'tickers') {
      // Tickers 频道格式：tickers
      return 'tickers'
    }
    return subscription.channel
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: any, connection: WebSocketConnection) {
    // 使用传入的连接获取订阅信息
    const connectionSubscriptions = connection.getSubscriptions()
    // OKX WebSocket 消息格式：
    // { "event": "subscribe", "arg": {...}, "connId": "..." } - 订阅确认
    // { "arg": {...}, "data": [...] } - 数据消息
    // "pong" - 心跳响应

    // 处理心跳响应
    if (data === 'pong') {
      return
    }

    // 处理数组格式的消息（OKX 可能返回数组）
    if (Array.isArray(data)) {
      data.forEach((item) => this.handleMessage(item, connection))
      return
    }

    // 处理 notice 事件（服务升级通知等）
    if (data.event === 'notice') {
      // 通知所有订阅者
      connectionSubscriptions.forEach((callbacks) => {
        callbacks.forEach((callback) => {
          try {
            callback({
              channel: 'notice',
              data: data,
              isSnapshot: false,
            })
          } catch (error) {
            console.error('OKX WebSocket: Callback error', error)
          }
        })
      })
      return
    }

    // 处理 error 事件
    if (data.event === 'error') {
      console.error('OKX WebSocket: Error event received:', data.msg, 'code:', data.code)
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error(data.msg || `OKX WebSocket error: ${data.code}`))
      }
      return
    }

    if (data.event === 'subscribe' || data.event === 'unsubscribe') {
      // 订阅/取消订阅确认
      if (data.code && data.code !== '0') {
        console.error('OKX WebSocket: Subscription failed:', data.msg, 'code:', data.code)
        if (this.onErrorCallback) {
          this.onErrorCallback(new Error(data.msg || `Subscription failed: ${data.code}`))
        }
        return
      }
      if (data.arg) {
        const key = this.getSubscriptionKeyFromArg(data.arg)
        const callbacks = connectionSubscriptions.get(key)
        if (callbacks) {
          callbacks.forEach((callback) => {
            try {
              callback({
                channel: 'subscriptionResponse',
                data: data.arg,
                isSnapshot: false,
              })
            } catch (error) {
              console.error('OKX WebSocket: Callback error', error)
            }
          })
        }
      }
      return
    }

    // 数据消息
    if (data.arg && data.data) {
      const channel = data.arg.channel
      const key = this.getSubscriptionKeyFromArg(data.arg)
      
      // 对于 books 频道，需要特殊处理
      // 因为订阅时可能指定了 depth（如 books20），但返回的 channel 可能是 books
      if (channel === 'books' || channel.startsWith('books')) {
        // 转换数据格式，传递 instId 以便在转换时使用
        const convertedData = this.convertData(channel, data.data, data.arg?.instId)
        
        // 查找所有 books 相关的订阅
        // 1. 精确匹配：books:BTC-USDT 或 books20:BTC-USDT
        // 2. 模糊匹配：尝试匹配所有 books 开头的订阅键
        
        const dataInstId = data.arg.instId
        let matched = false
        
        // 首先尝试精确匹配
        const exactKey = `${channel}:${dataInstId}`
        const exactCallbacks = connectionSubscriptions.get(exactKey)
        if (exactCallbacks) {
          matched = true
          exactCallbacks.forEach((callback) => {
            try {
              callback({
                channel: 'l2Book',
                data: convertedData,
                isSnapshot: data.action === 'snapshot' || false,
              })
            } catch (error) {
              console.error('OKX WebSocket: Callback error', error)
            }
          })
        }
        
        // 如果精确匹配失败，尝试模糊匹配所有 books 开头的订阅键
        if (!matched) {
          for (const [subKey, subCallbacks] of connectionSubscriptions.entries()) {
            // 检查是否是 books 相关的订阅键
            if (subKey.startsWith('books') && subKey.includes(':')) {
              const subKeyParts = subKey.split(':')
              if (subKeyParts.length >= 2) {
                const subKeyInstId = subKeyParts[subKeyParts.length - 1]
                // 匹配 instId
                if (subKeyInstId === dataInstId) {
                  matched = true
                  subCallbacks.forEach((callback) => {
                    try {
                      callback({
                        channel: 'l2Book',
                        data: convertedData,
                        isSnapshot: data.action === 'snapshot' || false,
                      })
                    } catch (error) {
                      console.error('OKX WebSocket: Callback error', error)
                    }
                  })
                  break
                }
              }
            }
          }
        }
        
        // 如果没有找到匹配的订阅，记录警告
        if (!matched) {
          console.warn('OKX WebSocket: No matching books subscription found for channel:', channel, 'instId:', dataInstId, 'Available keys:', Array.from(connectionSubscriptions.keys()))
        }
        
        return
      }
      
      // 对于 tickers 频道，需要特殊处理
      // 因为订阅 instType 时，返回的数据可能包含多个交易对
      if (channel === 'tickers') {
        // 转换数据格式
        const convertedData = this.convertData(channel, data.data)
        
        // 查找所有 tickers 相关的订阅
        // 1. 精确匹配：tickers:instId
        // 2. 类型匹配：tickers:instType（如 tickers:SPOT）
        // 3. 通用匹配：tickers:ANY
        
        // 首先尝试精确匹配（如果有 instId）
        if (data.arg.instId) {
          const exactKey = `tickers:${data.arg.instId}`
          const exactCallbacks = connectionSubscriptions.get(exactKey)
          if (exactCallbacks) {
            exactCallbacks.forEach((callback) => {
              try {
                callback({
                  channel: 'tickers',
                  data: convertedData,
                  isSnapshot: data.action === 'snapshot' || false,
                })
              } catch (error) {
                console.error('OKX WebSocket: Callback error', error)
              }
            })
          }
        }
        
        // 然后尝试类型匹配（如果有 instType）
        if (data.arg.instType) {
          const typeKey = `tickers:${data.arg.instType}`
          const typeCallbacks = connectionSubscriptions.get(typeKey)
          if (typeCallbacks) {
            typeCallbacks.forEach((callback) => {
              try {
                callback({
                  channel: 'tickers',
                  data: convertedData,
                  isSnapshot: data.action === 'snapshot' || false,
                })
              } catch (error) {
                console.error('OKX WebSocket: Callback error', error)
              }
            })
          }
        }
        
        // 最后尝试通用匹配（tickers:ANY）
        const anyCallbacks = connectionSubscriptions.get('tickers:ANY')
        if (anyCallbacks) {
          anyCallbacks.forEach((callback) => {
            try {
              callback({
                channel: 'tickers',
                data: convertedData,
                isSnapshot: data.action === 'snapshot' || false,
              })
            } catch (error) {
              console.error('OKX WebSocket: Callback error', error)
            }
          })
        }
        
        // 如果没有找到匹配的订阅，记录警告
        if (!data.arg.instId && !data.arg.instType && 
            !connectionSubscriptions.has('tickers:ANY') &&
            !connectionSubscriptions.has(`tickers:${data.arg.instType || 'SPOT'}`)) {
          console.warn('OKX WebSocket: No matching tickers subscription found for:', data.arg)
        }
        
        return
      }
      
      const callbacks = connectionSubscriptions.get(key)
      if (callbacks) {
        // 转换数据格式
        const convertedData = this.convertData(channel, data.data)
        
        // 对于订单簿，使用 'l2Book' 作为 channel 以保持兼容性
        // 对于 index-candle，统一使用 'index-candle' 作为 channel
        // 对于其他频道，保持原始 channel 格式
        let normalizedChannel = channel
        if (channel === 'books' || channel.startsWith('books')) {
          normalizedChannel = 'l2Book'
        } else if (channel.startsWith('index-candle')) {
          normalizedChannel = 'index-candle'
        }
        
        callbacks.forEach((callback) => {
          try {
            callback({
              channel: normalizedChannel,
              data: convertedData,
              isSnapshot: data.action === 'snapshot' || false,
            })
          } catch (error) {
            console.error('OKX WebSocket: Callback error', error)
          }
        })
        } else {
          // 尝试只通过 channel 匹配（不包含 instId）
          const channelOnlyKey = channel
          const channelCallbacks = connectionSubscriptions.get(channelOnlyKey)
          if (channelCallbacks) {
            const convertedData = this.convertData(channel, data.data)
            let normalizedChannel = channel
            if (channel === 'books' || channel.startsWith('books')) {
              normalizedChannel = 'l2Book'
            } else if (channel.startsWith('index-candle')) {
              normalizedChannel = 'index-candle'
            }
            channelCallbacks.forEach((callback) => {
              try {
                callback({
                  channel: normalizedChannel,
                  data: convertedData,
                  isSnapshot: data.action === 'snapshot' || false,
                })
              } catch (error) {
                console.error('OKX WebSocket: Callback error', error)
              }
            })
          } else {
            // 尝试模糊匹配：查找所有以该 channel 开头的订阅键
            let matched = false
            
            for (const [subKey, subCallbacks] of connectionSubscriptions.entries()) {
              // 精确匹配：subKey === key
              if (subKey === key) {
                matched = true
                const convertedData = this.convertData(channel, data.data)
                let normalizedChannel = channel
                if (channel === 'books' || channel.startsWith('books')) {
                  normalizedChannel = 'l2Book'
                } else if (channel.startsWith('index-candle')) {
                  normalizedChannel = 'index-candle'
                }
                subCallbacks.forEach((callback) => {
                  try {
                    callback({
                      channel: normalizedChannel,
                      data: convertedData,
                      isSnapshot: data.action === 'snapshot' || false,
                    })
                  } catch (error) {
                    console.error('OKX WebSocket: Callback error', error)
                  }
                })
                break
              }
              
              // 模糊匹配：subKey 以 channel: 开头（对于 index-candle1H，匹配 index-candle1H:）
              if (subKey.startsWith(channel + ':')) {
                matched = true
                const convertedData = this.convertData(channel, data.data)
                let normalizedChannel = channel
                if (channel === 'books' || channel.startsWith('books')) {
                  normalizedChannel = 'l2Book'
                } else if (channel.startsWith('index-candle')) {
                  normalizedChannel = 'index-candle'
                }
                subCallbacks.forEach((callback) => {
                  try {
                    callback({
                      channel: normalizedChannel,
                      data: convertedData,
                      isSnapshot: data.action === 'snapshot' || false,
                    })
                  } catch (error) {
                    console.error('OKX WebSocket: Callback error', error)
                  }
                })
                break
              }
            
            // 对于 index-candle 频道，尝试匹配所有 index-candle 开头的订阅键
            if (channel.startsWith('index-candle')) {
              // 检查订阅键是否也是 index-candle 开头
              const subKeyParts = subKey.split(':')
              if (subKeyParts.length >= 2 && subKeyParts[0].startsWith('index-candle')) {
                const dataInstId = data.arg.instId
                const subKeyInstId = subKeyParts[subKeyParts.length - 1]
                
                // 尝试匹配 instId（允许 USDT 和 USD 的转换）
                let instIdMatch = false
                if (dataInstId === subKeyInstId) {
                  instIdMatch = true
                } else if (dataInstId && subKeyInstId) {
                  // 尝试转换格式匹配
                  const normalizedDataInstId = dataInstId.replace('-USDT', '-USD')
                  const normalizedSubKeyInstId = subKeyInstId.replace('-USDT', '-USD')
                  if (normalizedDataInstId === normalizedSubKeyInstId || 
                      dataInstId === normalizedSubKeyInstId || 
                      normalizedDataInstId === subKeyInstId) {
                    instIdMatch = true
                  }
                }
                
                if (instIdMatch) {
                  matched = true
                  const convertedData = this.convertData(channel, data.data)
                  const normalizedChannel = 'index-candle' // 统一使用 index-candle
                  subCallbacks.forEach((callback) => {
                    try {
                      callback({
                        channel: normalizedChannel,
                        data: convertedData,
                        isSnapshot: data.action === 'snapshot' || false,
                      })
                    } catch (error) {
                      console.error('OKX WebSocket: Callback error', error)
                    }
                  })
                  break
                }
              }
            }
          }
          
          if (!matched) {
            console.error('OKX WebSocket: No matching subscription found for channel:', channel, 'key:', key)
          }
        }
      }
    }
  }

  /**
   * 转换数据格式
   */
  private convertData(channel: string, data: any[], instId?: string): any {
    if (channel.startsWith('candles:')) {
      // 转换K线数据（公共频道）
      return data.map((item: any[]) => {
        // OKX 返回格式：[ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
        const [ts, o, h, l, c, vol] = item
        const timeSeconds = Math.floor(parseInt(ts, 10) / 1000)
        
        return {
          time: timeSeconds,
          open: String(o || 0),
          high: String(h || 0),
          low: String(l || 0),
          close: String(c || 0),
          volume: String(vol || 0),
        }
      })
    }
    
    if (channel.startsWith('index-candle')) {
      // 转换指数K线数据（业务频道）
      // OKX 返回格式：[[ts, o, h, l, c, confirm]]
      return data.map((item: any[]) => {
        // 数据格式：[ts, o, h, l, c, confirm]
        const [ts, o, h, l, c, confirm] = item
        const timeSeconds = Math.floor(parseInt(ts, 10) / 1000)
        
        return {
          time: timeSeconds,
          open: String(o || 0),
          high: String(h || 0),
          low: String(l || 0),
          close: String(c || 0),
          volume: '0', // index-candle 没有 volume 数据
          confirm: String(confirm || '0'),
        }
      })
    }
    
    if (channel === 'trades' || channel.startsWith('trades')) {
      // 转换交易数据
      // OKX 返回格式可能是：
      // 1. 对象数组格式：[{instId, tradeId, px, sz, side, ts, count, ...}]
      // 2. 数组数组格式：[[tradeId, px, sz, side, ts, count]]
      return data.map((item: any) => {
        // 检查是否是对象格式
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          // 对象格式：{instId, tradeId, px, sz, side, ts, count, ...}
          return {
            instId: item.instId || '',
            tradeId: String(item.tradeId || ''),
            px: String(item.px || 0),
            sz: String(item.sz || 0),
            side: item.side === 'buy' ? 'B' : (item.side === 'sell' ? 'S' : item.side), // 转换为 Hyperliquid 格式
            time: Math.floor(parseInt(item.ts || '0', 10) / 1000),
            count: parseInt(item.count || 0, 10),
          }
        } else if (Array.isArray(item)) {
          // 数组格式：[tradeId, px, sz, side, ts, count]
          const [tradeId, px, sz, side, ts, count] = item
          return {
            tradeId: String(tradeId || ''),
            px: String(px || 0),
            sz: String(sz || 0),
            side: side === 'buy' ? 'B' : (side === 'sell' ? 'S' : side), // 转换为 Hyperliquid 格式
            time: Math.floor(parseInt(ts, 10) / 1000),
            count: parseInt(count || 0, 10),
          }
        } else {
          console.warn('OKX WebSocket: Unexpected trades data format:', item)
          return item
        }
      })
    }
    
    if (channel === 'tickers') {
      // 转换 Tickers 数据
      // OKX 返回格式：[{instId, last, lastSz, askPx, askSz, bidPx, bidSz, open24h, high24h, low24h, vol24h, volCcy24h, ts, ...}]
      return data.map((item: any) => {
        if (item && typeof item === 'object') {
          return {
            instId: item.instId || '',
            last: String(item.last || 0),
            lastSz: String(item.lastSz || 0),
            askPx: String(item.askPx || 0),
            askSz: String(item.askSz || 0),
            bidPx: String(item.bidPx || 0),
            bidSz: String(item.bidSz || 0),
            open24h: String(item.open24h || 0),
            high24h: String(item.high24h || 0),
            low24h: String(item.low24h || 0),
            vol24h: String(item.vol24h || 0),
            volCcy24h: String(item.volCcy24h || 0),
            ts: item.ts ? Math.floor(parseInt(String(item.ts), 10) / 1000) : Math.floor(Date.now() / 1000),
            // 保留原始数据以便调试
            raw: item,
          }
        }
        return item
      })
    }
    
    if (channel === 'books' || channel.startsWith('books')) {
      // 转换订单簿数据
      // OKX 返回格式：[{ bids: [[price, size, ...]], asks: [[price, size, ...]], ts: timestamp, checksum, seqId, prevSeqId }]
      // 注意：实际返回的数据中，ts 是字符串格式的毫秒时间戳
      if (Array.isArray(data) && data.length > 0) {
        const bookData = data[0]
        // 检查是否是对象格式
        if (bookData && typeof bookData === 'object' && !Array.isArray(bookData) && (bookData.bids || bookData.asks)) {
          // 处理 bids 和 asks，它们都是数组数组格式：[[price, size, ...], ...]
          const bids = Array.isArray(bookData.bids) ? bookData.bids : []
          const asks = Array.isArray(bookData.asks) ? bookData.asks : []
          
          return {
            coin: instId || bookData.instId || '',
            levels: [
              bids.map((bid: any[]) => {
                // bid 格式：[price, size, ...] 或 [price, size, numOrders, ...]
                return {
                  px: String(bid[0] || 0),
                  sz: String(bid[1] || 0),
                }
              }),
              asks.map((ask: any[]) => {
                // ask 格式：[price, size, ...] 或 [price, size, numOrders, ...]
                return {
                  px: String(ask[0] || 0),
                  sz: String(ask[1] || 0),
                }
              }),
            ],
            time: bookData.ts ? Math.floor(parseInt(String(bookData.ts), 10) / 1000) : Math.floor(Date.now() / 1000),
          }
        }
        // 检查是否是数组格式 [bids, asks, ts, checksum]
        if (Array.isArray(bookData) && bookData.length >= 2) {
          const [bids, asks, ts] = bookData
          return {
            coin: instId || '',
            levels: [
              (Array.isArray(bids) ? bids : []).map((bid: any[]) => ({
                px: String(bid[0] || 0),
                sz: String(bid[1] || 0),
              })),
              (Array.isArray(asks) ? asks : []).map((ask: any[]) => ({
                px: String(ask[0] || 0),
                sz: String(ask[1] || 0),
              })),
            ],
            time: ts ? Math.floor(parseInt(String(ts), 10) / 1000) : Math.floor(Date.now() / 1000),
          }
        }
      }
      console.warn('OKX WebSocket: Unexpected books data format:', data)
      return data
    }
    
    return data
  }

  /**
   * 获取订阅键
   * 注意：订阅键格式必须与 getSubscriptionKeyFromArg 返回的格式一致
   */
  private getSubscriptionKey(subscription: Subscription): string {
    if (subscription.channel === 'candles') {
      const interval = subscription.interval || '1H'
      // 使用频道名称格式：candles:1H:BTC-USDT
      return `candles:${interval}:${subscription.instId}`
    }
    if (subscription.channel === 'index-candle') {
      const interval = subscription.interval || '1H'
      // 使用频道名称格式：index-candle1H:BTC-USD（注意：频道名称包含 interval，没有冒号）
      const channelName = `index-candle${interval}`
      return `${channelName}:${subscription.instId}`
    }
    if (subscription.channel === 'books') {
      const depth = (subscription as BooksSubscription).depth
      const channelName = depth ? `books${depth}` : 'books'
      return `${channelName}:${subscription.instId}`
    }
    if (subscription.channel === 'tickers') {
      const tickersSub = subscription as TickersSubscription
      // Tickers 订阅键格式：tickers:instId 或 tickers:instType 或 tickers:instType:instFamily
      if (tickersSub.instId) {
        return `tickers:${tickersSub.instId}`
      }
      if (tickersSub.instFamily) {
        return `tickers:${tickersSub.instType || 'ANY'}:${tickersSub.instFamily}`
      }
      if (tickersSub.instType) {
        return `tickers:${tickersSub.instType}`
      }
      return 'tickers:ANY'
    }
    return `${subscription.channel}:${subscription.instId}`
  }

  /**
   * 从 arg 获取订阅键
   * 注意：返回的格式必须与 getSubscriptionKey 返回的格式一致
   */
  private getSubscriptionKeyFromArg(arg: any): string {
    if (!arg || !arg.channel) {
      console.warn('OKX WebSocket: Invalid arg for subscription key:', arg)
      return ''
    }
    
    const channel = arg.channel
    
    // Tickers 频道可能没有 instId，只有 instType
    if (channel === 'tickers') {
      if (arg.instId) {
        return `tickers:${arg.instId}`
      }
      if (arg.instFamily) {
        return `tickers:${arg.instType || 'ANY'}:${arg.instFamily}`
      }
      if (arg.instType) {
        return `tickers:${arg.instType}`
      }
      return 'tickers:ANY'
    }
    
    // 其他频道需要 instId
    if (!arg.instId) {
      console.warn('OKX WebSocket: Missing instId for channel:', channel)
      return ''
    }
    
    let instId = arg.instId
    
    // 对于 index-candle 频道，确保 instId 使用 USD 格式
    if (channel.startsWith('index-candle')) {
      // 如果 instId 是 USDT 格式，转换为 USD 格式
      if (instId.endsWith('-USDT')) {
        instId = instId.replace('-USDT', '-USD')
      }
      return `${channel}:${instId}`
    }
    
    if (channel.startsWith('candles:')) {
      return `${channel}:${instId}`
    }
    if (channel === 'books' || channel.startsWith('books')) {
      // books 频道可能带有深度参数（如 books20），需要保持完整的 channel 格式
      // 返回格式：books:BTC-USDT 或 books20:BTC-USDT
      return `${channel}:${instId}`
    }
    return `${channel}:${instId}`
  }


  /**
   * 设置错误回调
   */
  onError(callback: ErrorCallback) {
    this.onErrorCallback = callback
  }

  /**
   * 设置连接回调
   */
  onConnect(callback: ConnectionCallback) {
    this.onConnectCallback = callback
  }

  /**
   * 设置断开连接回调
   */
  onDisconnect(callback: ConnectionCallback) {
    this.onDisconnectCallback = callback
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    // 检查是否有任何连接是打开的
    return this.publicConnection.isConnected() || this.businessConnection.isConnected()
  }

  /**
   * 订阅币币（SPOT）频道的所有 USDT 交易对 tickers
   * 这会订阅所有 SPOT 类型的 USDT 交易对
   */
  subscribeSpotUSDTTickers(callback: MessageCallback): () => void {
    const subscription: TickersSubscription = {
      channel: 'tickers',
      instType: 'SPOT',
    }
    return this.subscribe(subscription, callback)
  }

  /**
   * 订阅单个交易对的 tickers
   */
  subscribeTicker(instId: string, callback: MessageCallback): () => void {
    const subscription: TickersSubscription = {
      channel: 'tickers',
      instId: instId,
    }
    return this.subscribe(subscription, callback)
  }
}

// 单例模式
let clientInstance: OKXWebSocketClient | null = null

/**
 * 获取 WebSocket 客户端实例
 */
export function getOKXWebSocketClient(): OKXWebSocketClient {
  if (!clientInstance) {
    clientInstance = new OKXWebSocketClient()
  }
  return clientInstance
}

