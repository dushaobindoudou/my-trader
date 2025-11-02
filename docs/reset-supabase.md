# 重置 Supabase 数据库指南

如果遇到 Prisma Data Platform 连接问题（P5010 错误），可以切换到 Supabase 直接连接。

## 方案 1: 切换到 Supabase 直接连接（推荐）

### 步骤 1: 获取 Supabase 数据库连接信息

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **Database**
4. 找到 **Connection string** 部分
5. 选择 **URI** 模式，复制连接字符串，格式如下：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 步骤 2: 更新 .env 文件

将 `.env` 文件中的数据库配置替换为 Supabase 连接字符串：

```bash
# 将 Prisma Data Platform 连接字符串替换为 Supabase 直接连接
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**注意：**
- `DATABASE_URL` 使用 `pgbouncer=true`（端口 6543，用于连接池）
- `DIRECT_URL` 不使用连接池（端口 5432，用于迁移）

### 步骤 3: 更新 Prisma Schema（如果需要）

如果 `prisma/schema.prisma` 中的 `directUrl` 配置有问题，确保它指向 `DIRECT_URL`：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 步骤 4: 重新生成 Prisma 客户端

```bash
pnpm prisma generate
```

### 步骤 5: 同步数据库 Schema

```bash
pnpm prisma db push
```

### 步骤 6: 测试连接

访问 `/api/test-db` 接口，确认连接正常。

## 方案 2: 重置 Supabase 数据库（谨慎操作）

⚠️ **警告：** 此操作会删除所有数据！

### 方法 1: 通过 Supabase Dashboard

1. 登录 Supabase Dashboard
2. 进入 **Settings** → **General**
3. 滚动到底部找到 **Danger Zone**
4. 点击 **Reset Database** 按钮
5. 确认操作

### 方法 2: 通过 SQL（删除所有表）

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 执行以下 SQL（⚠️ 会删除所有表）：

```sql
-- 禁用外键检查
SET session_replication_role = 'replica';

-- 删除所有自定义表
DROP TABLE IF EXISTS llm_configs CASCADE;
DROP TABLE IF EXISTS agent_configs CASCADE;
DROP TABLE IF EXISTS knowledge_entries CASCADE;
DROP TABLE IF EXISTS analysis_history CASCADE;
DROP TABLE IF EXISTS trade_records CASCADE;
DROP TABLE IF EXISTS watchlist CASCADE;
DROP TABLE IF EXISTS asset_portfolio CASCADE;
DROP TABLE IF EXISTS cash_transactions CASCADE;
DROP TABLE IF EXISTS asset_snapshots CASCADE;
DROP TABLE IF EXISTS imported_assets CASCADE;
DROP TABLE IF EXISTS assets CASCADE;

-- 重新启用外键检查
SET session_replication_role = 'origin';
```

4. 然后重新运行迁移：
   ```bash
   pnpm prisma db push
   ```

## 方案 3: 解决 Prisma Data Platform 连接问题

如果你仍想使用 Prisma Data Platform，需要检查：

1. **检查 API Key 是否有效**
   - 登录 [Prisma Cloud Dashboard](https://console.prisma.io)
   - 检查项目状态和 API Key

2. **检查网络连接**
   - Prisma Data Platform 需要网络连接到加速服务
   - 确认防火墙没有阻止连接

3. **检查环境变量**
   - 确认 `.env` 文件中的 `DATABASE_URL` 格式正确
   - 格式应为：`prisma+postgres://localhost:51213/?api_key=...`

4. **更新 Prisma Client**
   ```bash
   pnpm prisma generate
   pnpm prisma db pull
   ```

## 推荐操作流程

1. **立即切换到 Supabase 直接连接**（方案 1）
2. 如果数据不重要，可以重置数据库（方案 2）
3. 如果数据重要，先备份数据，再重置

切换到 Supabase 直接连接是最稳定的方案，避免了 Prisma Data Platform 的网络依赖。

