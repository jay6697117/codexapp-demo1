# Pixel Arena - Deno Deploy 部署指南

## 概述

本文档介绍如何将 Pixel Arena 游戏服务器手动部署到 Deno Deploy，无需使用 Deno CLI。

---

## 文件结构

```
pixel-arena/
├── deno.json              # Deno 配置文件
├── server/
│   └── deno-entry.ts      # Deno Deploy 入口文件
└── shared/                # 共享类型（可选）
```

---

## 步骤 1：准备 GitHub 仓库

### 1.1 确保代码已推送到 GitHub

```bash
git add deno.json server/deno-entry.ts
git commit -m "feat: add Deno Deploy configuration"
git push origin main
```

### 1.2 仓库结构要求

确保以下文件存在于仓库中：
- `deno.json` - Deno 配置
- `server/deno-entry.ts` - 服务器入口

---

## 步骤 2：登录 Deno Deploy

1. 访问 [https://dash.deno.com](https://dash.deno.com)
2. 使用 GitHub 账号登录
3. 授权 Deno Deploy 访问你的仓库

---

## 步骤 3：创建新项目

### 3.1 点击 "New Project"

![New Project](https://dash.deno.com)

### 3.2 选择部署方式

选择 **"Deploy from GitHub repository"**

### 3.3 配置项目

| 配置项 | 值 |
|--------|-----|
| **Repository** | 选择你的 `pixel-arena` 仓库 |
| **Branch** | `main` |
| **Entrypoint** | `server/deno-entry.ts` |
| **Project Name** | `pixel-arena` (或自定义) |

### 3.4 环境变量（可选）

点击 "Add Variable" 添加环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `PORT` | `8000` | 服务器端口（Deno Deploy 会自动设置） |
| `NODE_ENV` | `production` | 运行环境 |

---

## 步骤 4：部署

1. 点击 **"Link"** 按钮连接仓库
2. Deno Deploy 会自动开始构建和部署
3. 等待部署完成（通常 30 秒内）

---

## 步骤 5：验证部署

### 5.1 访问部署 URL

部署完成后，你会获得一个 URL：
```
https://pixel-arena.deno.dev
```

### 5.2 测试 API

```bash
# 健康检查
curl https://pixel-arena.deno.dev/health

# 服务器信息
curl https://pixel-arena.deno.dev/

# 房间列表
curl https://pixel-arena.deno.dev/api/rooms
```

### 5.3 预期响应

```json
{
  "name": "Pixel Arena Game Server",
  "version": "1.0.0",
  "status": "running",
  "rooms": 0,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 步骤 6：配置客户端连接

### 6.1 更新客户端 NetworkManager

修改 `client/src/network/NetworkManager.ts`：

```typescript
// 生产环境使用 Deno Deploy URL
const SERVER_URL = import.meta.env.PROD
  ? 'wss://pixel-arena.deno.dev/ws'
  : 'ws://localhost:2567';
```

### 6.2 更新 Vite 配置

修改 `client/vite.config.ts`：

```typescript
export default defineConfig({
  define: {
    'import.meta.env.VITE_SERVER_URL': JSON.stringify(
      process.env.NODE_ENV === 'production'
        ? 'wss://pixel-arena.deno.dev'
        : 'ws://localhost:2567'
    ),
  },
});
```

---

## 步骤 7：部署客户端（静态站点）

客户端可以部署到以下平台：

### 选项 A：Deno Deploy（静态文件）

1. 构建客户端：
   ```bash
   cd client && npm run build
   ```

2. 创建静态文件服务器 `client/serve.ts`：
   ```typescript
   import { serveDir } from "@std/http/file-server";

   Deno.serve((req) => serveDir(req, { fsRoot: "dist" }));
   ```

3. 在 Deno Deploy 创建新项目，入口设为 `client/serve.ts`

### 选项 B：Vercel / Netlify

1. 连接 GitHub 仓库
2. 设置构建命令：`cd client && npm run build`
3. 设置输出目录：`client/dist`
4. 添加环境变量 `VITE_SERVER_URL=wss://pixel-arena.deno.dev`

### 选项 C：GitHub Pages

1. 构建客户端
2. 将 `client/dist` 推送到 `gh-pages` 分支

---

## 自动部署配置

### GitHub Actions（可选）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Deno Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Deno Deploy
        uses: denoland/deployctl@v1
        with:
          project: pixel-arena
          entrypoint: server/deno-entry.ts
```

---

## WebSocket 连接说明

### 连接格式

```
wss://pixel-arena.deno.dev/ws/{roomId}
```

### 消息格式

**发送消息：**
```json
{
  "type": "move",
  "data": { "x": 100, "y": 200, "rotation": 1.57 }
}
```

**接收消息：**
```json
{
  "type": "joined",
  "data": { "sessionId": "uuid", "state": {...} }
}
```

---

## 常见问题

### Q: 部署失败怎么办？

1. 检查 `deno.json` 语法是否正确
2. 确保入口文件路径正确
3. 查看 Deno Deploy 的构建日志

### Q: WebSocket 连接失败？

1. 确保使用 `wss://` 协议（HTTPS）
2. 检查 CORS 配置
3. 确认房间 ID 有效

### Q: 如何查看日志？

1. 登录 [dash.deno.com](https://dash.deno.com)
2. 选择你的项目
3. 点击 "Logs" 标签

### Q: 如何回滚部署？

1. 在 Deno Deploy 控制台
2. 点击 "Deployments"
3. 选择之前的部署版本
4. 点击 "Promote to Production"

---

## 限制说明

| 限制项 | 免费版 | 付费版 |
|--------|--------|--------|
| 请求数/月 | 100,000 | 无限 |
| CPU 时间/请求 | 50ms | 更高 |
| 内存 | 512MB | 更高 |
| WebSocket 连接 | 支持 | 支持 |

---

## 参考链接

- [Deno Deploy 文档](https://docs.deno.com/deploy/manual/)
- [Hono 框架](https://hono.dev/)
- [Deno 标准库](https://jsr.io/@std)

---

## 联系支持

如有问题，请在 GitHub 仓库提交 Issue。
