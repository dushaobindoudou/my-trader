import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET: 获取所有 LLM 配置
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: configs, error } = await supabase
      .from('llm_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 转换数据库字段名为前端格式 (snake_case -> camelCase)
    const transformedConfigs = (configs || []).map((config: any) => ({
      id: config.id,
      name: config.name,
      apiKey: config.api_key || '',
      apiUrl: config.api_url || '',
      isActive: config.is_active ?? true,
      createdAt: config.created_at,
    }));

    return NextResponse.json({ configs: transformedConfigs });
  } catch (error: any) {
    console.error('获取 LLM 配置失败:', error);
    return NextResponse.json(
      {
        error: '获取配置失败',
        detail: error.message,
        code: error.code || 'UNKNOWN',
      },
      { status: 500 }
    );
  }
}

// POST: 创建新的 LLM 配置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, apiKey, apiUrl, isActive = true } = body;

    if (!name || !apiKey || !apiUrl) {
      return NextResponse.json(
        { error: '名称、API Key 和 API URL 都是必填项' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: config, error } = await supabase
      .from('llm_configs')
      .insert({
        name,
        api_key: apiKey,
        api_url: apiUrl,
        is_active: Boolean(isActive),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 转换数据库字段名为前端格式
    const transformedConfig = {
      id: config.id,
      name: config.name,
      apiKey: config.api_key || '',
      apiUrl: config.api_url || '',
      isActive: config.is_active ?? true,
      createdAt: config.created_at,
    };

    return NextResponse.json({ config: transformedConfig });
  } catch (error: any) {
    return NextResponse.json(
      { error: '创建配置失败', detail: error.message },
      { status: 500 }
    );
  }
}

