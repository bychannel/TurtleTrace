# TurtleTrace 后端重构方案

> 本文档描述将 TurtleTrace 从 localStorage 持久化迁移到 Express.js + Redis 架构的设计方案。

## 背景与目标

当前项目使用 localStorage 做数据持久化，单用户个人工具。本次重构目标：
- 增加 Express.js 后端服务
- 将数据存储迁移到 Redis
- 保留 React 前端（Vite proxy 配置）

## 技术栈

- **后端**: Express.js + TypeScript + ioredis + dotenv
- **数据存储**: Redis（本地安装，所有数据存为 JSON 字符串）
- **认证**: 简化方案，API Key 存于前端 localStorage（`turtletrace_api_key`）
- **前端**: React 19 + Vite

---

## 1. 项目结构

```
turtletrace/
├── src/                          # 前端（现有）
├── server/                       # 新增：Express 后端
│   ├── index.ts                  # 服务入口
│   ├── routes/                   # 路由
│   │   ├── accounts.ts           # 账户路由
│   │   ├── positions.ts          # 持仓路由
│   │   ├── reviews.ts            # 日复盘路由
│   │   ├── weeklyReviews.ts      # 周复盘路由
│   │   ├── events.ts             # 事件日历路由
│   │   ├── tcalc.ts              # 做T计算器路由
│   │   ├── ai.ts                 # AI配置路由
│   │   └── settings.ts           # 设置路由
│   ├── services/                 # 后端业务逻辑层
│   │   ├── redis.ts              # Redis 客户端连接
│   │   ├── accountService.ts     # 账户业务逻辑
│   │   ├── positionService.ts    # 持仓业务逻辑
│   │   ├── reviewService.ts      # 日复盘业务逻辑
│   │   ├── eventService.ts       # 事件业务逻辑
│   │   └── tcalcService.ts       # 做T计算器逻辑
│   ├── middleware/               # Express 中间件
│   │   ├── auth.ts               # API Key 认证
│   │   └── cors.ts               # CORS 配置
│   └── types/                    # 共享类型（从 frontend 复制）
│       └── index.ts
├── package.json                  # 添加后端依赖
└── vite.config.ts                # 添加 proxy 配置
```

**后端端口**: `3001`（可通过 `PORT` 环境变量配置）

---

## 2. Redis Key 设计

格式: `turtletrace:{entity}:{subentity}`

| Redis Key | 数据类型 | 说明 |
|---|---|---|
| `turtletrace:accounts` | JSON String | AccountsStorage（version, accounts[], defaultAccountId, lastActiveAccountId） |
| `turtletrace:positions` | JSON String | Position[] 所有持仓 |
| `turtletrace:reviews:daily` | JSON String | DailyReview[] |
| `turtletrace:reviews:weekly` | JSON String | WeeklyReview[] |
| `turtletrace:events` | JSON String | MarketEvent[] |
| `turtletrace:tcalc:fee_config` | JSON String | FeeConfig |
| `turtletrace:tcalc:history` | JSON String | TCalcRecord[] |
| `turtletrace:tcalc:last_input` | JSON String | TCalcInput |
| `turtletrace:ai:config` | JSON String | { endpoint, apiKey } |
| `turtletrace:tags:emotions` | JSON String | EmotionTag[] |
| `turtletrace:tags:reasons` | JSON String | ReasonTag[] |
| `turtletrace:display_indices` | JSON String | string[] |
| `turtletrace:welcome_completed` | String | "true"/"false" |
| `turtletrace:auth:api_key` | String | 当前有效的 API Key |
| `turtletrace:meta:version` | String | 迁移版本号 |

---

## 3. API 设计

基础路径: `/api/v1`

### 认证
- Header: `X-API-Key: <api_key>`
- 后端中间件验证 every request
- API Key 存于环境变量 `API_KEY`，首次启动时生成并写入项目根目录 `.api-key` 文件
- 前端启动时自动读取 `.api-key` 文件内容，存入 localStorage（后续请求自动带 Header）
- `.api-key` 文件需手动加入 `.gitignore`（实现步骤中追加）

