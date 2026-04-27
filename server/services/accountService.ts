import redis from './redis';
import { Account, AccountsStorage, CreateAccountInput, UpdateAccountInput, AccountStats } from '../types';

const ACCOUNTS_KEY = 'turtletrace:accounts';

export async function getAccountsStorage(): Promise<AccountsStorage> {
  const data = await redis.get(ACCOUNTS_KEY);
  if (data) return JSON.parse(data);
  return { version: 1, accounts: [], defaultAccountId: '', lastActiveAccountId: '' };
}

export async function saveAccountsStorage(storage: AccountsStorage) {
  await redis.set(ACCOUNTS_KEY, JSON.stringify(storage));
}

export async function getAccounts(): Promise<Account[]> {
  return (await getAccountsStorage()).accounts;
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const storage = await getAccountsStorage();

  const now = new Date().toISOString();
  const isDefault = input.isDefault ?? storage.accounts.length === 0;

  // If setting as default, unset other defaults
  if (isDefault) {
    storage.accounts.forEach(a => { a.isDefault = false; });
    storage.defaultAccountId = '';
  }

  const account: Account = {
    id: crypto.randomUUID(),
    name: input.name,
    type: input.type,
    broker: input.broker,
    description: input.description,
    color: input.color,
    isDefault,
    createdAt: now,
    updatedAt: now,
  };

  storage.accounts.push(account);

  if (isDefault) {
    storage.defaultAccountId = account.id;
  }
  storage.lastActiveAccountId = account.id;

  await saveAccountsStorage(storage);
  return account;
}

export async function updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
  const storage = await getAccountsStorage();
  const index = storage.accounts.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Account not found');

  const account = storage.accounts[index];

  if (input.isDefault && !account.isDefault) {
    storage.accounts.forEach(a => { a.isDefault = false; });
    storage.defaultAccountId = id;
  }

  Object.assign(account, input, { updatedAt: new Date().toISOString() });

  if (input.isDefault) {
    storage.defaultAccountId = id;
  }

  await saveAccountsStorage(storage);
  return account;
}

export async function deleteAccount(id: string): Promise<void> {
  const storage = await getAccountsStorage();
  const index = storage.accounts.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Account not found');

  storage.accounts.splice(index, 1);

  if (storage.defaultAccountId === id) {
    storage.defaultAccountId = storage.accounts[0]?.id ?? '';
    if (storage.accounts[0]) {
      storage.accounts[0].isDefault = true;
    }
  }
  if (storage.lastActiveAccountId === id) {
    storage.lastActiveAccountId = storage.accounts[0]?.id ?? '';
  }

  await saveAccountsStorage(storage);
}

export async function getAccountStats(accountId: string): Promise<AccountStats> {
  const storage = await getAccountsStorage();
  const account = storage.accounts.find(a => a.id === accountId);
  if (!account) throw new Error('Account not found');

  const positionsData = await redis.get('turtletrace:positions');
  const positions = positionsData ? JSON.parse(positionsData) : [];
  const accountPositions = positions.filter((p: { accountId?: string }) => p.accountId === accountId);

  let totalCost = 0;
  let totalValue = 0;
  let todayProfit = 0;

  for (const p of accountPositions) {
    totalCost += p.costPrice * p.quantity;
    totalValue += p.currentPrice * p.quantity;
    todayProfit += (p.currentPrice * p.changePercent / 100) * p.quantity;
  }

  const totalProfit = totalValue - totalCost;
  const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const todayProfitRate = totalValue > 0 ? (todayProfit / totalValue) * 100 : 0;

  return {
    accountId,
    accountName: account.name,
    totalCost,
    totalValue,
    totalProfit,
    profitRate,
    positionCount: accountPositions.length,
    todayProfit,
    todayProfitRate,
  };
}
