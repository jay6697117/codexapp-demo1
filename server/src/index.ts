import Colyseus from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import { createServer } from 'http';
import { serverConfig } from './config.js';

const { Server } = Colyseus;

const app = express();

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// CORS 支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const httpServer = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
  }),
});

// 暂时不注册房间，后续任务会添加

gameServer.listen(serverConfig.port).then(() => {
  console.log(`🎮 Pixel Arena Server`);
  console.log(`🚀 Listening on port ${serverConfig.port}`);
  console.log(`📡 WebSocket ready for connections`);
  console.log(`❤️  Health check: http://localhost:${serverConfig.port}/health`);
});
