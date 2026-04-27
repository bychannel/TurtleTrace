import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import * as tcalcService from '../services/tcalcService';

const router = Router();
router.use(apiKeyAuth);

router.get('/config', async (req, res) => {
  res.json(await tcalcService.getFeeConfig());
});

router.put('/config', async (req, res) => {
  await tcalcService.saveFeeConfig(req.body);
  res.json(req.body);
});

router.get('/history', async (req, res) => {
  res.json(await tcalcService.getHistory());
});

router.post('/history', async (req, res) => {
  res.json(await tcalcService.addHistoryRecord(req.body));
});

router.delete('/history/:id', async (req, res) => {
  try {
    await tcalcService.deleteHistoryRecord(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.delete('/history', async (req, res) => {
  await tcalcService.clearHistory();
  res.json({ success: true });
});

router.get('/last-input', async (req, res) => {
  res.json(await tcalcService.getLastInput());
});

router.post('/last-input', async (req, res) => {
  await tcalcService.saveLastInput(req.body);
  res.json(req.body);
});

export default router;