### 端点一览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /health | 健康检查 |
| GET | /accounts | 获取所有账户 + defaultAccountId + lastActiveAccountId |
| POST | /accounts | 创建账户 |
| PUT | /accounts/:id | 更新账户 |
| DELETE | /accounts/:id | 删除账户 |
| GET | /accounts/:id/stats | 获取账户统计 |
| GET | /positions | 获取持仓列表，?accountId= 可选 |
| POST | /positions | 添加持仓 |
| PUT | /positions/:id | 更新持仓 |
| DELETE | /positions/:id | 删除持仓 |
| GET | /reviews/daily | 获取日复盘列表，?startDate & endDate 可选 |
| GET | /reviews/daily/:date | 获取单条日复盘 |
| POST | /reviews/daily | 创建/保存日复盘 |
| DELETE | /reviews/daily/:date | 删除日复盘 |
| GET | /reviews/weekly | 获取周复盘列表，?year 可选 |
| GET | /reviews/weekly/:weekLabel | 获取单条周复盘 |
| POST | /reviews/weekly | 创建/保存周复盘 |
| DELETE | /reviews/weekly/:weekLabel | 删除周复盘 |
| GET | /events | 获取事件，?startDate & endDate & eventType & importance & status & tags & search |
| GET | /events/:id | 获取单个事件 |
| POST | /events | 创建事件 |
| PUT | /events/:id | 更新事件 |
| DELETE | /events/:id | 删除事件 |
| GET | /events/upcoming/:days | 获取接下来N天的事件 |
| GET | /tcalc/config | 获取费率配置 |
| PUT | /tcalc/config | 保存费率配置 |
| GET | /tcalc/history | 获取做T历史 |
| POST | /tcalc/history | 添加历史记录 |
| DELETE | /tcalc/history/:id | 删除单条记录 |
| DELETE | /tcalc/history | 清空历史 |
| GET | /tcalc/last-input | 获取上次输入 |
| POST | /tcalc/last-input | 保存上次输入 |
| GET | /ai/config | 获取AI配置 |
| PUT | /ai/config | 保存AI配置 |
| GET | /settings/display-indices | 获取显示指数 |
| PUT | /settings/display-indices | 保存显示指数 |
| GET | /settings/welcome | 获取welcome状态 |
| PUT | /settings/welcome | 设置welcome状态 |

---

## 4. 前端服务层重构

### 策略

完全移除 localStorage 逻辑，各 service 直接调用后端 REST API。

**关键文件改动:**

| 文件 | 改动 |
|---|---|
| `src/services/accountService.ts` | 改为调用 HTTP API |
| `src/services/reviewService.ts` | 改为调用 HTTP API |
| `src/services/weeklyReviewService.ts` | 改为调用 HTTP API |
| `src/services/eventService.ts` | 改为调用 HTTP API |
| `src/services/tagService.ts` | `getEmotionTags()` / `getReasonTags()` / `saveEmotionTags()` / `saveReasonTags()` 改为 HTTP API |
| `src/services/tCalculatorService.ts` | 改为调用 HTTP API |
| `src/services/aiService.ts` | `getAiConfig()` 改为 HTTP GET，其余不变 |
| `src/App.tsx` | 启动时调用 `initApiKey()` 初始化 API Key |
| `src/lib/apiClient.ts` | 新增，统一 HTTP 请求入口 |

### API Client (`src/lib/apiClient.ts`)

```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const apiKey = localStorage.getItem('turtletrace_api_key');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
      ...options?.headers,
    },
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

// 初始化 API Key：优先读 localStorage，未读到此 Key 则尝试读 .api-key 文件
async function initApiKey() {
  let key = localStorage.getItem('turtletrace_api_key');
  if (!key) {
    try {
      const res = await fetch('/api-key');
      if (res.ok) {
        key = await res.text();
        localStorage.setItem('turtletrace_api_key', key.trim());
      }
    } catch {
      // 后端未启动或 .api-key 不存在，忽略
    }
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
```

> 后端 `server/index.ts` 需额外配置静态文件serve：`.api-key` 文件通过 `express.static` 对外暴露为 `/api-key` 路径（如 `app.use(express.static('.', { dotfiles: 'allow' }))`），前端可通过 `/api-key` 读取内容。

---

## 5. 配置变更

### package.json 新增 scripts

```json
{
  "scripts": {
    "dev:server": "tsx server/index.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:server\"",
    "server": "tsx server/index.ts"
  }
}
```

### 新增依赖

```
express, cors, ioredis, dotenv, concurrently
```

### vite.config.ts 添加 proxy

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

### 环境变量

