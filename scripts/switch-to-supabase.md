# 切换到 Supabase 直接连接

## 快速切换步骤

### 1. 获取 Supabase 连接字符串

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **Database**
4. 找到 **Connection string** 部分
5. 选择 **URI** 模式
6. 复制连接字符串（格式：`postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`）

### 2. 更新 .env 文件

将 `.env` 文件中的数据库配置更新为：

```bash
# Supabase 直接连接（推荐）
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**注意：**
- `DATABASE_URL` 使用端口 **6543**（PgBouncer 连接池）
- `DIRECT_URL` 使用端口 **5432**（直接连接，用于迁移）

### 3. 重新生成 Prisma 客户端

```bash
pnpm prisma generate
```

### 4. 同步数据库 Schema

```bash
pnpm prisma db push
```

### 5. 测试连接

访问 `http://localhost:3000/api/test-db` 确认连接正常。

## 如果数据库是空的

如果数据库是空的或需要重置，运行：

```bash
# 1. 重置数据库（可选，会删除所有数据）
# 在 Supabase Dashboard → Settings → General → Danger Zone → Reset Database

# 2. 同步 Schema
pnpm prisma db push

# 3. 测试连接
curl http://localhost:3000/api/test-db
```

## 验证

访问以下接口验证：

1. `/api/test-simple` - Next.js API 正常
2. `/api/test-db` - 数据库连接正常
3. `/api/llm-configs` - LLM 配置接口正常

