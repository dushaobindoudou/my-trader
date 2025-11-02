# Prisma 迁移到 Supabase 完成指南

## 迁移完成情况

✅ 已完成从 Prisma 到 Supabase 的完整迁移

## 已完成的更改

### 1. 数据库 Schema
- ✅ 创建了 Supabase migration 文件：`supabase/migrations/20240101000000_initial_schema.sql`
- ✅ 包含了所有表结构（knowledge_entries, llm_configs, agent_configs, analysis_history, trade_records, watchlist, asset_portfolio, cash_transactions, assets, imported_assets, asset_snapshots）
- ✅ 添加了必要的索引和触发器

### 2. Supabase 客户端配置
- ✅ 创建了统一的 Supabase 客户端工具：
  - `src/lib/supabase/client.ts` - 浏览器客户端
  - `src/lib/supabase/server.ts` - 服务端客户端（带会话管理）
  - `src/lib/supabase/admin.ts` - 管理客户端（绕过 RLS）

### 3. API 路由更新
- ✅ `src/app/api/llm-configs/route.ts` - 已迁移到 Supabase
- ✅ `src/app/api/llm-configs/[id]/route.ts` - 已迁移到 Supabase
- ✅ `src/app/api/test-db/route.ts` - 已迁移到 Supabase
- ✅ `src/app/api/assets/route.ts` - 已迁移到 Supabase
- ✅ `src/app/api/test-simple/route.ts` - 已更新环境变量检查

### 4. 清理工作
- ✅ 删除了 `src/lib/prisma.ts`
- ✅ 删除了 `prisma/schema.prisma`
- ✅ 删除了 `src/services/supabase.ts`（旧配置）
- ✅ 从 `package.json` 移除了 Prisma 依赖
- ✅ 更新了 `scripts/check-db-connection.ts` 使用 Supabase

### 5. 依赖更新
- ✅ 添加了 `@supabase/ssr` 依赖（用于 Next.js SSR）
- ✅ 移除了 `@prisma/client` 和 `prisma` 依赖

## 下一步操作

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量

#### 本地开发（使用 Supabase CLI）
如果使用本地 Supabase 开发环境，运行以下脚本自动配置：
```bash
./scripts/update-env-supabase.sh
```

或者手动从 `supabase status` 输出中获取：
```bash
supabase status
```

然后将以下内容添加到 `.env` 文件：
```env
# Supabase 配置（本地开发）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_publishable_key
SUPABASE_SERVICE_ROLE_KEY=你的_secret_key
```

#### 远程 Supabase 项目
从 Supabase Dashboard 获取配置：
```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

⚠️ **重要**：更新环境变量后，需要重启 Next.js 开发服务器才能生效。

### 3. 运行数据库迁移

#### 本地开发（使用 Supabase CLI）
```bash
# 启动本地 Supabase（如果还没有）
supabase start

# 应用迁移
supabase db push
# 或者
supabase migration up
```

#### 远程 Supabase 项目
```bash
# 链接到远程项目
supabase link --project-ref your-project-ref

# 推送迁移
supabase db push
```

### 4. 验证迁移
```bash
# 测试数据库连接
pnpm tsx scripts/check-db-connection.ts

# 启动开发服务器
pnpm dev

# 测试 API 端点
# GET /api/test-db
# GET /api/llm-configs
# GET /api/assets
```

## 重要变更说明

### 字段命名
- Prisma 使用驼峰命名（如 `createdAt`）
- Supabase 使用下划线命名（如 `created_at`）
- API 返回的数据会自动转换，但插入/更新时需要使用下划线命名

### 查询方式
- Prisma: `prisma.model.findMany({ where: {...} })`
- Supabase: `supabase.from('table').select('*').eq('field', value)`

### 错误处理
- Prisma 错误代码（如 `P2025`）改为 Supabase 错误代码（如 `PGRST116`）

### Upsert 操作
- Prisma: `upsert({ where: {...}, update: {...}, create: {...} })`
- Supabase: 先检查是否存在，然后 insert 或 update

## 注意事项

1. **RLS (Row Level Security)**: Supabase 默认启用 RLS，确保：
   - 使用 `admin` 客户端进行操作（绕过 RLS）
   - 或正确配置 RLS 策略

2. **数据类型映射**:
   - `BigInt` → `BIGINT`（在 SQL 中）→ `string`（在 TypeScript 中）
   - `Decimal` → `DECIMAL` → `string`（推荐）或 `number`（可能丢失精度）
   - `Json` → `JSONB`

3. **数组类型**: Supabase 支持 PostgreSQL 数组，使用方式与 Prisma 相同

## 回滚方案

如果需要回滚到 Prisma：
1. 恢复 `prisma/schema.prisma` 文件
2. 恢复 `src/lib/prisma.ts` 文件
3. 恢复所有 API 路由文件
4. 重新安装 Prisma 依赖：`pnpm add @prisma/client prisma`
5. 运行 `pnpm prisma generate`

## 参考资料

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase SSR 指南](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

