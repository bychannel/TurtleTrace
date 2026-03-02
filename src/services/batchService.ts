import type { Position, PositionBatch, Transaction } from '../types'

/**
 * 生成唯一ID
 */
export function generateBatchId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 判断持仓是否使用批次模式
 */
export function isBatchMode(position: Position): boolean {
  return !!position.batches && position.batches.length > 0
}

/**
 * 计算持仓汇总数据（从批次汇总）
 */
export function calculatePositionSummaryFromBatches(position: Position): {
  quantity: number
  costPrice: number
  totalBuyAmount: number
  totalSellAmount: number
} {
  if (!position.batches || position.batches.length === 0) {
    return {
      quantity: position.quantity,
      costPrice: position.costPrice,
      totalBuyAmount: position.totalBuyAmount,
      totalSellAmount: position.totalSellAmount,
    }
  }

  const batches = position.batches

  // 总数量
  const quantity = batches.reduce((sum, b) => sum + b.quantity, 0)

  // 加权平均成本
  const totalCost = batches.reduce((sum, b) => sum + b.quantity * b.costPrice, 0)
  const costPrice = quantity > 0 ? totalCost / quantity : 0

  // 累计买卖金额
  const totalBuyAmount = batches.reduce((sum, b) => sum + b.totalBuyAmount, 0)
  const totalSellAmount = batches.reduce((sum, b) => sum + b.totalSellAmount, 0)

  return { quantity, costPrice, totalBuyAmount, totalSellAmount }
}

/**
 * 获取可卖批次（非锁定，按日期升序FIFO）
 */
export function getSellableBatches(batches: PositionBatch[]): PositionBatch[] {
  const now = Date.now()

  return batches
    .filter(b => b.quantity > 0 && !b.isLocked && (!b.unlockDate || b.unlockDate <= now))
    .sort((a, b) => {
      // 按买入日期升序（FIFO）
      const dateA = a.buyDate || 0
      const dateB = b.buyDate || 0
      return dateA - dateB
    })
}

/**
 * 计算卖出批次分配（FIFO）
 */
export function calculateBatchSellAllocation(
  batches: PositionBatch[],
  sellQuantity: number
): { batchId: string; quantity: number }[] {
  const sellableBatches = getSellableBatches(batches)
  const allocation: { batchId: string; quantity: number }[] = []

  let remaining = sellQuantity

  for (const batch of sellableBatches) {
    if (remaining <= 0) break

    const sellFromThisBatch = Math.min(batch.quantity, remaining)
    if (sellFromThisBatch > 0) {
      allocation.push({ batchId: batch.id, quantity: sellFromThisBatch })
      remaining -= sellFromThisBatch
    }
  }

  return allocation
}

/**
 * 获取可卖数量
 */
export function getSellableQuantity(batches: PositionBatch[]): number {
  return getSellableBatches(batches).reduce((sum, b) => sum + b.quantity, 0)
}

/**
 * 创建新批次
 */
export function createBatch(params: {
  quantity: number
  costPrice: number
  buyDate?: number
  unlockDate?: number
  isLocked?: boolean
  tag?: string
  note?: string
}): PositionBatch {
  return {
    id: generateBatchId(),
    quantity: params.quantity,
    costPrice: params.costPrice,
    buyDate: params.buyDate,
    unlockDate: params.unlockDate,
    isLocked: params.isLocked ?? false,
    tag: params.tag,
    note: params.note,
    transactions: [],
    totalBuyAmount: params.quantity * params.costPrice,
    totalSellAmount: 0,
  }
}

/**
 * 添加批次到持仓
 */
export function addBatchToPosition(position: Position, batch: PositionBatch): Position {
  const batches = position.batches || []
  const newBatches = [...batches, batch]
  const summary = calculatePositionSummaryFromBatches({ ...position, batches: newBatches })

  return {
    ...position,
    batches: newBatches,
    ...summary,
  }
}

/**
 * 更新批次
 */
export function updateBatchInPosition(
  position: Position,
  batchId: string,
  updates: Partial<PositionBatch>
): Position {
  if (!position.batches) return position

  const newBatches = position.batches.map(b =>
    b.id === batchId ? { ...b, ...updates } : b
  )
  const summary = calculatePositionSummaryFromBatches({ ...position, batches: newBatches })

  return {
    ...position,
    batches: newBatches,
    ...summary,
  }
}

/**
 * 删除批次（仅当数量为0时允许）
 */
