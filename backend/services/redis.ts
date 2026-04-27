import Redis from 'ioredis';
import 'dotenv/config';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
});

redis.on('error', (err) => console.error('Redis error:', err));

export default redis;