**.env (后端)**
```
PORT=3001
REDIS_URL=redis://localhost:6379
API_KEY=         # 不填则自动生成
CORS_ORIGIN=http://localhost:5173
```

**.env (前端)**
```
VITE_API_BASE_URL=/api/v1
```

---

## 6. 数据迁移

### localStorage → Redis 映射

| localStorage Key | Redis Key |
|---|---|
| `stock-positions` | `turtletrace:positions` |
| `turtletrace_accounts` | `turtletrace:accounts` |
| `stock_app_reviews` | `turtletrace:reviews:daily` |
| `stock_app_weekly_reviews` | `turtletrace:reviews:weekly` |
| `turtletrace_events` | `turtletrace:events` |
| `t-calculator-fee-config` | `turtletrace:tcalc:fee_config` |
| `t-calculator-history` | `turtletrace:tcalc:history` |
| `t-calculator-last-input` | `turtletrace:tcalc:last_input` |
| `ai-endpoint` + `ai-api-key` | `turtletrace:ai:config` |
| `stock_app_display_indices` | `turtletrace:display_indices` |
| `welcome_completed` | `turtletrace:welcome_completed` |

### 迁移步骤

1. 前端"设置"页面增加"导出本地数据"按钮，导出 localStorage JSON
2. 用户启动后端，执行 `npm run migrate -- --file=export.json`
3. 数据按依赖顺序写入 Redis（accounts → positions → reviews → events）
4. 前端 `.env` 配置 `VITE_API_BASE_URL=/api/v1`，服务层已改为 API 调用

---

## 7. 不需要改动的模块

- `stockService.ts` — EastMoney API 调用，无 localStorage 依赖
- `batchService.ts` — 纯业务逻辑（计算 FIFO 等），无 localStorage 依赖
- `src/components/dashboard/` — UI 组件不直接访问 localStorage，通过 service 层

---

## 8. 实施顺序

### Phase 1: 后端骨架

#### Step 1.1 安装依赖 ✅
```bash
npm install express cors ioredis dotenv concurrently
npm install -D @types/express @types/cors tsx
```
> 状态：已完成（2026-04-27）

#### Step 1.2 创建目录结构 ✅
> 状态：已完成（2026-04-27）
```
server/
├── index.ts
├── routes/
│   ├── accounts.ts
│   ├── positions.ts
│   ├── reviews.ts
│   ├── weeklyReviews.ts
│   ├── events.ts
│   ├── tcalc.ts
│   ├── ai.ts
│   └── settings.ts
├── services/
│   ├── redis.ts
│   ├── accountService.ts
│   ├── positionService.ts
│   ├── reviewService.ts
│   ├── eventService.ts
│   └── tcalcService.ts
├── middleware/
│   ├── auth.ts
│   └── cors.ts
└── types/
    └── index.ts
```

#### Step 1.3 创建 `server/services/redis.ts` — Redis 客户端 ✅
> 状态：已完成（2026-04-27）
```typescript
import Redis from 'ioredis';
import 'dotenv/config';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redis.on('error', (err) => console.error('Redis error:', err));

export default redis;
```

#### Step 1.4 创建 `server/middleware/cors.ts` ✅
> 状态：已完成（2026-04-27）
```typescript
import cors from 'cors';
import 'dotenv/config';

export default cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
});
```

#### Step 1.5 创建 `server/middleware/auth.ts` — API Key 验证 ✅
> 状态：已完成（2026-04-27）
```typescript
import { Request, Response, NextFunction } from 'express';
import redis from '../services/redis';

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] as string;
  if (!key) return res.status(401).json({ error: 'Missing API Key' });

  try {
    const validKey = await redis.get('turtletrace:auth:api_key');
    if (!validKey || key !== validKey) return res.status(401).json({ error: 'Invalid API Key' });
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### Step 1.6 创建 `server/types/index.ts` — 从前端复制共享类型 ✅
> 状态：已完成（2026-04-27）
从 `src/types/index.ts`、`src/types/account.ts`、`src/types/review.ts`、`src/types/weeklyReview.ts` 复制所有 interface 到此文件，确保后端类型与前端一致。

#### Step 1.7 创建 `server/services/accountService.ts` — 账户业务逻辑 ✅
> 状态：已完成（2026-04-27）
```typescript
import redis from './redis';
import { Account, AccountsStorage } from '../types';

