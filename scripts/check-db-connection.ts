/**
 * 数据库连接诊断脚本（Supabase）
 * 运行: pnpm tsx scripts/check-db-connection.ts
 */

import { createClient } from '@supabase/supabase-js';

async function diagnoseDatabase() {
  console.log('🔍 数据库连接诊断开始...\n');

  // 1. 检查环境变量
  console.log('📋 环境变量检查:');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL 未设置');
    return;
  }

  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 未设置');
    return;
  }

  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey?.substring(0, 20)}...`);
  
  if (supabaseServiceKey) {
    console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey?.substring(0, 20)}...`);
  } else {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY 未设置（服务端操作需要）');
  }

  // 2. 尝试连接
  console.log('\n🔌 测试数据库连接:');
  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

  try {
    // 尝试简单查询
    const { data, error } = await supabase
      .from('llm_configs')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Supabase 客户端连接成功');

    // 检查表列表（通过查询系统表）
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    }).catch(() => {
      // 如果 RPC 不存在，尝试查询一个已知表
      return { data: null, error: null };
    });

    if (tables && Array.isArray(tables)) {
      console.log(`✅ 找到 ${tables.length} 个表`);
      if (tables.length > 0) {
        console.log('   表列表:', tables.map((t: any) => t.tablename).join(', '));
      }
    }

    console.log('✅ 数据库查询成功');

  } catch (error: any) {
    console.error('❌ 数据库连接失败:');
    console.error('   错误代码:', error.code);
    console.error('   错误信息:', error.message);
    console.error('   错误详情:', error.details);
    console.error('   错误提示:', error.hint);
  }

  // 3. 提供建议
  console.log('\n💡 建议:');
  console.log('   1. 确保 Supabase 项目已正确配置');
  console.log('   2. 检查环境变量是否正确设置');
  console.log('   3. 运行 migrations: supabase db push 或 supabase migration up');
  console.log('   4. 如果使用本地开发，确保运行: supabase start');

  console.log('\n✅ 诊断完成');
}

diagnoseDatabase().catch(console.error);
