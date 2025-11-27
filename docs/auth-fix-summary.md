# 认证问题修复总结

## 问题分析

### 原始问题
用户反馈 session 验证返回"未认证"状态。

### 根本原因
经过完整的登录流程梳理，发现了以下问题：

1. **中间件验证逻辑被注释**：`src/lib/auth/middleware.ts` 中的 `verifyAuth()` 函数的验证逻辑被完全注释掉，直接返回硬编码的测试地址。

2. **缺少后端会话创建**：`src/contexts/web3auth-context.tsx` 中的 `login()` 函数只调用了 Web3Auth 的 `connect()`，但没有调用后端的 `/api/auth/login` API 来创建会话。

### 完整的登录流程应该是：

```
用户点击"连接钱包"
    ↓
调用 Web3Auth connect() → 获取 address
    ↓
调用 /api/auth/login → 创建 session 并设置 Cookie
    ↓
后续 API 请求携带 Cookie 中的 session_id
    ↓
verifyAuth() 验证 session_id → 返回 user_address
```

### 实际的问题流程：

```
用户点击"连接钱包"
    ↓
调用 Web3Auth connect() → 获取 address
    ↓
❌ 没有调用 /api/auth/login
    ↓
后续 API 请求没有 session_id
    ↓
❌ verifyAuth() 被注释，返回硬编码地址
```

## 修复内容

### 1. 恢复中间件验证逻辑

**文件**：`src/lib/auth/middleware.ts`

**修改**：
- 取消注释 `verifyAuth()` 函数中的所有验证逻辑
- 移除硬编码的测试地址
- 恢复真实的 session 验证流程

```typescript
export async function verifyAuth(
  request: NextRequest
): Promise<AuthResult> {
  const session_id = extractSessionId(request)

  if (!session_id) {
    // 记录调试信息
    console.warn('No session ID provided:', { ... })
    return {
      isValid: false,
      error: 'No session ID provided',
    }
  }

  const session = await validateSession(session_id)

  if (!session) {
    console.warn('Session validation failed:', { ... })
    return {
      isValid: false,
      error: 'Invalid or expired session',
    }
  }

  return {
    isValid: true,
    session,
    user_address: session.user_address,
  }
}
```

### 2. 添加后端会话创建逻辑

**文件**：`src/contexts/web3auth-context.tsx`

**修改**：
- 添加 `useEffect` 监听连接状态和地址变化
- 当连接成功且有地址时，自动调用 `/api/auth/login` 创建会话
- 使用 `sessionCreatedRef` 避免重复创建会话
- 在 `logout()` 中添加调用 `/api/auth/logout` 的逻辑

```typescript
// 当连接成功且有地址时，自动创建后端会话
useEffect(() => {
  const createBackendSession = async () => {
    if (isConnected && address && sessionCreatedRef.current !== address) {
      try {
        console.log('Creating backend session for address:', address);
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 包含 Cookie
          body: JSON.stringify({
            user_address: address,
            expiresInHours: 24,
            metadata: {
              connectorName,
              chainId,
              loginTime: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to create backend session:', error);
          return;
        }

        const data = await response.json();
        console.log('Backend session created successfully:', {
          session_id: data.session_id?.substring(0, 10) + '...',
          user_address: data.user_address,
        });
        
        // 标记已为此地址创建会话
        sessionCreatedRef.current = address;
      } catch (error) {
        console.error('Error creating backend session:', error);
      }
    }
  };

  createBackendSession();
}, [isConnected, address, connectorName, chainId]);
```

## 测试步骤

### 前置条件

