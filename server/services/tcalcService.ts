import redis from './redis';
import { FeeConfig, TCalcRecord, TCalcInput, DEFAULT_FEE_CONFIG } from '../types';

const FEE_CONFIG_KEY = 'turtletrace:tcalc:fee_config';
const HISTORY_KEY = 'turtletrace:tcalc:history';
const LAST_INPUT_KEY = 'turtletrace:tcalc:last_input';

export async function getFeeConfig(): Promise<FeeConfig> {
  const data = await redis.get(FEE_CONFIG_KEY);
  return data ? JSON.parse(data) : DEFAULT_FEE_CONFIG;
}

export async function saveFeeConfig(config: FeeConfig): Promise<void> {
  await redis.set(FEE_CONFIG_KEY, JSON.stringify(config));
}

export async function getHistory(): Promise<TCalcRecord[]> {
  const data = await redis.get(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveHistory(history: TCalcRecord[]): Promise<void> {
  await redis.set(HISTORY_KEY, JSON.stringify(history));
}

export async function addHistoryRecord(record: TCalcRecord): Promise<TCalcRecord> {
  const history = await getHistory();
  history.unshift(record);
  await saveHistory(history);
  return record;
}

export async function deleteHistoryRecord(id: string): Promise<void> {
  const history = await getHistory();
  const index = history.findIndex(r => r.id === id);
  if (index === -1) throw new Error('Record not found');

  history.splice(index, 1);
  await saveHistory(history);
}

export async function clearHistory(): Promise<void> {
  await redis.del(HISTORY_KEY);
}

export async function getLastInput(): Promise<TCalcInput | null> {
  const data = await redis.get(LAST_INPUT_KEY);
  return data ? JSON.parse(data) : null;
}

export async function saveLastInput(input: TCalcInput): Promise<void> {
  await redis.set(LAST_INPUT_KEY, JSON.stringify(input));
}
