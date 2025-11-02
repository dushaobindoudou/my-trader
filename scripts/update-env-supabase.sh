#!/bin/bash

# 从 Supabase 本地状态获取并更新环境变量到 .env 文件

echo "正在获取 Supabase 环境变量..."

# 检查 Supabase 是否运行
if ! supabase status > /dev/null 2>&1; then
  echo "❌ Supabase 未运行，请先运行: supabase start"
  exit 1
fi

# 获取环境变量
API_URL=$(supabase status 2>&1 | grep "API URL" | awk '{print $3}')
PUBLISHABLE_KEY=$(supabase status 2>&1 | grep "Publishable key" | awk '{print $3}')
SECRET_KEY=$(supabase status 2>&1 | grep "Secret key" | awk '{print $3}')

if [ -z "$API_URL" ] || [ -z "$PUBLISHABLE_KEY" ] || [ -z "$SECRET_KEY" ]; then
  echo "❌ 无法获取 Supabase 环境变量"
  exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
  echo "创建新的 .env 文件..."
  touch .env
fi

# 备份现有 .env 文件
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ 已备份现有 .env 文件"

# 创建临时文件，移除旧的 Supabase 配置
grep -v "^NEXT_PUBLIC_SUPABASE" .env | grep -v "^SUPABASE_SERVICE_ROLE_KEY" | grep -v "^# Supabase 配置" > .env.tmp || touch .env.tmp

# 移除文件末尾的空行
sed -i '' '/^$/d' .env.tmp 2>/dev/null || sed -i '/^$/d' .env.tmp 2>/dev/null

# 添加新的配置
echo "" >> .env.tmp
echo "# Supabase 配置（本地开发）" >> .env.tmp
echo "NEXT_PUBLIC_SUPABASE_URL=$API_URL" >> .env.tmp
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$PUBLISHABLE_KEY" >> .env.tmp
echo "SUPABASE_SERVICE_ROLE_KEY=$SECRET_KEY" >> .env.tmp

# 替换原文件
mv .env.tmp .env
echo "✅ 已更新 .env 文件"
echo ""
echo "更新的环境变量："
echo "  NEXT_PUBLIC_SUPABASE_URL=$API_URL"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=$PUBLISHABLE_KEY"
echo "  SUPABASE_SERVICE_ROLE_KEY=$SECRET_KEY"
echo ""
echo "⚠️  注意：请重启 Next.js 开发服务器以加载新的环境变量"

