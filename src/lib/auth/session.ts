/**
 * 会话管理服务
 * 处理 Web3 地址的登录会话，包括创建、验证、更新和清理会话
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'

export interface SessionData {
  session_id: string
  user_address: string
  expires_at: Date
  last_accessed_at: Date
  is_active: boolean
  metadata?: Record<string, any>
}

export interface CreateSessionParams {
  user_address: string
  expiresInHours?: number // 默认 24 小时
  metadata?: Record<string, any>
}

/**
 * 创建新的用户会话
 */
export async function createSession(
  params: CreateSessionParams
): Promise<SessionData> {
  const { user_address, expiresInHours = 24, metadata = {} } = params

  // 验证地址格式（简单的以太坊地址格式验证）
  if (!isValidEthereumAddress(user_address)) {
    throw new Error('Invalid Ethereum address format')
  }

  const supabase = createAdminClient()

  // 生成唯一的 session_id
  const session_id = generateSessionId()

  // 计算过期时间
  const expires_at = new Date()
  expires_at.setHours(expires_at.getHours() + expiresInHours)

  // 先清理该用户的旧会话（可选：只保留一个活跃会话）
  // 或者允许多个会话同时存在
  // 这里我们选择允许多个会话，但可以设置最大数量限制

  // 创建新会话
  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      session_id,
      user_address: user_address.toLowerCase(), // 统一转换为小写
      expires_at: expires_at.toISOString(),
      last_accessed_at: new Date().toISOString(),
      is_active: true,
      metadata,
    })
    .select()
    .single()

  if (error) {
    // 记录详细的错误信息
    console.error('Failed to create session:', {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      user_address: user_address.substring(0, 10) + '...',
    })
    throw new Error(`Failed to create session: ${error.message}`)
  }

  // 记录成功创建 session
  console.log('Session created successfully:', {
    session_id: session_id.substring(0, 10) + '...',
    user_address: user_address.substring(0, 10) + '...',
    expires_at: expires_at.toISOString(),
  })

  return {
    session_id: data.session_id,
    user_address: data.user_address,
    expires_at: new Date(data.expires_at),
    last_accessed_at: new Date(data.last_accessed_at),
    is_active: data.is_active,
    metadata: data.metadata || {},
  }
}

/**
 * 验证会话是否有效
 */
export async function validateSession(
  session_id: string
): Promise<SessionData | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('session_id', session_id)
    .eq('is_active', true)
    .single()

  if (error) {
    // 记录错误信息以便调试
    console.error('Failed to validate session:', {
      session_id: session_id.substring(0, 10) + '...', // 只记录部分 session_id 以保护隐私
      error: error.message,
      code: error.code,
      details: error.details,
    })
    return null
  }

  if (!data) {
    // 记录 session 不存在的情况
    console.warn('Session not found or inactive:', {
      session_id: session_id.substring(0, 10) + '...',
    })
    return null
  }

  // 检查是否过期
  const expires_at = new Date(data.expires_at)
  if (expires_at < new Date()) {
    // 标记为过期
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_id', session_id)
    return null
  }

  // 更新最后访问时间
  await updateSessionAccess(session_id)

  return {
    session_id: data.session_id,
    user_address: data.user_address,
    expires_at: new Date(data.expires_at),
    last_accessed_at: new Date(data.last_accessed_at),
    is_active: data.is_active,
    metadata: data.metadata || {},
  }
}

/**
 * 更新会话的最后访问时间
 */
export async function updateSessionAccess(session_id: string): Promise<void> {
  const supabase = createAdminClient()

  await supabase.rpc('update_session_access', {
    session_id_param: session_id,
  })
}

/**
 * 使会话失效（登出）
 */
export async function invalidateSession(session_id: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .eq('session_id', session_id)

  if (error) {
    throw new Error(`Failed to invalidate session: ${error.message}`)
  }
}

/**
 * 使指定用户的所有会话失效
 */
export async function invalidateAllUserSessions(
  user_address: string
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .eq('user_address', user_address.toLowerCase())

  if (error) {
    throw new Error(`Failed to invalidate user sessions: ${error.message}`)
  }
}

/**
 * 获取用户的所有活跃会话
 */
export async function getUserActiveSessions(
  user_address: string
): Promise<SessionData[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_address', user_address.toLowerCase())
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('last_accessed_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get user sessions: ${error.message}`)
  }

  return (data || []).map((session) => ({
    session_id: session.session_id,
    user_address: session.user_address,
    expires_at: new Date(session.expires_at),
    last_accessed_at: new Date(session.last_accessed_at),
    is_active: session.is_active,
    metadata: session.metadata || {},
  }))
}

/**
 * 清理过期会话
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const supabase = createAdminClient()

  // 调用数据库函数清理过期会话
  const { error } = await supabase.rpc('cleanup_expired_sessions')

  if (error) {
    throw new Error(`Failed to cleanup expired sessions: ${error.message}`)
  }
}

/**
 * 生成唯一的会话 ID
 */
function generateSessionId(): string {
  // 生成 32 字节的随机字符串，转换为 base64url 格式
  const bytes = randomBytes(32)
  return bytes.toString('base64url')
}

/**
 * 验证以太坊地址格式
 */
function isValidEthereumAddress(address: string): boolean {
  // 简单的以太坊地址格式验证：0x 开头，后跟 40 个十六进制字符
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

