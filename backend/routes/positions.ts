import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import * as positionService from '../services/positionService';

const router = Router();
router.use(apiKeyAuth);

router.get('/', async (req, res) => {
  const { accountId } = req.query;
  if (accountId) {
    res.json(await positionService.getPositionsByAccount(accountId as string));
  } else {
    res.json(await positionService.getPositions());
  }
});

router.post('/', async (req, res) => {
  const position = await positionService.createPosition(req.body);
  res.json(position);
});

router.put('/:id', async (req, res) => {
  try {
    res.json(await positionService.updatePosition(req.params.id, req.body));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await positionService.deletePosition(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.post('/save-all', async (req, res) => {
  const { positions } = req.body;
  await positionService.saveAllPositions(positions);
  res.json({ success: true });
});

export default router;
