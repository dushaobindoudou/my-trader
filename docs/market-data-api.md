# 市场数据 API 集成文档

本文档说明如何使用 CoinMarketCap 和 CoinGecko 免费 API 获取市场数据。

## 已集成的数据源

### 1. CoinMarketCap API
- **免费账户限制**：每月 10,000 次请求，每分钟 30 次
- **注册地址**：https://coinmarketcap.com/api/
- **需要 API Key**：是
- **数据更新频率**：1-5 分钟

### 2. CoinGecko API
- **免费账户限制**：每月 10,000 次请求，每分钟 30 次
- **注册地址**：https://www.coingecko.com/api/pricing
- **需要 API Key**：否（但建议注册以获取更高限额）
- **数据更新频率**：实时

## 配置步骤

### 1. 获取 API Key

#### CoinMarketCap
1. 访问 https://coinmarketcap.com/api/
2. 注册账户并登录
3. 在 Dashboard 中创建 API Key
4. 复制 API Key

#### CoinGecko（可选）
1. 访问 https://www.coingecko.com/api/pricing
2. 注册账户（可选，免费版不需要 API Key）
3. 如果需要更高限额，可以获取 API Key

### 2. 配置环境变量

在 `.env` 文件中添加：

```bash
# CoinMarketCap API Key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# 定时任务密钥（可选，但建议设置）
CRON_SECRET=your_cron_secret_here
```

### 3. 运行数据库迁移

```bash
# 如果使用 Supabase CLI
supabase db push

# 或者直接执行 SQL
# 迁移文件：supabase/migrations/20240106000000_add_market_data.sql
```

## API 使用

### 1. 同步市场数据

#### 手动同步
```bash
# 同步所有数据源（默认 100 条）
curl -X GET "http://localhost:3000/api/cron/sync-market-data?limit=100" \
  -H "Authorization: Bearer your_cron_secret_here"

# 同步更多数据
curl -X GET "http://localhost:3000/api/cron/sync-market-data?limit=500" \
  -H "Authorization: Bearer your_cron_secret_here"
```

#### 定时任务配置

##### 使用 Vercel Cron Jobs（推荐）
在 `vercel.json` 中添加：

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-market-data?limit=100",
      "schedule": "0 0 * * *"
    }
  ]
}
```

##### 使用外部 Cron 服务
可以使用以下服务设置每天自动调用：
- [cron-job.org](https://cron-job.org/)
- [EasyCron](https://www.easycron.com/)
- [Cronitor](https://cronitor.io/)

配置示例（每天 UTC 0:00 执行）：
```
URL: https://your-domain.com/api/cron/sync-market-data?limit=100
Method: GET
Headers: Authorization: Bearer your_cron_secret_here
Schedule: 0 0 * * *
```

### 2. 查询市场数据

#### 获取所有市场数据
```bash
GET /api/market/data
```

#### 查询参数
- `symbol` (可选): 币种符号，如 `BTC`, `ETH`
- `source` (可选): 数据来源，`coinmarketcap` 或 `coingecko`
- `limit` (可选): 返回数量，默认 100
- `offset` (可选): 偏移量，默认 0
- `order_by` (可选): 排序字段，`rank`, `market_cap_usd`, `price_usd`, `volume_24h_usd`, `updated_at`
- `order_direction` (可选): 排序方向，`asc` 或 `desc`，默认 `asc`

#### 示例请求

```bash
# 获取前 100 条数据（按市值排名）
curl -X GET "http://localhost:3000/api/market/data?limit=100&order_by=rank&order_direction=asc"

# 获取 BTC 的数据
curl -X GET "http://localhost:3000/api/market/data?symbol=BTC"

# 获取 CoinMarketCap 的数据
curl -X GET "http://localhost:3000/api/market/data?source=coinmarketcap"

# 获取市值前 10 的币种
curl -X GET "http://localhost:3000/api/market/data?limit=10&order_by=market_cap_usd&order_direction=desc"
```

#### 响应格式

```json
{
  "data": [
    {
      "id": "uuid",
      "symbol": "BTC",
      "name": "Bitcoin",
      "source": "coinmarketcap",
      "price_usd": 43250.50,
      "market_cap_usd": 850000000000,
      "volume_24h_usd": 25000000000,
      "price_change_24h": 1250.50,
      "price_change_percent_24h": 2.98,
      "rank": 1,
      "circulating_supply": 19650000,
      "total_supply": 19650000,
      "max_supply": 21000000,
      "data": { /* 原始 API 响应数据 */ },
      "updated_at": "2024-01-06T00:00:00Z",
      "created_at": "2024-01-06T00:00:00Z"
    }
  ],
  "count": 100,
  "limit": 100,
  "offset": 0
}
```

## 数据库结构

### market_data 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| symbol | VARCHAR(50) | 币种符号（如 BTC, ETH） |
| name | VARCHAR(200) | 币种名称 |
| source | VARCHAR(50) | 数据来源（coinmarketcap, coingecko） |
| price_usd | DECIMAL(20, 8) | 当前价格（USD） |
| market_cap_usd | DECIMAL(30, 2) | 市值（USD） |
| volume_24h_usd | DECIMAL(30, 2) | 24小时交易量（USD） |
| price_change_24h | DECIMAL(10, 4) | 24小时价格变化（USD） |
| price_change_percent_24h | DECIMAL(10, 4) | 24小时价格变化百分比 |
| rank | INTEGER | 市值排名 |
| circulating_supply | DECIMAL(30, 2) | 流通供应量 |
| total_supply | DECIMAL(30, 2) | 总供应量 |
| max_supply | DECIMAL(30, 2) | 最大供应量 |
| data | JSONB | 原始 API 响应的完整数据 |
| updated_at | TIMESTAMP | 更新时间 |
| created_at | TIMESTAMP | 创建时间 |

**唯一约束**：`(symbol, source)` - 每个数据源每个币种只有一条记录

## 代码结构

```
src/
├── services/
│   ├── coinmarketcap.ts    # CoinMarketCap API 服务
│   └── coingecko.ts         # CoinGecko API 服务
├── lib/
│   └── market-data-sync.ts  # 市场数据同步服务
└── app/
    └── api/
        ├── cron/
        │   └── sync-market-data/
        │       └── route.ts  # 定时同步 API
        └── market/
            └── data/
                └── route.ts  # 市场数据查询 API
```

## 注意事项

1. **API 限制**：
   - CoinMarketCap：每分钟 30 次请求，每月 10,000 次
   - CoinGecko：每分钟 30 次请求，每月 10,000 次
   - 建议每天同步一次，避免超出限制

2. **数据更新**：
   - 数据通过定时任务每天更新一次
   - 可以手动调用同步 API 更新数据
   - 数据存储在数据库中，查询时不需要调用外部 API

3. **安全性**：
   - 定时任务 API 建议设置 `CRON_SECRET` 进行保护
   - 查询 API 需要用户认证

4. **错误处理**：
   - 如果某个数据源失败，不会影响其他数据源
   - 错误信息会在响应中返回

## 扩展其他数据源

如果需要添加其他数据源（如 CryptoCompare），可以：

1. 在 `src/services/` 中创建新的服务文件
2. 在 `src/lib/market-data-sync.ts` 中添加同步函数
3. 在 `syncAllMarketData` 中调用新函数
4. 更新数据库迁移文件，确保 `source` 字段支持新数据源

