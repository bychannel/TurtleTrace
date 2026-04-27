import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import cors from './middleware/cors';
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
app.use(cors());
app.use(express.json());

// API Key initialization
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

// Serve .api-key file
app.use('/api-key', (req, res) => {
  res.sendFile('.api-key', { root: process.cwd() });
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
