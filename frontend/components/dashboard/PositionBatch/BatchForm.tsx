import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import type { PositionBatch } from '../../../types'

interface BatchFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (batch: Omit<PositionBatch, 'id' | 'transactions' | 'totalBuyAmount' | 'totalSellAmount'>) => void
  editBatch?: PositionBatch | null
  stockName: string
}

export function BatchForm({ open, onClose, onSubmit, editBatch, stockName }: BatchFormProps) {
  const [quantity, setQuantity] = useState(0)
  const [costPrice, setCostPrice] = useState(0)
  const [buyDate, setBuyDate] = useState<string>('')
  const [unlockDate, setUnlockDate] = useState<string>('')
  const [isLocked, setIsLocked] = useState(false)
  const [tag, setTag] = useState('')
  const [note, setNote] = useState('')

  // 初始化表单
  useEffect(() => {
    if (open) {
      if (editBatch) {
        setQuantity(editBatch.quantity)
        setCostPrice(editBatch.costPrice)
        setBuyDate(editBatch.buyDate ? new Date(editBatch.buyDate).toISOString().split('T')[0] : '')
        setUnlockDate(editBatch.unlockDate ? new Date(editBatch.unlockDate).toISOString().split('T')[0] : '')
        setIsLocked(editBatch.isLocked)
        setTag(editBatch.tag || '')
        setNote(editBatch.note || '')
      } else {
        // 重置表单
        setQuantity(0)
        setCostPrice(0)
        setBuyDate('')
        setUnlockDate('')
        setIsLocked(false)
        setTag('')
        setNote('')
      }
    }
  }, [open, editBatch])

  const handleSubmit = () => {
    if (quantity <= 0 || costPrice <= 0) {
      return
    }

    onSubmit({
      quantity,
      costPrice,
      buyDate: buyDate ? new Date(buyDate).getTime() : undefined,
      unlockDate: unlockDate ? new Date(unlockDate).getTime() : undefined,
      isLocked,
      tag: tag || undefined,
      note: note || undefined,
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">
            {editBatch ? '编辑批次' : '添加批次'} - {stockName}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                数量(股) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="100"
                className="font-mono"
                step="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                成本价 <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                value={costPrice || ''}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                placeholder="0.00"
                className="font-mono"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">获得日期</label>
              <Input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">解禁日期</label>
              <Input
                type="date"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isLocked"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="isLocked" className="text-sm">
              锁定中（未解禁）
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">标签</label>
            <Input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="如：第一期激励、2024年批次"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">备注</label>
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选备注"
              maxLength={100}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={quantity <= 0 || costPrice <= 0}>
            {editBatch ? '保存' : '添加'}
          </Button>
        </div>
      </div>
    </div>
  )
}