export function deleteBatchFromPosition(position: Position, batchId: string): Position {
  if (!position.batches) return position

  const batch = position.batches.find(b => b.id === batchId)
  if (!batch || batch.quantity > 0) {
    throw new Error('无法删除：批次仍有持仓')
  }

  const newBatches = position.batches.filter(b => b.id !== batchId)
  const summary = calculatePositionSummaryFromBatches({ ...position, batches: newBatches })

  return {
    ...position,
    batches: newBatches.length > 0 ? newBatches : undefined,
    ...summary,
  }
}

/**
 * 执行批次卖出
 */
export function executeBatchSell(
  position: Position,
  transaction: Transaction,
  allocation: { batchId: string; quantity: number }[]
): Position {
  if (!position.batches) return position

  const newBatches = position.batches.map(batch => {
    const alloc = allocation.find(a => a.batchId === batch.id)
    if (!alloc || alloc.quantity <= 0) return batch

    const sellAmount = transaction.price * alloc.quantity
    const newTransaction: Transaction = {
      ...transaction,
      id: `${transaction.id}-${batch.id}`,
      quantity: alloc.quantity,
      amount: sellAmount,
      batchId: batch.id,
    }

    return {
      ...batch,
      quantity: batch.quantity - alloc.quantity,
      totalSellAmount: batch.totalSellAmount + sellAmount,
      transactions: [...batch.transactions, newTransaction],
    }
  })

  const summary = calculatePositionSummaryFromBatches({ ...position, batches: newBatches })

  return {
    ...position,
    batches: newBatches,
    transactions: [...position.transactions, transaction],
    ...summary,
  }
}

/**
 * 将普通持仓转换为批次模式
 */
export function convertToBatchMode(position: Position): Position {
  if (position.batches && position.batches.length > 0) {
    return position // 已经是批次模式
  }

  const batch: PositionBatch = {
    id: generateBatchId(),
    quantity: position.quantity,
    costPrice: position.costPrice,
    buyDate: position.transactions[0]?.timestamp,
    isLocked: false,
    transactions: [...position.transactions],
    totalBuyAmount: position.totalBuyAmount,
    totalSellAmount: position.totalSellAmount,
  }

  return {
    ...position,
    batches: [batch],
  }
}

/**
 * 将批次模式转换为普通模式
 */
export function convertToNormalMode(position: Position): Position {
  if (!position.batches || position.batches.length === 0) {
    return position // 已经是普通模式
  }

  // 合并所有批次的交易记录
  const allTransactions = position.batches.flatMap(b => b.transactions)

  return {
    ...position,
    batches: undefined,
    transactions: allTransactions,
  }
}

/**
 * 拆分普通持仓为多个批次
 */
export function splitPositionToBatches(
  position: Position,
  splits: { quantity: number; costPrice: number; tag?: string; buyDate?: number; unlockDate?: number; isLocked?: boolean }[]
): Position {
  const batches: PositionBatch[] = splits.map(split => ({
    id: generateBatchId(),
    quantity: split.quantity,
    costPrice: split.costPrice,
    buyDate: split.buyDate,
    unlockDate: split.unlockDate,
    isLocked: split.isLocked ?? false,
    tag: split.tag,
    transactions: [],
    totalBuyAmount: split.quantity * split.costPrice,
    totalSellAmount: 0,
  }))

  const summary = calculatePositionSummaryFromBatches({ ...position, batches })

  return {
    ...position,
    batches,
    ...summary,
  }
}

/**
 * 计算批次盈亏
 */
export function calculateBatchProfit(
  batch: PositionBatch,
  currentPrice: number
): {
  marketValue: number
  profit: number
  profitPercent: number
} {
  const marketValue = batch.quantity * currentPrice
  const cost = batch.quantity * batch.costPrice
  const profit = marketValue - cost
  const profitPercent = cost > 0 ? (profit / cost) * 100 : 0

  return { marketValue, profit, profitPercent }
}

/**
 * 检查批次解禁状态（根据当前时间自动更新）
 */
export function checkBatchUnlockStatus(batch: PositionBatch): PositionBatch {
  if (!batch.isLocked || !batch.unlockDate) {
    return batch
  }

  const now = Date.now()
  if (batch.unlockDate <= now) {
    return { ...batch, isLocked: false }
  }

  return batch
}

/**
 * 更新所有批次的解禁状态
 */
export function updateBatchesUnlockStatus(position: Position): Position {
  if (!position.batches) return position

  const newBatches = position.batches.map(checkBatchUnlockStatus)
  return { ...position, batches: newBatches }
}
