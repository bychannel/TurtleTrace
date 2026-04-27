import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import redis from '../services/redis';
import { WeeklyReview } from '../types';

const WEEKLY_KEY = 'turtletrace:reviews:weekly';

const router = Router();
router.use(apiKeyAuth);

router.get('/', async (req, res) => {
  const { year } = req.query;
  const data = await redis.get(WEEKLY_KEY);
  let reviews: WeeklyReview[] = data ? JSON.parse(data) : [];

  if (year) {
    reviews = reviews.filter(r => r.weekLabel.startsWith(String(year)));
  }

  res.json(reviews);
});

router.get('/:weekLabel', async (req, res) => {
  const data = await redis.get(WEEKLY_KEY);
  const reviews: WeeklyReview[] = data ? JSON.parse(data) : [];
  const review = reviews.find(r => r.weekLabel === req.params.weekLabel);
  if (!review) return res.status(404).json({ error: 'Weekly review not found' });
  res.json(review);
});

router.post('/', async (req, res) => {
  const data = await redis.get(WEEKLY_KEY);
  const reviews: WeeklyReview[] = data ? JSON.parse(data) : [];
  const index = reviews.findIndex(r => r.weekLabel === req.body.weekLabel);

  if (index >= 0) {
    reviews[index] = { ...req.body, updatedAt: Date.now() };
  } else {
    reviews.push({ ...req.body, createdAt: Date.now(), updatedAt: Date.now() });
  }

  await redis.set(WEEKLY_KEY, JSON.stringify(reviews));
  res.json(req.body);
});

router.delete('/:weekLabel', async (req, res) => {
  const data = await redis.get(WEEKLY_KEY);
  const reviews: WeeklyReview[] = data ? JSON.parse(data) : [];
  const index = reviews.findIndex(r => r.weekLabel === req.params.weekLabel);
  if (index === -1) return res.status(404).json({ error: 'Weekly review not found' });

  reviews.splice(index, 1);
  await redis.set(WEEKLY_KEY, JSON.stringify(reviews));
  res.json({ success: true });
});

export default router;