1. **确保 Supabase 配置正确**：
   ```bash
   # 检查 .env 或 .env.local 文件
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

2. **确保数据库迁移已执行**：
   ```bash
   # 检查 user_sessions 表是否存在
   # 文件：supabase/migrations/20240104000001_add_user_sessions.sql
   ```

3. **确保 Web3Auth 配置正确**：
   ```bash
   NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_client_id
   NEXT_PUBLIC_WEB3AUTH_NETWORK=testnet
   ```

### 测试流程

1. **启动开发服务器**：
   ```bash
   pnpm dev
   ```

2. **打开浏览器控制台**（F12），切换到 Console 和 Network 标签页

3. **访问登录页面**：
   ```
   http://localhost:3000/login
   ```

4. **点击"连接钱包"按钮**

5. **观察控制台输出**，应该看到：
   ```
   Creating backend session for address: 0x...
   Backend session created successfully: { session_id: '...', user_address: '0x...' }
   ```

6. **检查 Network 标签页**，应该看到：
   - POST `/api/auth/login` - 状态码 200
   - 响应包含 `session_id` 和 `user_address`

7. **检查 Application → Cookies**，应该看到：
   - Cookie 名称：`session_id`
   - Cookie 值：一个长字符串（base64url 格式）
   - HttpOnly：✓
   - Secure：根据环境（生产环境为 ✓）
   - SameSite：Lax

8. **访问需要认证的页面**（如 `/knowledge`）

9. **打开浏览器开发者工具 → Network 标签页**

10. **观察 API 请求**（如 `/api/knowledge`），应该：
    - 请求自动携带 Cookie 中的 `session_id`
    - 返回状态码 200（而不是 401）
    - 返回当前用户的数据

11. **检查服务器日志**（终端），不应该看到：
    - `No session ID provided`
    - `Session validation failed`

### 验证会话 API

可以直接访问验证接口测试：

```bash
# 在浏览器中访问（登录后）
http://localhost:3000/api/auth/verify
```

应该返回：
```json
{
  "valid": true,
  "user_address": "0x...",
  "session": {
    "session_id": "...",
    "user_address": "0x...",
    "expires_at": "...",
    "last_accessed_at": "...",
    "is_active": true
  }
}
```

### 测试登出

1. **调用登出接口**（或点击登出按钮）

2. **观察控制台**，应该看到：
   - POST `/api/auth/logout` - 状态码 200

3. **检查 Cookies**：
   - `session_id` Cookie 应该被删除

4. **再次访问需要认证的页面**：
   - 应该返回 401 或重定向到登录页

## 常见问题排查

### 问题 1：创建会话失败

**症状**：
```
Failed to create backend session: { error: "Failed to create session: ..." }
```

**可能原因**：
1. Supabase 配置错误
2. `user_sessions` 表不存在
3. 网络问题

**解决方法**：
1. 检查 `.env` 文件中的 Supabase 配置
2. 运行数据库迁移：`supabase/migrations/20240104000001_add_user_sessions.sql`
3. 检查 Supabase 控制台中的表和权限

### 问题 2：验证失败

**症状**：
```
Session validation failed: { session_id: '...', url: '...' }
```

**可能原因**：
1. Session 已过期
2. Session 在数据库中不存在
3. `is_active` 字段为 false

**解决方法**：
1. 重新登录
2. 检查数据库中的 `user_sessions` 表
3. 检查 `expires_at` 字段是否在未来

### 问题 3：Cookie 未设置

**症状**：浏览器 Cookies 中没有 `session_id`

**可能原因**：
1. `/api/auth/login` 返回错误
2. Cookie 设置失败（跨域问题）

**解决方法**：
1. 检查 Network 标签页中 `/api/auth/login` 的响应
2. 检查 `Set-Cookie` 响应头
3. 确保前后端在同一域名下（或正确配置 CORS）

### 问题 4：Cookie 未发送

**症状**：API 请求中没有携带 `session_id` Cookie

**可能原因**：
1. 前端请求未设置 `credentials: 'include'`
2. Cookie 的 SameSite 设置问题

**解决方法**：
1. 确保所有 fetch 请求都包含 `credentials: 'include'`
2. 检查 Cookie 的 SameSite 设置（应该是 'lax' 或 'none'）

## 相关文件

- `src/lib/auth/middleware.ts` - 认证中间件
- `src/lib/auth/session.ts` - 会话管理
- `src/contexts/web3auth-context.tsx` - Web3Auth 上下文
- `src/app/api/auth/login/route.ts` - 登录 API
- `src/app/api/auth/logout/route.ts` - 登出 API
- `src/app/api/auth/verify/route.ts` - 验证 API
- `supabase/migrations/20240104000001_add_user_sessions.sql` - 数据库迁移

## 后续优化建议

1. **添加会话刷新机制**：在会话即将过期时自动刷新
2. **添加会话管理页面**：让用户查看和管理自己的活跃会话
3. **添加设备指纹**：在 metadata 中记录设备信息，增强安全性
4. **添加 IP 白名单**：可选的安全增强功能
5. **添加会话活动日志**：记录会话的所有活动，便于审计

