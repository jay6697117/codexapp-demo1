/**
 * Pixel Arena - Deno Deploy 入口文件
 *
 * 这是一个适配 Deno Deploy 的服务器入口
 * 使用 Hono 框架 + Colyseus 游戏服务器
 */

import { Hono } from "@hono/hono";
import { serveStatic } from "@hono/hono/deno";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";

// 游戏配置常量（从 shared 移植）
const GAME_CONFIG = {
  MAP_WIDTH: 2000,
  MAP_HEIGHT: 2000,
  MAX_PLAYERS: 20,
  MIN_PLAYERS_TO_START: 2,
  LOBBY_COUNTDOWN: 30,
  SAFE_ZONE_INITIAL_RADIUS: 900,
  SAFE_ZONE_MIN_RADIUS: 50,
  SAFE_ZONE_SHRINK_INTERVAL: 60000,
  SAFE_ZONE_DAMAGE: 5,
};

// 简化版 GameRoom（Deno 兼容）
class GameRoom {
  state: any;
  clients: Map<string, any> = new Map();

  onCreate(options: any) {
    console.log("GameRoom created!", options);
    this.state = {
      players: new Map(),
      items: new Map(),
      bullets: new Map(),
      gamePhase: "waiting",
      alivePlayers: 0,
    };
  }

  onJoin(client: any, options: any) {
    console.log(`Player ${client.sessionId} joined`);
    this.clients.set(client.sessionId, client);

    // 创建玩家状态
    this.state.players.set(client.sessionId, {
      id: client.sessionId,
      name: options?.name || `Player_${client.sessionId.slice(0, 4)}`,
      x: Math.random() * GAME_CONFIG.MAP_WIDTH,
      y: Math.random() * GAME_CONFIG.MAP_HEIGHT,
      health: 100,
      isAlive: true,
      kills: 0,
    });

    this.state.alivePlayers++;
  }

  onLeave(client: any) {
    console.log(`Player ${client.sessionId} left`);
    this.clients.delete(client.sessionId);

    const player = this.state.players.get(client.sessionId);
    if (player?.isAlive) {
      this.state.alivePlayers--;
    }
    this.state.players.delete(client.sessionId);
  }

  onMessage(client: any, type: string, message: any) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    switch (type) {
      case "move":
        player.x = message.x;
        player.y = message.y;
        player.rotation = message.rotation;
        break;
      case "shoot":
        this.broadcast("bullet", {
          ownerId: client.sessionId,
          ...message,
        });
        break;
    }
  }

  broadcast(type: string, message: any, exclude?: string) {
    this.clients.forEach((client, sessionId) => {
      if (sessionId !== exclude) {
        client.send(JSON.stringify({ type, data: message }));
      }
    });
  }

  onDispose() {
    console.log("GameRoom disposed");
  }
}

// 房间管理器
const rooms: Map<string, GameRoom> = new Map();

// 创建 Hono 应用
const app = new Hono();

// API: 服务器状态
app.get("/api/status", (c) => {
  return c.json({
    name: "Pixel Arena Game Server",
    version: "1.0.0",
    status: "running",
    rooms: rooms.size,
    timestamp: new Date().toISOString(),
  });
});

// API: 健康检查
app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

// 房间列表 API
app.get("/api/rooms", (c) => {
  const roomList = Array.from(rooms.entries()).map(([id, room]) => ({
    roomId: id,
    name: `Room ${id.slice(0, 6)}`,
    playerCount: room.clients.size,
    maxPlayers: GAME_CONFIG.MAX_PLAYERS,
    status: room.state.gamePhase,
    mapName: "Default",
  }));
  return c.json(roomList);
});

// 创建房间
app.post("/api/rooms", async (c) => {
  const roomId = crypto.randomUUID();
  const room = new GameRoom();
  room.onCreate({});
  rooms.set(roomId, room);

  return c.json({ roomId, success: true });
});

// WebSocket 处理
app.get("/ws/:roomId", async (c) => {
  const roomId = c.req.param("roomId");

  // 升级到 WebSocket
  const { socket, response } = Deno.upgradeWebSocket(c.req.raw);

  let room = rooms.get(roomId);
  if (!room) {
    room = new GameRoom();
    room.onCreate({});
    rooms.set(roomId, room);
  }

  const sessionId = crypto.randomUUID();

  socket.onopen = () => {
    console.log(`WebSocket connected: ${sessionId}`);
    room!.onJoin({ sessionId, send: (msg: string) => socket.send(msg) }, {});

    // 发送初始状态
    socket.send(JSON.stringify({
      type: "joined",
      data: {
        sessionId,
        state: Object.fromEntries(room!.state.players),
      },
    }));
  };

  socket.onmessage = (event) => {
    try {
      const { type, data } = JSON.parse(event.data);
      room!.onMessage({ sessionId }, type, data);
    } catch (e) {
      console.error("Message parse error:", e);
    }
  };

  socket.onclose = () => {
    console.log(`WebSocket disconnected: ${sessionId}`);
    room!.onLeave({ sessionId });
  };

  socket.onerror = (e) => {
    console.error("WebSocket error:", e);
  };

  return response;
});

// 静态文件服务（前端）- 必须放在 API 路由之后作为 fallback
app.use("/*", serveStatic({ root: "./client/dist" }));

// 对于 SPA，所有未匹配的路由返回 index.html
app.get("/*", serveStatic({ path: "./client/dist/index.html" }));

// 导出 fetch 处理器（Deno Deploy 需要）
export default app;

// 本地开发时启动服务器
if (import.meta.main) {
  const port = parseInt(Deno.env.get("PORT") || "2567");
  console.log(`🎮 Pixel Arena Server running on http://localhost:${port}`);
  Deno.serve({ port }, app.fetch);
}
