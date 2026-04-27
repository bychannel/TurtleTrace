import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import * as reviewService from '../services/reviewService';

const router = Router();
router.use(apiKeyAuth);

router.get('/', async (req, res) => {
  const { startDate, endDate } = req.query;
  if (startDate && endDate) {
    res.json(await reviewService.getReviewsByDateRange(startDate as string, endDate as string));
  } else {
    res.json(await reviewService.getReviews());
  }
});

router.get('/:date', async (req, res) => {
  const review = await reviewService.getReviewByDate(req.params.date);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  res.json(review);
});

router.post('/', async (req, res) => {
  res.json(await reviewService.saveReview(req.body));
});

router.delete('/:date', async (req, res) => {
  try {
    await reviewService.deleteReview(req.params.date);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export default router;
