/**
 * 认证中间件
 * 用于 API 路由中验证用户身份和会话
 */

import { NextRequest } from 'next/server'
import { validateSession, SessionData } from './session'

export interface AuthResult {
  isValid: boolean
  session?: SessionData
  user_address?: string
  error?: string
}

/**
 * 从请求中提取会话 ID
 * 支持从以下位置提取：
 * 1. Authorization header: Bearer <session_id>
 * 2. Cookie: session_id
 * 3. Query parameter: session_id (不推荐，仅用于开发)
 */
export function extractSessionId(request: NextRequest): string | null {
  // 1. 从 Authorization header 提取
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 2. 从 Cookie 提取
  const cookieSessionId = request.cookies.get('session_id')?.value
  if (cookieSessionId) {
    return cookieSessionId
  }

  // 3. 从 Query parameter 提取（仅用于开发环境）
  if (process.env.NODE_ENV === 'development') {
    const querySessionId = request.nextUrl.searchParams.get('session_id')
    if (querySessionId) {
      return querySessionId
    }
  }

  return null
}

/**
 * 验证请求中的会话
 */
export async function verifyAuth(
  request: NextRequest
): Promise<AuthResult> {
  const session_id = extractSessionId(request)

  if (!session_id) {
    // 记录调试信息：检查 Cookie 和 Header
    const cookieSessionId = request.cookies.get('session_id')?.value
    const authHeader = request.headers.get('authorization')
    console.warn('No session ID provided:', {
      hasCookie: !!cookieSessionId,
      cookieLength: cookieSessionId?.length || 0,
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 20) || '',
    })
    return {
      isValid: false,
      error: 'No session ID provided',
    }
  }

  const session = await validateSession(session_id)

  if (!session) {
    // 记录更详细的错误信息
    console.warn('Session validation failed:', {
      session_id: session_id.substring(0, 10) + '...',
      url: request.url,
    })
    return {
      isValid: false,
      error: 'Invalid or expired session',
    }
  }

  return {
    isValid: true,
    session,
    user_address: session.user_address,
  }
}

/**
 * 验证 Web3 地址是否匹配
 */
export function verifyAddressMatch(
  sessionAddress: string,
  requestAddress?: string
): boolean {
  if (!requestAddress) {
    return true // 如果没有提供请求地址，默认通过
  }

  // 统一转换为小写进行比较
  return sessionAddress.toLowerCase() === requestAddress.toLowerCase()
}

