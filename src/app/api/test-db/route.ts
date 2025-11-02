import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// 简单的数据库连接测试接口
export async function GET() {
  try {
    const supabase = createAdminClient();

    // 测试连接：尝试查询一个表
    const { data: testData, error } = await supabase
      .from('llm_configs')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      test: 'passed',
      supabaseConnected: true,
      message: '数据库连接成功',
    });
  } catch (error: any) {
    console.error('数据库连接测试失败:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        test: 'failed',
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          name: error.name,
        },
        supabaseConnected: false,
      },
      { status: 500 }
    );
  }
}

