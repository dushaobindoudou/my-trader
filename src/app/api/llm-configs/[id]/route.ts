import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// PUT: 更新 LLM 配置
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const body = await req.json();
    const { name, apiKey, apiUrl, isActive } = body;

    const supabase = createAdminClient();
    
    // 如果是只更新 isActive，先获取现有配置
    let updateData: Record<string, any> = {};
    
    if (isActive !== undefined) {
      updateData.is_active = Boolean(isActive);
    }
    
    // 如果提供了其他字段，也需要更新
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (apiKey !== undefined) {
      updateData.api_key = apiKey;
    }
    
    if (apiUrl !== undefined) {
      updateData.api_url = apiUrl;
    }

    // 如果只更新 isActive，不需要验证其他字段
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '没有提供要更新的字段' },
        { status: 400 }
      );
    }

    // 如果更新了 name、apiKey 或 apiUrl，需要验证它们是否都提供了
    const updatingEssentialFields = name !== undefined || apiKey !== undefined || apiUrl !== undefined;
    if (updatingEssentialFields) {
      // 需要获取现有配置以进行验证
      const { data: existingConfig } = await supabase
        .from('llm_configs')
        .select('name, api_key, api_url')
        .eq('id', id)
        .single();

      if (!existingConfig) {
        return NextResponse.json(
          { error: '配置不存在' },
          { status: 404 }
        );
      }

      // 验证更新后的值是否完整
      const finalName = name !== undefined ? name : existingConfig.name;
      const finalApiKey = apiKey !== undefined ? apiKey : existingConfig.api_key;
      const finalApiUrl = apiUrl !== undefined ? apiUrl : existingConfig.api_url;

      if (!finalName || !finalApiKey || !finalApiUrl) {
        return NextResponse.json(
          { error: '名称、API Key 和 API URL 都是必填项' },
          { status: 400 }
        );
      }
    }

    const { data: config, error } = await supabase
      .from('llm_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '配置不存在' },
          { status: 404 }
        );
      }
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
      { error: '更新配置失败', detail: error.message },
      { status: 500 }
    );
  }
}

// DELETE: 删除 LLM 配置
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('llm_configs')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '配置不存在' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: '删除配置失败', detail: error.message },
      { status: 500 }
    );
  }
}

