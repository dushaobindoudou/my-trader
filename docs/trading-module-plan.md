# 交易模块开发规划

## 一、需求分析

### 1.1 核心功能
- ✅ 集成 Hyperliquid API
- ✅ 封装基础交易接口供 Agent 调用
- ✅ 获取市场数据（5min, 1h, 4h, 1d, 1w）
- ✅ 图表展示股票数据，支持时间周期切换
- ✅ 交易历史记录

### 1.2 扩展功能分析
基于自动交易 Agent 的需求，还需要以下功能：

1. **账户管理**
   - 账户余额查询
   - 持仓查询
   - 账户资产统计

2. **订单管理**
   - 订单状态查询
   - 订单历史
   - 订单取消
   - 订单修改

3. **风险管理**
   - 止损/止盈设置
   - 仓位限制
   - 风险指标计算

4. **数据缓存与同步**
   - K线数据缓存
   - 定时同步市场数据
   - 数据更新通知

5. **交易策略记录**
   - 记录 Agent 的交易决策
   - 策略执行历史
   - 策略效果分析

6. **监控与告警**
   - 交易异常监控
   - 价格波动告警
   - 账户风险告警

## 二、技术架构

### 2.1 数据库设计

#### 2.1.1 交易记录表 (trades)
```sql
- id: uuid (主键)
- user_address: text (用户地址，数据隔离)
- symbol: text (交易对，如 BTC/USD)
- side: text (buy/sell)
- order_type: text (market/limit/stop)
- quantity: decimal (数量)
- price: decimal (价格)
- status: text (pending/filled/cancelled/failed)
- order_id: text (Hyperliquid 订单ID)
- executed_at: timestamp (执行时间)
- created_at: timestamp
- updated_at: timestamp
```

#### 2.1.2 持仓表 (positions)
```sql
- id: uuid (主键)
- user_address: text (用户地址)
- symbol: text (交易对)
- side: text (long/short)
- size: decimal (持仓大小)
- entry_price: decimal (开仓价格)
- current_price: decimal (当前价格)
- unrealized_pnl: decimal (未实现盈亏)
- realized_pnl: decimal (已实现盈亏)
- created_at: timestamp
- updated_at: timestamp
```

#### 2.1.3 K线数据表 (klines)
```sql
- id: uuid (主键)
- symbol: text (交易对)
- interval: text (5min/1h/4h/1d/1w)
- open_time: timestamp (开盘时间)
- open: decimal (开盘价)
- high: decimal (最高价)
- low: decimal (最低价)
- close: decimal (收盘价)
- volume: decimal (成交量)
- created_at: timestamp
- updated_at: timestamp
- 唯一索引: (symbol, interval, open_time)
```

#### 2.1.4 交易策略记录表 (trading_strategies)
```sql
- id: uuid (主键)
- user_address: text (用户地址)
- strategy_name: text (策略名称)
- symbol: text (交易对)
- action: text (buy/sell/hold)
- reason: text (决策原因)
- confidence: decimal (置信度 0-1)
- executed: boolean (是否执行)
- created_at: timestamp
```

### 2.2 API 设计

#### 2.2.1 交易接口
- `POST /api/trades` - 创建订单
- `GET /api/trades` - 获取交易列表
- `GET /api/trades/[id]` - 获取单个交易详情
- `DELETE /api/trades/[id]` - 取消订单

#### 2.2.2 持仓接口
- `GET /api/positions` - 获取持仓列表
- `GET /api/positions/[symbol]` - 获取特定交易对持仓

#### 2.2.3 市场数据接口
- `GET /api/market/klines` - 获取K线数据
- `GET /api/market/ticker` - 获取行情数据
- `GET /api/market/symbols` - 获取交易对列表

#### 2.2.4 账户接口
- `GET /api/account/balance` - 获取账户余额
- `GET /api/account/summary` - 获取账户摘要

### 2.3 服务层设计

#### 2.3.1 Hyperliquid 服务 (`src/services/hyperliquid.ts`)
- 封装所有 Hyperliquid API 调用
- 处理认证和签名
- 错误处理和重试机制

#### 2.3.2 交易服务 (`src/lib/trading.ts`)
- 交易逻辑封装
- 订单管理
- 持仓管理

#### 2.3.3 市场数据服务 (`src/lib/market-data.ts`)
- K线数据获取和缓存
- 数据同步逻辑
- 数据计算（技术指标等）

## 三、开发计划

### 阶段一：基础架构搭建 (1-2天)
1. ✅ 创建数据库迁移文件
2. ✅ 创建类型定义
3. ✅ 创建 Hyperliquid 服务封装
4. ✅ 创建基础 API 路由结构

### 阶段二：交易功能实现 (2-3天)
1. ✅ 实现订单创建接口
2. ✅ 实现订单查询接口
3. ✅ 实现订单取消接口
4. ✅ 实现持仓查询接口

### 阶段三：市场数据功能 (2-3天)
1. ✅ 实现 K线数据获取
2. ✅ 实现数据缓存机制
3. ✅ 实现定时同步任务
4. ✅ 实现市场数据 API

### 阶段四：前端界面开发 (3-4天)
1. ✅ 交易页面重构
2. ✅ 图表组件集成
3. ✅ 交易历史列表
4. ✅ 持仓展示组件

### 阶段五：扩展功能 (2-3天)
1. ✅ 账户管理界面
2. ✅ 风险管理功能
3. ✅ 策略记录功能
4. ✅ 监控告警功能

### 阶段六：测试与优化 (1-2天)
1. ✅ 单元测试
2. ✅ 集成测试
3. ✅ 性能优化
4. ✅ 文档完善

## 四、实施步骤

### Step 1: 数据库迁移
创建交易相关的数据库表结构

### Step 2: 类型定义
创建 TypeScript 类型定义

### Step 3: Hyperliquid 服务
封装 Hyperliquid API 调用

### Step 4: 交易服务层
实现交易逻辑封装

### Step 5: API 路由
创建所有 API 路由

### Step 6: 前端组件
开发交易界面和图表

### Step 7: 数据同步
实现定时数据同步

### Step 8: 测试与优化
完善测试和优化性能

