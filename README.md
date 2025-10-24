# AI交易员

基于AI的投资决策辅助系统，帮助管理投资信息和进行智能分析。

## 功能特性

- 📚 **知识库管理** - 录入和管理投资信息、市场数据
- 💰 **投资记录** - 记录交易决策和投资历史
- 📊 **资产管理** - 跟踪资产组合和盈亏情况
- 👀 **观察列表** - 管理感兴趣的标的
- 🤖 **AI分析** - 基于多模型的投资决策辅助
- 📈 **历史记录** - 查看分析历史

## 技术栈

- **前端**: Next.js 15 + TypeScript + Tailwind CSS
- **UI组件**: shadcn/ui
- **数据库**: PostgreSQL + Prisma ORM
- **部署**: Vercel + Supabase
- **AI**: OpenAI GPT-4 + Anthropic Claude

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `env.example` 为 `.env.local` 并填入配置：

```bash
cp env.example .env.local
```

### 3. 配置数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库模式
npx prisma db push
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── knowledge/         # 知识库页面
│   ├── trades/            # 投资记录页面
│   ├── portfolio/         # 资产管理页面
│   ├── watchlist/         # 观察列表页面
│   ├── analysis/          # AI分析页面
│   ├── history/           # 历史记录页面
│   └── settings/           # 设置页面
├── components/            # React 组件
│   ├── ui/                # shadcn/ui 基础组件
│   ├── header.tsx         # 页面头部
│   └── navigation.tsx     # 导航组件
├── lib/                   # 工具函数
│   └── utils.ts           # 通用工具
└── types/                 # TypeScript 类型定义
```

## 数据模型

系统包含以下核心数据表：

- `knowledge_entries` - 信息条目表
- `llm_configs` - LLM配置表
- `agent_configs` - Agent配置表
- `analysis_history` - 分析历史表
- `trade_records` - 投资决策表
- `watchlist` - 观察标的表
- `asset_portfolio` - 资产组合表
- `cash_transactions` - 现金记录表

## 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 导入 GitHub 仓库
3. 配置环境变量
4. 自动部署完成

### Supabase 数据库

1. 创建 Supabase 项目
2. 获取数据库连接字符串
3. 配置环境变量中的 `DATABASE_URL`

## 开发计划

- [x] 项目初始化和基础配置
- [x] 基础页面和导航
- [ ] 知识库功能实现
- [ ] 投资记录功能实现
- [ ] 资产管理功能实现
- [ ] AI分析功能实现
- [ ] 数据导出功能

## 许可证

MIT License
