/**
 * 检查 confidence_score 字段是否存在
 * 运行: pnpm tsx scripts/check-confidence-score.ts
 */

import { createAdminClient } from '../src/lib/supabase/admin'

async function checkConfidenceScore() {
  console.log('🔍 检查 confidence_score 字段...\n')

  const supabase = createAdminClient()

  try {
    // 尝试查询表结构
    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('confidence_score')
      .limit(1)

    if (error) {
      if (error.message.includes('confidence_score')) {
        console.error('❌ confidence_score 字段不存在')
        console.error('   错误:', error.message)
        console.log('\n💡 解决方案:')
        console.log('   1. 运行迁移: supabase db push')
        console.log('   2. 或手动执行 SQL:')
        console.log('      ALTER TABLE knowledge_entries ADD COLUMN IF NOT EXISTS confidence_score INTEGER CHECK (confidence_score IS NULL OR (confidence_score >= 1 AND confidence_score <= 10));')
        return
      }
      throw error
    }

    console.log('✅ confidence_score 字段存在')
    console.log('   数据:', data)
  } catch (error: any) {
    console.error('❌ 检查失败:', error.message)
  }
}

checkConfidenceScore().catch(console.error)

