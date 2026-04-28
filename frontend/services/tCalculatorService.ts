import type { FeeConfig, TCalcInput, TCalcResult, TCalcRecord } from '../types/tCalculator'
import { DEFAULT_FEE_CONFIG } from '../types/tCalculator'
import { api } from '../lib/apiClient'

/**
 * 计算做T收益
 */
export function calculateTProfit(input: TCalcInput, feeConfig: FeeConfig): TCalcResult {
  const { buyPrice, sellPrice, quantity } = input
  const { commissionRate, minCommission, stampTaxRate, transferFeeRate } = feeConfig

  const buyAmount = buyPrice * quantity
  const sellAmount = sellPrice * quantity

  const buyCommission = Math.max(buyAmount * commissionRate, minCommission)
  const sellCommission = Math.max(sellAmount * commissionRate, minCommission)
  const stampTax = sellAmount * stampTaxRate
  const transferFee = (buyAmount + sellAmount) * transferFeeRate

  const totalFee = buyCommission + sellCommission + stampTax + transferFee
  const netProfit = sellAmount - buyAmount - totalFee
  const profitRate = buyAmount > 0 ? (netProfit / buyAmount) * 100 : 0

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
export async function getFeeConfig(): Promise<FeeConfig> {
  try {
    return await api.get<FeeConfig>('/tcalc/config')
  } catch {
    return { ...DEFAULT_FEE_CONFIG }
  }
}

/**
 * 保存费率配置
 */
export async function saveFeeConfig(config: FeeConfig): Promise<void> {
  await api.put('/tcalc/config', config)
}

/**
 * 获取上次输入
 */
export async function getLastInput(): Promise<TCalcInput | null> {
  try {
    return await api.get<TCalcInput | null>('/tcalc/last-input')
  } catch {
    return null
  }
}

/**
 * 保存上次输入
 */
export async function saveLastInput(input: TCalcInput): Promise<void> {
  await api.post('/tcalc/last-input', input)
}

/**
 * 获取历史记录
 */
export async function getHistory(): Promise<TCalcRecord[]> {
  try {
    return await api.get<TCalcRecord[]>('/tcalc/history')
  } catch {
    return []
  }
}

/**
 * 添加历史记录
 */
export async function addHistoryRecord(record: Omit<TCalcRecord, 'id' | 'createdAt'>): Promise<TCalcRecord> {
  const newRecord: TCalcRecord = {
    ...record,
    id: `tcalc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  }
  return await api.post<TCalcRecord>('/tcalc/history', newRecord)
}

/**
 * 删除历史记录
 */
export async function deleteHistoryRecord(id: string): Promise<void> {
  await api.delete(`/tcalc/history/${id}`)
}

/**
 * 清空历史记录
 */
export async function clearHistory(): Promise<void> {
  await api.delete('/tcalc/history')
}

/**
 * 重置费率配置为默认值
 */
export async function resetFeeConfig(): Promise<void> {
  await saveFeeConfig(DEFAULT_FEE_CONFIG)
}
