/**
 * 验证会话 API 路由
 * 验证当前会话是否有效
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      user_address: authResult.user_address,
      session: authResult.session,
    })
  } catch (error) {
    console.error('Failed to verify session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify session' },
      { status: 500 }
    )
  }
}

