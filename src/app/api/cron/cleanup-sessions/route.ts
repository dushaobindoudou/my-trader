/**
 * 定时清理过期会话
 * 可以配置为 Cron Job 定期调用
 */

import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredSessions } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 验证请求来源（可选，增加安全性）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 清理过期会话
    await cleanupExpiredSessions()

    return NextResponse.json({
      success: true,
      message: 'Expired sessions cleaned up',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to cleanup sessions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cleanup sessions' },
      { status: 500 }
    )
  }
}

