import { Lock, Unlock, Pencil, Trash2, Plus } from 'lucide-react'
import type { Position, PositionBatch } from '../../../types'
import { calculateBatchProfit, checkBatchUnlockStatus } from '../../../services/batchService'
import { formatPercent } from '../../../lib/utils'

interface BatchListProps {
  position: Position
  onAddBatch: () => void
  onEditBatch: (batch: PositionBatch) => void
  onDeleteBatch: (batchId: string) => void
  onSellBatch: (batch: PositionBatch) => void
}

export function BatchList({
  position,
  onAddBatch,
  onEditBatch,
  onDeleteBatch,
  onSellBatch,
}: BatchListProps) {
  const batches = position.batches || []
  const currentPrice = position.currentPrice

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  // 获取批次的实际锁定状态（系统自动识别）
  const getActualLockStatus = (batch: PositionBatch): { isLocked: boolean; isUnlockDatePassed: boolean } => {
    const checkedBatch = checkBatchUnlockStatus(batch)
    const now = Date.now()
    const isUnlockDatePassed = !batch.unlockDate || batch.unlockDate <= now
    return {
      isLocked: checkedBatch.isLocked,
      isUnlockDatePassed,
    }
  }

  return (
    <div className="mt-2 ml-8 border-l-2 border-border pl-4 space-y-2">
      {batches.map(batch => {
        const { profit, profitPercent } = calculateBatchProfit(batch, currentPrice)
        // 使用系统自动识别的锁定状态
        const { isLocked, isUnlockDatePassed } = getActualLockStatus(batch)
        const canSell = batch.quantity > 0 && !isLocked && isUnlockDatePassed
        const canDelete = batch.quantity === 0

        return (
          <div
            key={batch.id}
            className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm
              ${isLocked ? 'bg-muted/30' : 'bg-surface-hover'}`}
          >
            {/* 锁定状态 - 系统自动识别 */}
            <div className={`flex-shrink-0 ${isLocked ? 'text-orange-500' : 'text-muted-foreground'}`}>
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </div>

            {/* 标签 */}
            {batch.tag && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                {batch.tag}
              </span>
            )}

            {/* 数量和成本 */}
            <div className="flex-shrink-0 font-mono">
              <span className="text-foreground">{batch.quantity}股</span>
              <span className="text-muted-foreground mx-2">成本:</span>
              <span className="text-foreground">{batch.costPrice.toFixed(2)}</span>
            </div>

            {/* 解禁日期 - 根据当前日期自动判断状态 */}
            {(isLocked || batch.unlockDate) && (
              <div className="flex-shrink-0 text-xs">
                {isLocked ? (
                  <span className="text-orange-500">
                    锁定→{formatDate(batch.unlockDate)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    解禁:{formatDate(batch.unlockDate)}
                  </span>
                )}
              </div>
            )}

            {/* 盈亏 */}
            {batch.quantity > 0 && (
              <div className={`flex-shrink-0 font-mono ${profit >= 0 ? 'text-up' : 'text-down'}`}>
                {formatPercent(profitPercent)}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex-grow" />
            <div className="flex items-center gap-1">
              {canSell && (
                <button
                  onClick={() => onSellBatch(batch)}
                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                >
                  卖出
                </button>
              )}
              <button
                onClick={() => onEditBatch(batch)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {canDelete && (
                <button
                  onClick={() => onDeleteBatch(batch.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* 添加批次按钮 */}
      <button
        onClick={onAddBatch}
        className="flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>添加批次</span>
      </button>
    </div>
  )
}
