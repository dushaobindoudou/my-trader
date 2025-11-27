# 数据隔离实施方案

## 概述

本文档描述了基于 Web3 地址的数据隔离实施方案，确保不同用户的数据完全隔离，并提供安全的会话管理机制。

## 实施内容

### 1. 数据库迁移

#### 1.1 添加用户地址字段
- **文件**: `supabase/migrations/20240104000000_add_user_address.sql`
- **内容**: 
  - 为 `knowledge_entries` 表添加 `user_address` 字段
  - 为其他需要数据隔离的表也添加 `user_address` 字段（analysis_history, trade_records, watchlist, asset_portfolio, cash_transactions）
  - 创建索引以优化查询性能

#### 1.2 创建会话管理表
- **文件**: `supabase/migrations/20240104000001_add_user_sessions.sql`
- **内容**:
  - 创建 `user_sessions` 表用于管理用户会话
  - 包含字段：session_id, user_address, expires_at, last_accessed_at, is_active, metadata
  - 创建清理过期会话的函数
  - 创建更新会话访问时间的函数

### 2. 认证和会话管理

#### 2.1 会话管理服务
- **文件**: `src/lib/auth/session.ts`
- **功能**:
  - `createSession()`: 创建新会话
  - `validateSession()`: 验证会话有效性
  - `updateSessionAccess()`: 更新会话最后访问时间
  - `invalidateSession()`: 使会话失效
  - `invalidateAllUserSessions()`: 使用户所有会话失效
  - `getUserActiveSessions()`: 获取用户所有活跃会话
  - `cleanupExpiredSessions()`: 清理过期会话

#### 2.2 认证中间件
- **文件**: `src/lib/auth/middleware.ts`
- **功能**:
  - `extractSessionId()`: 从请求中提取会话 ID（支持 Authorization header、Cookie、Query parameter）
  - `verifyAuth()`: 验证请求中的会话
  - `verifyAddressMatch()`: 验证地址是否匹配

### 3. 数据隔离实现

#### 3.1 更新知识库操作函数
- **文件**: `src/lib/knowledge.ts`
- **修改**:
  - 所有查询函数都添加 `user_address` 参数
  - 所有查询都根据 `user_address` 过滤数据
  - 创建和更新操作自动设置 `user_address`
  - 删除操作验证 `user_address` 匹配

#### 3.2 更新类型定义
- **文件**: `src/types/knowledge.ts`
- **修改**:
  - `KnowledgeEntry` 接口添加 `user_address` 字段
  - `KnowledgeEntryCreateInput` 添加 `user_address` 字段（必需）
  - `KnowledgeEntryUpdateInput` 添加 `user_address` 字段（必需）
  - `KnowledgeEntryFilter` 添加 `user_address` 字段（必需）

### 4. API 路由更新

#### 4.1 知识库 API
- **文件**: `src/app/api/knowledge/route.ts` 和 `src/app/api/knowledge/[id]/route.ts`
- **修改**:
  - 所有路由都添加认证中间件验证
  - 从会话中获取 `user_address`，不允许客户端指定
  - 所有操作都根据 `user_address` 进行数据隔离

#### 4.2 认证 API
- **文件**: 
  - `src/app/api/auth/login/route.ts`: 创建会话
  - `src/app/api/auth/logout/route.ts`: 使会话失效
  - `src/app/api/auth/verify/route.ts`: 验证会话有效性

#### 4.3 定时清理任务
- **文件**: `src/app/api/cron/cleanup-sessions/route.ts`
- **功能**: 定期清理过期会话（可配置为 Cron Job）

## 使用流程

### 1. 用户登录流程

```typescript
// 1. 用户通过 Web3 钱包连接，获取地址
const address = await getAddress()

// 2. 调用登录 API 创建会话
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_address: address,
    expiresInHours: 24, // 可选，默认 24 小时
  }),
})

const { session_id } = await response.json()

// 3. 在后续请求中携带 session_id
// 方式 1: Authorization header
headers: { 'Authorization': `Bearer ${session_id}` }

// 方式 2: Cookie（自动处理）
// 登录 API 会自动设置 Cookie
```

### 2. API 请求流程

```typescript
// 所有需要认证的 API 请求都会：
// 1. 从请求中提取 session_id
// 2. 验证会话有效性
// 3. 获取 user_address
// 4. 根据 user_address 过滤数据

// 示例：获取知识库条目
const response = await fetch('/api/knowledge', {
  headers: {
    'Authorization': `Bearer ${session_id}`,
  },
})

// 返回的数据只包含当前用户的数据
```

### 3. 会话管理

```typescript
// 验证会话
const response = await fetch('/api/auth/verify', {
  headers: { 'Authorization': `Bearer ${session_id}` },
})

// 登出
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${session_id}` },
})
```

## 安全性措施

### 1. 会话安全
- 会话 ID 使用加密安全的随机数生成
- 会话有过期时间，默认 24 小时
- 支持自动清理过期会话
- 每次访问自动更新最后访问时间

### 2. 数据隔离
- 所有查询都强制根据 `user_address` 过滤
- 创建和更新操作自动设置 `user_address`，不允许客户端指定
- 删除操作验证 `user_address` 匹配

### 3. 认证验证
- 所有受保护的 API 路由都验证会话
- 未认证的请求返回 401 错误
- 会话验证失败时拒绝访问

## 定时清理任务配置

### Vercel Cron Jobs

在 `vercel.json` 中添加：

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 环境变量

在 `.env` 中添加：

```env
CRON_SECRET=your_secret_key_here
```

## 数据库迁移

运行以下命令应用数据库迁移：

```bash
# 使用 Supabase CLI
supabase migration up

# 或使用 SQL 客户端直接执行迁移文件
```

## 注意事项

1. **现有数据**: 迁移后，现有数据的 `user_address` 字段为 NULL，需要手动处理或迁移脚本
2. **会话过期**: 默认会话过期时间为 24 小时，可根据需求调整
3. **多设备登录**: 系统允许多个会话同时存在，可根据需求限制
4. **性能优化**: 已为 `user_address` 字段创建索引，优化查询性能

## 后续优化建议

1. 实现 Row Level Security (RLS) 策略，在数据库层面强制数据隔离
2. 添加会话刷新机制，延长活跃会话的过期时间
3. 实现会话设备管理，允许用户查看和管理所有活跃会话
4. 添加会话安全日志，记录异常访问行为

