/**
 * 登录 API 路由
 * 创建用户会话，返回 session_id
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_address, expiresInHours, metadata } = body

    // 验证必填字段
    if (!user_address) {
      return NextResponse.json(
        { error: 'user_address is required' },
        { status: 400 }
      )
    }

    // 创建会话
    const session = await createSession({
      user_address,
      expiresInHours: expiresInHours || 24, // 默认 24 小时
      metadata: metadata || {},
    })

    // 设置 Cookie（可选，也可以只返回 session_id 让客户端管理）
    const cookieStore = await cookies()
    cookieStore.set('session_id', session.session_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * (expiresInHours || 24), // 秒
      path: '/',
    })

    return NextResponse.json({
      session_id: session.session_id,
      user_address: session.user_address,
      expires_at: session.expires_at.toISOString(),
    })
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    )
  }
}

