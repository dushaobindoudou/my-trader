/**
 * 登出 API 路由
 * 使会话失效
 */

import { NextRequest, NextResponse } from 'next/server'
import { invalidateSession } from '@/lib/auth/session'
import { extractSessionId } from '@/lib/auth/middleware'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const session_id = extractSessionId(request)

    if (!session_id) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      )
    }

    // 使会话失效
    await invalidateSession(session_id)

    // 清除 Cookie
    const cookieStore = await cookies()
    cookieStore.delete('session_id')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to logout:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to logout' },
      { status: 500 }
    )
  }
}

