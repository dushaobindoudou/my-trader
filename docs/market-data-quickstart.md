# 市场数据 API 快速开始指南

## 快速开始

### 1. 获取 API Key

#### CoinMarketCap（必需）
1. 访问 https://coinmarketcap.com/api/
2. 注册并获取免费 API Key
3. 免费账户：每月 10,000 次请求，每分钟 30 次

#### CoinGecko（可选）
- CoinGecko 免费版不需要 API Key
- 但建议注册以获取更高限额：https://www.coingecko.com/api/pricing

### 2. 配置环境变量

在项目根目录的 `.env` 文件中添加：

```bash
# CoinMarketCap API Key（必需）
COINMARKETCAP_API_KEY=your_api_key_here

# 定时任务密钥（可选，但建议设置）
CRON_SECRET=your_random_secret_here
```

### 3. 运行数据库迁移

```bash
# 如果使用 Supabase CLI
supabase db push

# 或者手动执行 SQL
# 文件位置：supabase/migrations/20240106000000_add_market_data.sql
```

### 4. 手动同步数据（测试）

```bash
# 同步前 100 条数据
curl -X GET "http://localhost:3000/api/cron/sync-market-data?limit=100" \
  -H "Authorization: Bearer your_cron_secret_here"
```

### 5. 查询数据

```bash
# 获取前 100 条市场数据
curl -X GET "http://localhost:3000/api/market/data?limit=100"

# 获取 BTC 数据
curl -X GET "http://localhost:3000/api/market/data?symbol=BTC"

# 获取市值前 10 的币种
curl -X GET "http://localhost:3000/api/market/data?limit=10&order_by=market_cap_usd&order_direction=desc"
```

## 设置定时任务（每天自动更新）

### 方法 1: Vercel Cron Jobs（推荐）

在项目根目录创建或更新 `vercel.json`：

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

这将在每天 UTC 0:00 自动同步数据。

### 方法 2: 外部 Cron 服务

使用 [cron-job.org](https://cron-job.org/) 或其他服务：

- **URL**: `https://your-domain.com/api/cron/sync-market-data?limit=100`
- **Method**: GET
- **Headers**: `Authorization: Bearer your_cron_secret_here`
- **Schedule**: `0 0 * * *` (每天 UTC 0:00)

## API 端点

### 同步市场数据
```
GET /api/cron/sync-market-data
```

**查询参数**:
- `limit` (可选): 每个数据源获取的数量，默认 100

**Headers**:
- `Authorization: Bearer {CRON_SECRET}` (可选，但建议设置)

**响应示例**:
```json
{
  "success": true,
  "timestamp": "2024-01-06T00:00:00.000Z",
  "results": {
    "coinmarketcap": {
      "success": true,
      "count": 100,
      "errors": []
    },
    "coingecko": {
      "success": true,
      "count": 100,
      "errors": []
    }
  },
  "summary": {
    "totalCount": 200,
    "totalErrors": 0,
    "errors": []
  }
}
```

### 查询市场数据
```
GET /api/market/data
```

**查询参数**:
- `symbol` (可选): 币种符号，如 `BTC`, `ETH`
- `source` (可选): 数据来源，`coinmarketcap` 或 `coingecko`
- `limit` (可选): 返回数量，默认 100
- `offset` (可选): 偏移量，默认 0
- `order_by` (可选): 排序字段，`rank`, `market_cap_usd`, `price_usd`, `volume_24h_usd`, `updated_at`
- `order_direction` (可选): 排序方向，`asc` 或 `desc`，默认 `asc`

**响应示例**:
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
      "data": { /* 原始 API 数据 */ },
      "updated_at": "2024-01-06T00:00:00Z",
      "created_at": "2024-01-06T00:00:00Z"
    }
  ],
  "count": 100,
  "limit": 100,
  "offset": 0
}
```

## 数据字段说明

| 字段 | 说明 |
|------|------|
| `symbol` | 币种符号（如 BTC, ETH） |
| `name` | 币种名称 |
| `source` | 数据来源（coinmarketcap, coingecko） |
| `price_usd` | 当前价格（USD） |
| `market_cap_usd` | 市值（USD） |
| `volume_24h_usd` | 24小时交易量（USD） |
| `price_change_24h` | 24小时价格变化（USD） |
| `price_change_percent_24h` | 24小时价格变化百分比 |
| `rank` | 市值排名 |
| `circulating_supply` | 流通供应量 |
| `total_supply` | 总供应量 |
| `max_supply` | 最大供应量 |
| `data` | 原始 API 响应的完整 JSON 数据 |

## 注意事项

1. **API 限制**：
   - 每天同步一次即可，避免超出免费限额
   - CoinMarketCap：每分钟 30 次，每月 10,000 次
   - CoinGecko：每分钟 30 次，每月 10,000 次

2. **数据存储**：
   - 数据存储在数据库中，查询时不需要调用外部 API
   - 每个币种每个数据源只有一条记录（通过 upsert 更新）

3. **安全性**：
   - 定时任务 API 建议设置 `CRON_SECRET` 进行保护
   - 查询 API 需要用户认证

4. **错误处理**：
   - 如果某个数据源失败，不会影响其他数据源
   - 错误信息会在响应中返回

## 故障排查

### 问题：同步失败，提示 "COINMARKETCAP_API_KEY not configured"
**解决**：检查 `.env` 文件中是否设置了 `COINMARKETCAP_API_KEY`

### 问题：API 返回 401 错误
**解决**：检查 API Key 是否正确，是否已激活

### 问题：数据库表不存在
**解决**：运行数据库迁移 `supabase db push`

### 问题：定时任务不执行
**解决**：
- 检查 Vercel Cron Jobs 配置
- 检查外部 Cron 服务的配置
- 查看服务器日志

## 更多信息

详细文档请参考：[market-data-api.md](./market-data-api.md)

