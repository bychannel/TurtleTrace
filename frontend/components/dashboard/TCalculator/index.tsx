import { useState, useEffect, useCallback } from 'react'
import { X, Calculator } from 'lucide-react'
import { InputPanel } from './InputPanel'
import { ResultPanel } from './ResultPanel'
import { HistoryList } from './HistoryList'
import type { TCalcInput, TCalcResult, FeeConfig, TCalcRecord } from '../../../types/tCalculator'
import { DEFAULT_FEE_CONFIG } from '../../../types/tCalculator'
import {
  calculateTProfit,
  getFeeConfig,
  saveFeeConfig,
  getLastInput,
  saveLastInput,
  getHistory,
  addHistoryRecord,
  deleteHistoryRecord,
  clearHistory,
} from '../../../services/tCalculatorService'

interface TCalculatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TCalculator({ open, onOpenChange }: TCalculatorProps) {
  const [input, setInput] = useState<TCalcInput>({ buyPrice: 0, sellPrice: 0, quantity: 0 })
  const [feeConfig, setFeeConfig] = useState<FeeConfig>(DEFAULT_FEE_CONFIG)
  const [result, setResult] = useState<TCalcResult | null>(null)
  const [history, setHistory] = useState<TCalcRecord[]>([])

  // 初始化：加载上次输入和历史记录
  useEffect(() => {
    if (open) {
      const lastInput = getLastInput()
      if (lastInput) {
        setInput(lastInput)
        // 自动计算
        if (lastInput.buyPrice > 0 && lastInput.sellPrice > 0 && lastInput.quantity > 0) {
          const calcResult = calculateTProfit(lastInput, feeConfig)
          setResult(calcResult)
        }
      }
      getHistory().then(setHistory)
    }
  }, [open, feeConfig])

  const handleCalculate = useCallback(() => {
    if (input.buyPrice > 0 && input.sellPrice > 0 && input.quantity > 0) {
      const calcResult = calculateTProfit(input, feeConfig)
      setResult(calcResult)

      // 保存输入
      saveLastInput(input)

      // 添加到历史记录
      const record = addHistoryRecord({
        buyPrice: input.buyPrice,
        sellPrice: input.sellPrice,
        quantity: input.quantity,
        result: calcResult,
        feeConfig,
      })
      setHistory(prev => [record, ...prev.slice(0, 19)])
    }
  }, [input, feeConfig])

  const handleClear = useCallback(() => {
    setInput({ buyPrice: 0, sellPrice: 0, quantity: 0 })
    setResult(null)
    saveLastInput({ buyPrice: 0, sellPrice: 0, quantity: 0 })
  }, [])

  const handleFeeConfigChange = useCallback((config: FeeConfig) => {
    setFeeConfig(config)
    saveFeeConfig(config)
  }, [])

  const handleDeleteHistory = useCallback((id: string) => {
    deleteHistoryRecord(id)
    setHistory(prev => prev.filter(r => r.id !== id))
  }, [])

  const handleClearHistory = useCallback(() => {
    clearHistory()
    setHistory([])
  }, [])

  const handleSelectHistory = useCallback((record: TCalcRecord) => {
    setInput({
      buyPrice: record.buyPrice,
      sellPrice: record.sellPrice,
      quantity: record.quantity,
    })
    setFeeConfig(record.feeConfig)
    setResult(record.result)
    saveLastInput({
      buyPrice: record.buyPrice,
      sellPrice: record.sellPrice,
      quantity: record.quantity,
    })
    saveFeeConfig(record.feeConfig)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">做T计算器</h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6 p-4">
            {/* 左侧输入区 */}
            <div>
              <InputPanel
                input={input}
                onInputChange={setInput}
                feeConfig={feeConfig}
                onFeeConfigChange={handleFeeConfigChange}
                onCalculate={handleCalculate}
                onClear={handleClear}
              />
            </div>

            {/* 右侧结果区 */}
            <div>
              <ResultPanel result={result} />
            </div>
          </div>

          {/* 历史记录 */}
          <HistoryList
            records={history}
            onDelete={handleDeleteHistory}
            onClear={handleClearHistory}
            onSelect={handleSelectHistory}
          />
        </div>
      </div>
    </div>
  )
}

// 触发按钮组件
export function TCalculatorTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        <Calculator className="h-4 w-4" />
        <span>做T计算</span>
      </button>

      <TCalculator open={open} onOpenChange={setOpen} />
    </>
  )
}
