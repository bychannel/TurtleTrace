import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import redis from '../services/redis';

const AI_CONFIG_KEY = 'turtletrace:ai:config';

const router = Router();
router.use(apiKeyAuth);

router.get('/config', async (req, res) => {
  const data = await redis.get(AI_CONFIG_KEY);
  res.json(data ? JSON.parse(data) : { endpoint: '', apiKey: '' });
});

router.put('/config', async (req, res) => {
  await redis.set(AI_CONFIG_KEY, JSON.stringify(req.body));
  res.json(req.body);
});

export default router;
