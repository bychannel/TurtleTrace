import type { FeeConfig, TCalcInput, TCalcResult, TCalcRecord } from '../types/tCalculator'
import { DEFAULT_FEE_CONFIG } from '../types/tCalculator'

const STORAGE_KEYS = {
  FEE_CONFIG: 't-calculator-fee-config',
  HISTORY: 't-calculator-history',
  LAST_INPUT: 't-calculator-last-input',
}

const MAX_HISTORY_RECORDS = 20

/**
 * 计算做T收益
 */
export function calculateTProfit(input: TCalcInput, feeConfig: FeeConfig): TCalcResult {
  const { buyPrice, sellPrice, quantity } = input
  const { commissionRate, minCommission, stampTaxRate, transferFeeRate } = feeConfig

  // 买入金额
  const buyAmount = buyPrice * quantity

  // 卖出金额
  const sellAmount = sellPrice * quantity

  // 买入佣金（最低 minCommission 元）
  const buyCommission = Math.max(buyAmount * commissionRate, minCommission)

  // 卖出佣金（最低 minCommission 元）
  const sellCommission = Math.max(sellAmount * commissionRate, minCommission)

  // 印花税（仅卖出）
  const stampTax = sellAmount * stampTaxRate

  // 过户费（双向）
  const transferFee = (buyAmount + sellAmount) * transferFeeRate

  // 总手续费
  const totalFee = buyCommission + sellCommission + stampTax + transferFee

  // 净利润
  const netProfit = sellAmount - buyAmount - totalFee

  // 收益率
  const profitRate = buyAmount > 0 ? (netProfit / buyAmount) * 100 : 0

  // 盈亏平衡价
  // 卖出金额 - 买入金额 - 手续费 = 0
  // sellPrice * qty - buyPrice * qty - fees = 0
  // 简化计算：考虑双向费用后的保本价
  const buySideCost = buyAmount + buyCommission + buyAmount * transferFeeRate
  const breakEvenPrice = quantity > 0 ? (buySideCost / quantity) / (1 - stampTaxRate - commissionRate - transferFeeRate) : 0

  return {
    buyAmount,
    sellAmount,
    buyCommission,
    sellCommission,
    stampTax,
    transferFee,
    totalFee,
    netProfit,
    profitRate,
    breakEvenPrice,
  }
}

/**
 * 获取费率配置
 */
export function getFeeConfig(): FeeConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FEE_CONFIG)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_FEE_CONFIG }
}

/**
 * 保存费率配置
 */
export function saveFeeConfig(config: FeeConfig): void {
  localStorage.setItem(STORAGE_KEYS.FEE_CONFIG, JSON.stringify(config))
}

/**
 * 获取上次输入
 */
export function getLastInput(): TCalcInput | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_INPUT)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * 保存上次输入
 */
export function saveLastInput(input: TCalcInput): void {
  localStorage.setItem(STORAGE_KEYS.LAST_INPUT, JSON.stringify(input))
}

/**
 * 获取历史记录
 */
export function getHistory(): TCalcRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  return []
}

/**
 * 添加历史记录
 */
export function addHistoryRecord(record: Omit<TCalcRecord, 'id' | 'createdAt'>): TCalcRecord {
  const history = getHistory()

  const newRecord: TCalcRecord = {
    ...record,
    id: `tcalc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  }

  // 添加到开头，限制数量
  const updatedHistory = [newRecord, ...history].slice(0, MAX_HISTORY_RECORDS)
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory))

  return newRecord
}

/**
 * 删除历史记录
 */
export function deleteHistoryRecord(id: string): void {
  const history = getHistory()
  const updatedHistory = history.filter(r => r.id !== id)
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory))
}

/**
 * 清空历史记录
 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY)
}

/**
 * 重置费率配置为默认值
 */
export function resetFeeConfig(): void {
  localStorage.removeItem(STORAGE_KEYS.FEE_CONFIG)
}
