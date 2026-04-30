require('dotenv').config();
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const downloadRouter = require('./download');
const infoRouter = require('./info');
const { cleanupOldFiles } = require('./cleanup');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Health route registered BEFORE all middleware (helmet, cors, etc.)
// Railway healthcheck comes from healthcheck.railway.app - helmet would block it
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Flat: static files served from __dirname
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Cok fazla istek. 15 dakika sonra tekrar dene.' }
});
app.use('/api/', limiter);

app.set('io', io);
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.use('/api/download', downloadRouter);
app.use('/api/info', infoRouter);

setInterval(() => cleanupOldFiles(uploadsDir), 30 * 60 * 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('VAULTDL running on port ' + PORT);
});

module.exports = { app, io };
