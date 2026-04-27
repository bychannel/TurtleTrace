import type {
  Account,
  AccountStats,
  AccountsStorage,
  CreateAccountInput,
  UpdateAccountInput,
} from '../types/account'
import type { Position } from '../types'
import { api } from '../lib/apiClient'

// ==================== 账户管理 API ====================

// 获取所有账户存储
export async function getAccountsStorage(): Promise<AccountsStorage> {
  return api.get<AccountsStorage>('/accounts')
}

// 获取所有账户
export async function getAccounts(): Promise<Account[]> {
  const storage = await getAccountsStorage()
  return storage.accounts
}

// 获取单个账户
export async function getAccount(id: string): Promise<Account | null> {
  const accounts = await getAccounts()
  return accounts.find(a => a.id === id) || null
}

// 创建账户
export async function createAccount(input: CreateAccountInput): Promise<Account> {
  return api.post<Account>('/accounts', input)
}

// 更新账户
export async function updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
  return api.put<Account>(`/accounts/${id}`, input)
}

// 删除账户
export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`)
}

// 获取默认账户
export async function getDefaultAccount(): Promise<Account> {
  const storage = await getAccountsStorage()
  const account = storage.accounts.find(a => a.id === storage.defaultAccountId)
  return account || storage.accounts[0]
}

// 设置默认账户
export async function setDefaultAccount(id: string): Promise<void> {
  await updateAccount(id, { isDefault: true })
}

// 获取最后活跃账户
export async function getLastActiveAccount(): Promise<Account> {
  const storage = await getAccountsStorage()
  const account = storage.accounts.find(a => a.id === storage.lastActiveAccountId)
  return account || getDefaultAccount()
}

// 设置最后活跃账户 (前端本地记录，不调用后端)
export function setLastActiveAccount(id: string): void {
  // 此功能由后端 lastActiveAccountId 字段管理，前端可忽略
}

// ==================== 账户统计 API ====================

// 获取账户统计
export async function getAccountStats(accountId: string): Promise<AccountStats> {
  return api.get<AccountStats>(`/accounts/${accountId}/stats`)
}

// 获取所有账户统计
export async function getAllAccountStats(): Promise<AccountStats[]> {
  const accounts = await getAccounts()
  return Promise.all(accounts.map(a => getAccountStats(a.id)))
}

// 获取汇总统计 (前端计算)
export function getTotalStats(): AccountStats {
  return {
    accountId: 'total',
    accountName: '全部账户',
    totalCost: 0,
    totalValue: 0,
    totalProfit: 0,
    profitRate: 0,
    positionCount: 0,
    todayProfit: 0,
    todayProfitRate: 0,
  }
}

// ==================== 数据迁移 API ====================

// 迁移旧数据（将现有持仓关联到默认账户）
export async function migrateLegacyPositions(): Promise<void> {
  // 数据迁移由后端处理
}

// 初始化账户系统（首次使用时调用）
export async function initializeAccountSystem(): Promise<{
  storage: AccountsStorage
  migrated: boolean
}> {
  const storage = await getAccountsStorage()
  return { storage, migrated: false }
}

// ==================== 持仓管理 API ====================

// 获取指定账户的持仓
export async function getPositionsForAccount(accountId: string): Promise<Position[]> {
  return api.get<Position[]>(`/positions?accountId=${accountId}`)
}

// 获取所有账户的持仓
export async function getAllPositions(): Promise<Position[]> {
  return api.get<Position[]>('/positions')
}

// 添加持仓到指定账户
export async function addPositionToAccount(accountId: string, position: Position): Promise<Position> {
  return api.post<Position>('/positions', { ...position, accountId })
}

// 更新持仓
export async function updatePosition(position: Position): Promise<Position> {
  return api.put<Position>(`/positions/${position.id}`, position)
}

// 删除持仓
export async function deletePosition(positionId: string): Promise<void> {
  await api.delete(`/positions/${positionId}`)
}

// 获取持仓（按账户筛选或全部）
export async function getPositions(accountId?: string): Promise<Position[]> {
  if (accountId && accountId !== 'total') {
    return api.get<Position[]>(`/positions?accountId=${accountId}`)
  }
  return api.get<Position[]>('/positions')
}
