import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 最简单的测试接口，不涉及数据库
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Next.js API 路由正常工作',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}

