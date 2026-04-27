import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import redis from '../services/redis';

const EMOTION_TAGS_KEY = 'turtletrace:tags:emotions';
const REASON_TAGS_KEY = 'turtletrace:tags:reasons';

const router = Router();
router.use(apiKeyAuth);

router.get('/emotions', async (req, res) => {
  const data = await redis.get(EMOTION_TAGS_KEY);
  res.json(data ? JSON.parse(data) : []);
});

router.put('/emotions', async (req, res) => {
  await redis.set(EMOTION_TAGS_KEY, JSON.stringify(req.body));
  res.json(req.body);
});

router.get('/reasons', async (req, res) => {
  const data = await redis.get(REASON_TAGS_KEY);
  res.json(data ? JSON.parse(data) : []);
});

router.put('/reasons', async (req, res) => {
  await redis.set(REASON_TAGS_KEY, JSON.stringify(req.body));
  res.json(req.body);
});

export default router;
