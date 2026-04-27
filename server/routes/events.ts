import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import * as eventService from '../services/eventService';
import { EventFilter } from '../types';

const router = Router();
router.use(apiKeyAuth);

router.get('/', async (req, res) => {
  const filter: EventFilter = {};
  if (req.query.eventType) filter.eventType = (req.query.eventType as string).split(',') as any;
  if (req.query.importance) filter.importance = (req.query.importance as string).split(',') as any;
  if (req.query.status) filter.status = (req.query.status as string).split(',') as any;
  if (req.query.tags) filter.tags = (req.query.tags as string).split(',');
  if (req.query.startDate && req.query.endDate) {
    filter.dateRange = { start: req.query.startDate as string, end: req.query.endDate as string };
  }
  if (req.query.search) filter.search = req.query.search as string;

  res.json(await eventService.getFilteredEvents(filter));
});

router.get('/upcoming/:days', async (req, res) => {
  res.json(await eventService.getUpcomingEvents(parseInt(req.params.days, 10)));
});

router.get('/:id', async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

router.post('/', async (req, res) => {
  res.json(await eventService.createEvent(req.body));
});

router.put('/:id', async (req, res) => {
  try {
    res.json(await eventService.updateEvent(req.params.id, req.body));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await eventService.deleteEvent(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export default router;