const ACCOUNTS_KEY = 'turtletrace:accounts';

export async function getAccountsStorage(): Promise<AccountsStorage> {
  const data = await redis.get(ACCOUNTS_KEY);
  if (data) return JSON.parse(data);
  return { version: 1, accounts: [], defaultAccountId: '', lastActiveAccountId: '' };
}

export async function saveAccountsStorage(storage: AccountsStorage) {
  await redis.set(ACCOUNTS_KEY, JSON.stringify(storage));
}

export async function getAccounts(): Promise<Account[]> {
  return (await getAccountsStorage()).accounts;
}

export async function createAccount(input: CreateAccountInput): Promise<Account> { ... }
export async function updateAccount(id: string, input: UpdateAccountInput): Promise<Account> { ... }
export async function deleteAccount(id: string): Promise<void> { ... }
```

#### Step 1.8 创建 `server/services/positionService.ts` — 持仓业务逻辑 ✅
> 状态：已完成（2026-04-27） ✅
> 状态：已完成（2026-04-27）
```typescript
import redis from './redis';
import { Position } from '../types';

const POSITIONS_KEY = 'turtletrace:positions';

export async function getPositions(): Promise<Position[]> {
  const data = await redis.get(POSITIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function savePositions(positions: Position[]): Promise<void> {
  await redis.set(POSITIONS_KEY, JSON.stringify(positions));
}

export async function createPosition(position: Position): Promise<Position> { ... }
export async function updatePosition(id: string, updates: Partial<Position>): Promise<Position> { ... }
export async function deletePosition(id: string): Promise<void> { ... }
```

类似实现 `reviewService.ts`、`eventService.ts`、`tcalcService.ts`，分别对应 `turtletrace:reviews:daily`、`turtletrace:events`、`turtletrace:tcalc:*` 等 Redis key。

#### Step 1.9 创建 `server/routes/accounts.ts` ✅
> 状态：已完成（2026-04-27）
```typescript
import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import * as accountService from '../services/accountService';

const router = Router();
router.use(apiKeyAuth);

router.get('/', async (req, res) => {
  res.json(await accountService.getAccountsStorage());
});

router.post('/', async (req, res) => {
  const account = await accountService.createAccount(req.body);
  res.json(account);
});

router.put('/:id', async (req, res) => {
  res.json(await accountService.updateAccount(req.params.id, req.body));
});

router.delete('/:id', async (req, res) => {
  await accountService.deleteAccount(req.params.id);
  res.json({ success: true });
});

export default router;
```

按相同模式创建：`routes/positions.ts`、`routes/reviews.ts`、`routes/weeklyReviews.ts`、`routes/events.ts`、`routes/tcalc.ts`、`routes/ai.ts`、`routes/settings.ts`。

#### Step 1.10 创建 `server/index.ts` — 服务入口 ✅
> 状态：已完成（2026-04-27）
```typescript
import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import cors from './middleware/cors';
import redis from './services/redis';
import accountsRouter from './routes/accounts';
import positionsRouter from './routes/positions';
// ... 其他路由 import

const app = express();
app.use(cors());
app.use(express.json());

// API Key 初始化
async function initApiKey() {
  const envKey = process.env.API_KEY;
  if (envKey) {
    await redis.set('turtletrace:auth:api_key', envKey);
    console.log('Using API_KEY from environment');
  } else {
    let key = await redis.get('turtletrace:auth:api_key');
    if (!key) {
      key = crypto.randomUUID();
      await redis.set('turtletrace:auth:api_key', key);
      await require('fs').promises.writeFile('.api-key', key);
      console.log('Generated new API Key:', key);
    }
  }
}

// 静态文件 serve .api-key（仅暴露此文件，不暴露整个目录）
app.use('/api-key', (req, res) => {
  res.sendFile('.api-key', { root: process.cwd() });
});

// 路由注册
app.use('/api/v1/accounts', accountsRouter);
app.use('/api/v1/positions', positionsRouter);
// ... 其他路由

app.get('/health', (req, res) => res.json({ status: 'ok' }));

initApiKey().then(() => {
  app.listen(process.env.PORT || 3001, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 3001}`);
  });
});
```

#### Step 1.11 更新 `.gitignore` 追加 `.api-key` ✅
> 状态：已完成（2026-04-27）

#### Step 1.12 更新 `package.json` scripts ✅
> 状态：已完成（2026-04-27）
```json
{
  "scripts": {
    "dev:server": "tsx server/index.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:server\"",
    "server": "tsx server/index.ts"
  }
}
```

---

### Phase 2: 前端适配

#### Step 2.1 更新 `vite.config.ts` 添加 proxy ✅
> 状态：已完成（2026-04-27）
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

#### Step 2.2 创建 `src/lib/apiClient.ts` ✅
> 状态：已完成（2026-04-27）
```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const apiKey = localStorage.getItem('turtletrace_api_key');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
      ...options?.headers,
    },
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

// 初始化 API Key：优先读 localStorage，未读到此 Key 则尝试读 .api-key 文件
async function initApiKey() {
  let key = localStorage.getItem('turtletrace_api_key');
  if (!key) {
    try {
      const res = await fetch('/api-key');
      if (res.ok) {
        key = await res.text();
        localStorage.setItem('turtletrace_api_key', key.trim());
      }
    } catch {
      // 后端未启动或 .api-key 不存在，忽略
    }
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { initApiKey };
```

#### Step 2.3 重构 `src/services/accountService.ts` ✅
> 状态：已完成（2026-04-27）
将所有 `localStorage.getItem/setItem` 替换为 `api.get/post/put/delete` 调用：
- `getAccounts()` → `api.get('/accounts')`
- `createAccount(input)` → `api.post('/accounts', input)`
- `updateAccount(id, input)` → `api.put('/accounts/' + id, input)`
- `deleteAccount(id)` → `api.delete('/accounts/' + id)`
- `getPositions(accountId?)` → `api.get('/positions' + (accountId ? '?accountId=' + accountId : ''))`
- `addPositionToAccount(accountId, position)` → `api.post('/positions', { ...position, accountId })`
- `updatePosition(position)` → `api.put('/positions/' + position.id, position)`
- `deletePosition(positionId)` → `api.delete('/positions/' + positionId)`

#### Step 2.4 重构 `src/services/reviewService.ts` ✅
> 状态：已完成（2026-04-27）
- `getAllReviews()` → `api.get('/reviews/daily')`
- `getReview(date)` → `api.get('/reviews/daily/' + date)`
- `saveReview(review)` → `api.post('/reviews/daily', review)`
- `deleteReview(date)` → `api.delete('/reviews/daily/' + date)`

#### Step 2.5 重构 `src/services/weeklyReviewService.ts`
- `getAllReviews()` → `api.get('/reviews/weekly')`
- `getReview(weekLabel)` → `api.get('/reviews/weekly/' + weekLabel)`
- `saveReview(review)` → `api.post('/reviews/weekly', review)`
- `deleteReview(weekLabel)` → `api.delete('/reviews/weekly/' + weekLabel)`

#### Step 2.6 重构 `src/services/tCalculatorService.ts`
- `getFeeConfig()` → `api.get('/tcalc/config')`
- `saveFeeConfig(config)` → `api.put('/tcalc/config', config)`
- `getHistory()` → `api.get('/tcalc/history')`
- `addHistoryRecord(record)` → `api.post('/tcalc/history', record)`
- `deleteHistoryRecord(id)` → `api.delete('/tcalc/history/' + id)`
- `clearHistory()` → `api.delete('/tcalc/history')`
- `getLastInput()` → `api.get('/tcalc/last-input')`
- `saveLastInput(input)` → `api.post('/tcalc/last-input', input)`

#### Step 2.7 重构 `src/services/eventService.ts`
- `getAllEvents()` → `api.get('/events')`
- `getEvent(id)` → `api.get('/events/' + id)`
- `saveEvent(event)` → `event.id ? api.put('/events/' + event.id, event) : api.post('/events', event)`
- `deleteEvent(id)` → `api.delete('/events/' + id)`

#### Step 2.8 重构 `src/services/tagService.ts`
- `getEmotionTags()` → `api.get('/tags/emotions')`
- `saveEmotionTags(tags)` → `api.put('/tags/emotions', tags)`
- `getReasonTags()` → `api.get('/tags/reasons')`
- `saveReasonTags(tags)` → `api.put('/tags/reasons', tags)`

#### Step 2.9 重构 `src/services/aiService.ts`
`getAiConfig()` 从 localStorage 读取改为 `api.get('/ai/config')`，其余不变（外部 AI 调用不经过后端）。

#### Step 2.10 修改 `src/App.tsx` 调用 `initApiKey`

在 App 组件初始化时调用 `initApiKey()`，确保 API Key 在首次请求前已完成初始化：
```typescript
import { initApiKey } from './lib/apiClient';

// 在 useEffect 或组件顶部调用
useEffect(() => {
  initApiKey();
}, []);
```

#### Step 2.12 更新 `.env` 添加
```
VITE_API_BASE_URL=/api/v1
```

---

### Phase 3: 迁移 & 收尾

#### Step 3.1 创建迁移脚本 `server/scripts/migrate.ts`
```typescript
import 'dotenv/config';
import redis from '../services/redis';
import * as fs from 'fs';

async function migrate(filePath: string) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // 按依赖顺序迁移
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // 按依赖顺序迁移
  await redis.set('turtletrace:accounts', JSON.stringify(data.turtletrace_accounts || data['turtletrace:accounts']));
  await redis.set('turtletrace:positions', JSON.stringify(data['stock-positions'] || []));
  await redis.set('turtletrace:reviews:daily', JSON.stringify(data['stock_app_reviews'] || []));
  await redis.set('turtletrace:reviews:weekly', JSON.stringify(data['stock_app_weekly_reviews'] || []));
  await redis.set('turtletrace:events', JSON.stringify(data['turtletrace_events'] || []));

  const tcalc = {
    feeConfig: data['t-calculator-fee-config'],
    history: data['t-calculator-history'],
    lastInput: data['t-calculator-last-input'],
  };
  if (tcalc.feeConfig) await redis.set('turtletrace:tcalc:fee_config', JSON.stringify(tcalc.feeConfig));
  if (tcalc.history) await redis.set('turtletrace:tcalc:history', JSON.stringify(tcalc.history));
  if (tcalc.lastInput) await redis.set('turtletrace:tcalc:last_input', JSON.stringify(tcalc.lastInput));

  const aiConfig = { endpoint: data['ai-endpoint'], apiKey: data['ai-api-key'] };
  if (aiConfig.endpoint || aiConfig.apiKey) await redis.set('turtletrace:ai:config', JSON.stringify(aiConfig));

  if (data['stock_app_display_indices']) await redis.set('turtletrace:display_indices', JSON.stringify(data['stock_app_display_indices']));
  if (data['welcome_completed']) await redis.set('turtletrace:welcome_completed', data['welcome_completed']);

  console.log('Migration complete. Keys written:', await redis.keys('turtletrace:*'));
}

migrate(process.argv[2]).catch(console.error);
```

#### Step 3.2 添加迁移 npm script
```json
{
  "scripts": {
    "migrate": "tsx server/scripts/migrate.ts"
  }
}
```

#### Step 3.3 前端导出功能（可选）
在"设置"页面增加"导出本地数据"按钮，执行：
```typescript
const exportData = {
  'stock-positions': localStorage.getItem('stock-positions'),
  'turtletrace_accounts': localStorage.getItem('turtletrace_accounts'),
  // ... 其他 key
};
const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
// 下载 blob
```

#### Step 3.4 全流程验证（见下一节）

---

## 9. 验证计划

### Step 3.4 前后端联调验证
```bash
# 启动后端
npm run dev:server

# 输出应包含类似：
# Server running on http://localhost:3001
# Generated new API Key: <uuid>

# 健康检查
curl http://localhost:3001/health

# 带 API Key 测试账户接口
curl http://localhost:3001/api/v1/accounts -H "X-API-Key: <从控制台复制的Key>"

# 查看 Redis 数据
redis-cli
> KEYS turtletrace:*
> GET turtletrace:accounts
```

### Step 3.5 前端验证
```bash
# 启动前后端
npm run dev:all
```

浏览器打开 `http://localhost:5173`，验证：
- 各 Tab 正常加载数据
- 创建/编辑/删除账户、持仓、复盘事件
- `redis-cli GET turtletrace:positions` 确认数据已写入 Redis

### Step 3.6 迁移验证
```bash
# 1. 在旧版前端（localStorage 模式）导出数据
# 2. 运行迁移脚本
npm run migrate -- /path/to/export.json

# 3. 确认 Redis 数据
redis-cli KEYS turtletrace:*

# 4. 启动新版前端，验证数据完整
```
