import { Request, Response, NextFunction } from 'express';
import redis from '../services/redis';

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] as string;
  if (!key) return res.status(401).json({ error: 'Missing API Key' });

  try {
    const validKey = await redis.get('turtletrace:auth:api_key');
    if (!validKey || key !== validKey) return res.status(401).json({ error: 'Invalid API Key' });
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
