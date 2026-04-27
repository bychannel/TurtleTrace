import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import redis from '../services/redis';

const DISPLAY_INDICES_KEY = 'turtletrace:display_indices';
const WELCOME_KEY = 'turtletrace:welcome_completed';

const router = Router();
router.use(apiKeyAuth);

router.get('/display-indices', async (req, res) => {
  const data = await redis.get(DISPLAY_INDICES_KEY);
  res.json(data ? JSON.parse(data) : []);
});

router.put('/display-indices', async (req, res) => {
  await redis.set(DISPLAY_INDICES_KEY, JSON.stringify(req.body));
  res.json(req.body);
});

router.get('/welcome', async (req, res) => {
  const data = await redis.get(WELCOME_KEY);
  res.json({ completed: data === 'true' });
});

router.put('/welcome', async (req, res) => {
  await redis.set(WELCOME_KEY, String(req.body.completed));
  res.json(req.body);
});

export default router;
