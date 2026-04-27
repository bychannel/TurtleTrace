import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import * as accountService from '../services/accountService';

const router = Router();
router.use(apiKeyAuth);

router.get('/', async (req, res) => {
  res.json(await accountService.getAccountsStorage());
});

router.post('/', async (req, res) => {
  const account = await accountService.createAccount(req.body);
  res.json(account);
});

router.put('/:id', async (req, res) => {
  try {
    res.json(await accountService.updateAccount(req.params.id, req.body));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await accountService.deleteAccount(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    res.json(await accountService.getAccountStats(req.params.id));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export default router;
