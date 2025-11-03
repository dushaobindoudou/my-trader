# Web3认证系统配置指南

## 概述

本项目集成了Web3Auth，提供多种Web3登录方式，包括Google、Twitter、Discord、GitHub和Email等。用户可以通过这些方式安全地连接钱包并访问平台。

## 配置步骤

### 1. 环境变量配置

复制 `env.example` 文件为 `.env.local` 并配置以下变量：

```bash
# Web3Auth 配置
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
NEXT_PUBLIC_WEB3AUTH_NETWORK=testnet
NEXT_PUBLIC_ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_api_key_here

# 应用配置
NEXT_PUBLIC_APP_NAME=AIphaTrader
NEXT_PUBLIC_APP_DESCRIPTION=Web3投资系统
```

### 2. Web3Auth 设置

1. 访问 [Web3Auth Dashboard](https://dashboard.web3auth.io/)
2. 创建新项目或使用现有项目
3. 获取 Client ID
4. 配置支持的登录方式：
   - Google OAuth
   - Twitter OAuth
   - Discord OAuth
   - GitHub OAuth
   - Email Passwordless

### 3. 社交登录配置

#### Google OAuth
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建OAuth 2.0客户端ID
3. 配置授权重定向URI
4. 获取客户端ID和密钥

#### Twitter OAuth
1. 访问 [Twitter Developer Portal](https://developer.twitter.com/)
2. 创建应用并获取API密钥
3. 配置回调URL

#### Discord OAuth
1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 创建应用并获取客户端ID
3. 配置OAuth2重定向

#### GitHub OAuth
1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建OAuth App
3. 配置授权回调URL

### 4. 网络配置

项目默认配置为以太坊主网，您可以根据需要修改：

```typescript
// src/config/auth.ts
chainConfig: {
  chainNamespace: 'eip155',
  chainId: '0x1', // Ethereum Mainnet
  rpcTarget: process.env.NEXT_PUBLIC_ETH_RPC_URL,
  displayName: 'Ethereum Mainnet',
  blockExplorerUrl: 'https://etherscan.io',
  ticker: 'ETH',
  tickerName: 'Ethereum',
  decimals: 18,
}
```

## 功能特性

### 登录页面
- 炫酷的动画背景效果
- 多种登录方式支持
- 响应式设计
- 专业的金融风格

### 认证保护
- 自动路由保护
- 登录状态管理
- 用户信息展示
- 安全退出功能

### 用户界面
- 用户头像和基本信息
- 钱包地址显示
- 登录方式标识
- 快速操作菜单

## 使用方法

### 1. 访问登录页面
访问 `/login` 页面进行登录

### 2. 选择登录方式
- 点击"连接钱包"按钮
- 选择偏好的登录方式
- 完成认证流程

### 3. 访问受保护页面
登录成功后，可以访问所有受保护的页面：
- `/portfolio` - 投资组合
- `/trades` - 交易
- `/analysis` - 分析
- `/watchlist` - 自选股
- `/history` - 历史
- `/knowledge` - 知识库
- `/settings` - 设置

### 4. 测试认证功能
访问 `/test-auth` 页面可以测试认证功能，查看用户信息和原始数据。

## 技术架构

### 核心组件
- `Web3AuthProvider` - Web3Auth上下文提供者
- `AuthGuard` - 路由保护组件
- `UserProfile` - 用户信息组件
- `LoginPage` - 登录页面

### 配置文件
- `src/config/auth.ts` - 认证配置
- `env.example` - 环境变量示例

### 样式特性
- 基于Tailwind CSS的灰色主题
- 渐变背景和动画效果
- 响应式设计
- 专业的金融风格

## 安全考虑

1. **私钥安全**: 用户私钥完全由用户控制，平台不存储私钥
2. **认证安全**: 使用Web3Auth的安全认证流程
3. **数据保护**: 用户数据加密存储和传输
4. **权限控制**: 基于认证状态的访问控制

## 故障排除

### 常见问题

1. **登录失败**
   - 检查Web3Auth Client ID是否正确
   - 确认网络连接正常
   - 检查浏览器控制台错误信息

2. **页面重定向问题**
   - 确认路由配置正确
   - 检查认证状态管理
   - 验证AuthGuard组件配置

3. **样式问题**
   - 确认Tailwind CSS配置正确
   - 检查组件导入路径
   - 验证CSS变量定义

### 调试工具
- 使用 `/test-auth` 页面查看认证状态
- 检查浏览器开发者工具控制台
- 查看网络请求和响应

## 开发指南

### 添加新的登录方式
1. 在Web3Auth Dashboard中配置新的登录方式
2. 更新 `src/config/auth.ts` 中的配置
3. 在登录页面添加相应的UI元素

### 自定义样式
1. 修改 `src/app/login/page.tsx` 中的样式
2. 更新 `src/app/globals.css` 中的全局样式
3. 调整 `tailwind.config.ts` 中的主题配置

### 扩展功能
1. 添加更多用户信息字段
2. 实现钱包余额查询
3. 集成更多区块链网络
4. 添加交易历史功能

## 部署注意事项

1. 确保所有环境变量正确配置
2. 验证Web3Auth配置的有效性
3. 测试所有登录方式
4. 检查HTTPS配置（生产环境必需）
5. 配置正确的域名和回调URL

## 支持

如有问题，请参考：
- [Web3Auth文档](https://web3auth.io/docs/)
- [项目GitHub仓库](https://github.com/your-repo)
- 联系技术支持团队
