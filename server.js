'use strict';

// ── Crash handlers ────────────────────────────────────────────────────────────
process.on('uncaughtException',  (err) => { console.error('[FATAL] uncaughtException:', err); process.exit(1); });
process.on('unhandledRejection', (err) => { console.error('[FATAL] unhandledRejection:', err); process.exit(1); });

console.log('[boot] loading modules...');

const http    = require('http');
const path    = require('path');
const fs      = require('fs');

console.log('[boot] loading express...');
const express = require('express');

console.log('[boot] loading socket.io...');
const { Server } = require('socket.io');

console.log('[boot] loading middleware...');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

console.log('[boot] loading dotenv...');
require('dotenv').config();

console.log('[boot] loading routers...');
const downloadRouter      = require('./download');
const infoRouter          = require('./info');
const { cleanupOldFiles } = require('./cleanup');

console.log('[boot] creating app...');
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// /health FIRST - zero middleware, raw response
// Railway sends healthcheck from healthcheck.railway.app hostname.
// Registering before all app.use() calls means nothing can block it.
app.get('/health', (_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
});

// Middleware
app.set('trust proxy', 1);
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));

// Rate limiter (only /api/)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Cok fazla istek. 15 dakika sonra tekrar dene.' }
});
app.use('/api/', limiter);

// Socket.IO
app.set('io', io);
io.on('connection', (socket) => {
  console.log('[ws] connected:', socket.id);
  socket.on('disconnect', () => console.log('[ws] disconnected:', socket.id));
});

// API routes
app.use('/api/download', downloadRouter);
app.use('/api/info',     infoRouter);

// Cleanup
setInterval(() => cleanupOldFiles(uploadsDir), 30 * 60 * 1000);

// Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('[boot] VAULTDL listening on 0.0.0.0:' + PORT);
});

module.exports = { app, io };
