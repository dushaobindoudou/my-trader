/**
 * 脚本：添加 confidence_score 字段到本地 Supabase 数据库
 * 运行: pnpm tsx scripts/add-confidence-score.ts
 */

import { createClient } from '@supabase/supabase-js'

async function addConfidenceScore() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

  console.log('🔧 正在添加 confidence_score 字段...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // SQL 语句
  const sql = `
    -- 添加置信度评分字段（如果不存在）
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_entries' 
        AND column_name = 'confidence_score'
      ) THEN
        ALTER TABLE knowledge_entries 
        ADD COLUMN confidence_score INTEGER 
        CHECK (confidence_score IS NULL OR (confidence_score >= 1 AND confidence_score <= 10));
        
        -- 添加索引
        CREATE INDEX idx_knowledge_entries_confidence_score 
        ON knowledge_entries(confidence_score) 
        WHERE confidence_score IS NOT NULL;
        
        -- 添加注释
        COMMENT ON COLUMN knowledge_entries.confidence_score IS '置信度评分，1-10分制，1表示不可靠，10表示非常可靠。NULL表示未评分';
        
        RAISE NOTICE '✅ confidence_score 字段已成功添加';
      ELSE
        RAISE NOTICE 'ℹ️  confidence_score 字段已存在，跳过';
      END IF;
    END $$;
  `

  try {
    // 使用 RPC 执行 SQL（如果可用）
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sql.replace(/\$\$/g, '$$'),
    }).catch(async () => {
      // 如果 RPC 不存在，尝试直接执行 SQL
      // 注意：Supabase JS 客户端不直接支持执行 SQL，需要使用管理客户端
      // 这里我们使用 Supabase 管理 API
      return { data: null, error: { message: '需要手动执行 SQL' } }
    })

    if (error) {
      console.error('❌ 执行 SQL 失败:', error.message)
      console.log('\n📝 请手动执行以下 SQL 语句：\n')
      console.log(sql)
      console.log('\n💡 或者使用以下方式：')
      console.log('   1. 访问 Supabase Studio: http://127.0.0.1:54323')
      console.log('   2. 进入 SQL Editor')
      console.log('   3. 粘贴上面的 SQL 语句并执行')
      return
    }

    console.log('✅ confidence_score 字段添加成功！')
  } catch (error: any) {
    console.error('❌ 执行失败:', error.message)
    console.log('\n📝 请手动执行以下 SQL 语句：\n')
    console.log(sql)
    console.log('\n💡 或者使用以下方式：')
    console.log('   1. 访问 Supabase Studio: http://127.0.0.1:54323')
    console.log('   2. 进入 SQL Editor')
    console.log('   3. 粘贴上面的 SQL 语句并执行')
  }
}

addConfidenceScore().catch(console.error)

