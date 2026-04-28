# Redis Key 文档

本文档记录 TurtleTrace 项目中所有使用的 Redis Key。

## Redis 连接配置

- **Host**: `localhost` (可通过 `REDIS_HOST` 环境变量配置)
- **Port**: `6379` (可通过 `REDIS_PORT` 环境变量配置)
- **Password**: 可通过 `REDIS_PASSWORD` 环境变量配置
- **Database**: `0` (可通过 `REDIS_DB` 环境变量配置)

## Key 列表

| Key | 类型 | 数据结构 | 说明 | 使用服务/模块 |
|-----|------|----------|------|---------------|
| `turtletrace:auth:api_key` | String | 字符串 | API 认证密钥 | `backend/middleware/auth.ts`, `backend/index.ts` |
| `turtletrace:accounts` | String | JSON | 账户数据，包含多账户信息 | `backend/services/accountService.ts` |
| `turtletrace:positions` | String | JSON | 持仓数据，包含所有持仓记录 | `backend/services/positionService.ts` |
| `turtletrace:reviews:daily` | String | JSON | 每日复盘记录 | `backend/services/reviewService.ts` |
| `turtletrace:reviews:weekly` | String | JSON | 每周复盘记录 | `backend/routes/weeklyReviews.ts` |
| `turtletrace:events` | String | JSON | 事件记录 | `backend/services/eventService.ts` |
| `turtletrace:ai:config` | String | JSON | AI 配置信息 | `backend/routes/ai.ts` |
| `turtletrace:display_indices` | String | JSON | 显示指数配置 | `backend/routes/settings.ts` |
| `turtletrace:welcome_completed` | String | 字符串 ("true"/"false") | 欢迎向导完成状态 | `backend/routes/settings.ts` |
| `turtletrace:tags:emotions` | String | JSON | 情绪标签列表 | `backend/routes/tags.ts` |
| `turtletrace:tags:reasons` | String | JSON | 原因标签列表 | `backend/routes/tags.ts` |
| `turtletrace:tcalc:fee_config` | String | JSON | 做T手续费配置 | `backend/services/tcalcService.ts` |
| `turtletrace:tcalc:history` | String | JSON | 做T历史记录 | `backend/services/tcalcService.ts` |
| `turtletrace:tcalc:last_input` | String | JSON | 做T上次输入状态 | `backend/services/tcalcService.ts` |

## 按功能分组

### 认证 (Auth)
- `turtletrace:auth:api_key` - 存储 API 认证密钥

### 账户与持仓 (Account & Position)
- `turtletrace:accounts` - 账户信息
- `turtletrace:positions` - 持仓信息

### 复盘 (Reviews)
- `turtletrace:reviews:daily` - 每日复盘
- `turtletrace:reviews:weekly` - 每周复盘

### 事件 (Events)
- `turtletrace:events` - 事件记录

### AI 配置
- `turtletrace:ai:config` - AI 功能配置

### 显示设置 (Display Settings)
- `turtletrace:display_indices` - 显示指数配置
- `turtletrace:welcome_completed` - 欢迎向导完成状态

### 标签 (Tags)
- `turtletrace:tags:emotions` - 情绪标签
- `turtletrace:tags:reasons` - 原因标签

### 做T计算器 (T-Calc)
- `turtletrace:tcalc:fee_config` - 手续费配置
- `turtletrace:tcalc:history` - 操作历史
- `turtletrace:tcalc:last_input` - 上次输入

## 数据类型说明

所有 Key 的类型均为 **String**，存储序列化后的 JSON 数据或字符串值。

在代码中使用时，数据通常以以下方式处理：
```typescript
// 读取
const data = await redis.get(KEY);
const parsed = JSON.parse(data);

// 写入
await redis.set(KEY, JSON.stringify(data));
```
