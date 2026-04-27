import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import redis from './services/redis';
import accountsRouter from './routes/accounts';
import positionsRouter from './routes/positions';
import reviewsRouter from './routes/reviews';
import weeklyReviewsRouter from './routes/weeklyReviews';
import eventsRouter from './routes/events';
import tcalcRouter from './routes/tcalc';
import tagsRouter from './routes/tags';
import aiRouter from './routes/ai';
import settingsRouter from './routes/settings';

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));
app.use(express.json());

// API Key initialization
async function initApiKey() {
  const envKey = process.env.API_KEY;
  if (envKey) {
    await redis.set('turtletrace:auth:api_key', envKey);
    await fs.writeFile('.api-key', envKey);
    console.log('Using API_KEY from environment');
  } else {
    let key = await redis.get('turtletrace:auth:api_key');
    if (!key) {
      key = crypto.randomUUID();
      await redis.set('turtletrace:auth:api_key', key);
      await fs.writeFile('.api-key', key);
      console.log('Generated new API Key:', key);
    }
  }
}

// Serve .api-key file
app.use('/api-key', async (req, res) => {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), '.api-key'), 'utf-8');
    res.send(content);
  } catch {
    res.status(404).send('Not found');
  }
});

// Route registration
app.use('/api/v1/accounts', accountsRouter);
app.use('/api/v1/positions', positionsRouter);
app.use('/api/v1/reviews/daily', reviewsRouter);
app.use('/api/v1/reviews/weekly', weeklyReviewsRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/tcalc', tcalcRouter);
app.use('/api/v1/tags', tagsRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/settings', settingsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

initApiKey().then(() => {
  app.listen(process.env.PORT || 3001, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 3001}`);
  });
});
