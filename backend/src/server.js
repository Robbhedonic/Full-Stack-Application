import 'dotenv/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import sittersRouter from './routes/sitters.js';
import bookingsRouter from './routes/bookings.js';
import adminRouter from './routes/admin.js';

export const app = express();
const port = Number(process.env.PORT || 8080);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/sitters', sittersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);

if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

export function startServer() {
  return app.listen(port, '0.0.0.0', () => {
    console.log(`API listening on 0.0.0.0:${port}`);
  });
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startServer();
}
