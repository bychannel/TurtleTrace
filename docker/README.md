# TurtleTrace Docker 部署指南

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      Docker Compose                       │
│                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │    Nginx     │   │   Backend    │   │    Redis     │ │
│  │  (Frontend)  │◄──│   (API)      │◄──│  (Storage)   │ │
│  │  :80         │   │   :3001      │   │   :6379      │ │
│  └──────────────┘   └──────────────┘   └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 目录结构

```
docker/
├── docker-compose.yml       # 服务编排配置
├── Dockerfile.frontend      # 前端构建镜像
├── Dockerfile.backend       # 后端构建镜像
└── nginx.frontend.conf     # Nginx 配置
```

## 快速开始

### 1. 构建并启动服务

```bash
cd docker
docker-compose up -d --build
```

### 2. 验证服务状态

```bash
docker-compose ps
```

输出应显示：
```
NAME                STATUS
turtletrace-frontend-1   Up
turtletrace-backend-1     Up (healthy)
turtletrace-redis-1       Up (healthy)
```

### 3. 访问应用

- 前端地址：http://localhost
- 后端健康检查：http://localhost:3001/health

### 4. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 只看后端日志
docker-compose logs -f backend

# 只看前端日志
docker-compose logs -f frontend
```

## 常用操作

### 停止服务

```bash
docker-compose down
```

### 重启服务

```bash
docker-compose restart backend
```

### 重新构建

```bash
docker-compose up -d --build
```

### 重建某个服务

```bash
docker-compose up -d --build backend
```

## 数据管理

### 查看 Redis 数据

```bash
docker-compose exec redis redis-cli
```

### 备份 Redis 数据

```bash
docker-compose exec redis redis-cli BGSAVE
docker cp $(docker-compose ps -q redis):/data/dump.rdb ./backup.rdb
```

### 恢复 Redis 数据

```bash
docker cp ./backup.rdb $(docker-compose ps -q redis):/data/dump.rdb
docker-compose exec redis redis-cli RESTORE dump.rdb
```

## 配置说明

### 环境变量

在 `docker-compose.yml` 中可以修改以下环境变量：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 后端端口 | `3001` |
| `REDIS_HOST` | Redis 主机 | `redis` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `CORS_ORIGIN` | 允许的跨域源 | `http://localhost` |

### 修改 CORS 配置

```bash
# 编辑 docker-compose.yml
environment:
  - CORS_ORIGIN=https://your-domain.com
```

重启后端：
```bash
docker-compose up -d --build backend
```

## HTTPS 配置

### 使用自签名证书（测试环境）

```bash
# 生成自签名证书
mkdir -p nginx
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/self-signed.key \
  -out nginx/self-signed.crt
```

修改 `nginx.frontend.conf`：

```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/self-signed.crt;
    ssl_certificate_key /etc/nginx/ssl/self-signed.key;
    # ... 其他配置
}
```

修改 `docker-compose.yml` 添加证书挂载：

```yaml
frontend:
  volumes:
    - ./nginx/self-signed.crt:/etc/nginx/ssl/self-signed.crt
    - ./nginx/self-signed.key:/etc/nginx/ssl/self-signed.key
```

### 使用 Let's Encrypt（生产环境）

推荐使用 [jwilder/nginx-proxy](https://github.com/nginx-proxy/nginx-proxy) 配合 letsencrypt-nginx-proxy-companion。

## 故障排查

### 服务无法启动

```bash
# 查看详细错误
docker-compose logs

# 检查端口占用
netstat -ano | findstr "80"
```

### 后端显示不健康

```bash
# 查看后端日志
docker-compose logs backend

# 进入容器调试
docker-compose exec backend sh
```

### Redis 连接失败

```bash
# 检查 Redis 状态
docker-compose exec redis redis-cli ping

# 预期输出: PONG
```

### 前端无法访问 API

1. 确认后端服务健康：`curl http://localhost:3001/health`
2. 检查 Nginx 日志：`docker-compose logs frontend`
3. 确认 `nginx.frontend.conf` 中 `proxy_pass` 指向正确

## 清理

### 删除所有容器和数据

```bash
docker-compose down -v
```

### 完全重置

```bash
docker-compose down -v --rmi all
rm -rf vol
```
