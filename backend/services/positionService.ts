import redis from './redis';
import { Position } from '../types';

const POSITIONS_KEY = 'turtletrace:positions';

export async function getPositions(): Promise<Position[]> {
  const data = await redis.get(POSITIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function savePositions(positions: Position[]): Promise<void> {
  await redis.set(POSITIONS_KEY, JSON.stringify(positions));
}

export async function getPositionsByAccount(accountId: string): Promise<Position[]> {
  const positions = await getPositions();
  return positions.filter(p => p.accountId === accountId);
}

export async function createPosition(position: Position): Promise<Position> {
  const positions = await getPositions();
  positions.push(position);
  await savePositions(positions);
  return position;
}

export async function updatePosition(id: string, updates: Partial<Position>): Promise<Position> {
  const positions = await getPositions();
  const index = positions.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Position not found');

  positions[index] = { ...positions[index], ...updates };
  await savePositions(positions);
  return positions[index];
}

export async function deletePosition(id: string): Promise<void> {
  const positions = await getPositions();
  const index = positions.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Position not found');

  positions.splice(index, 1);
  await savePositions(positions);
}
