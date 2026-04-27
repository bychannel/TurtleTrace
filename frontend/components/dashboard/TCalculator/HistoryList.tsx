import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, History } from 'lucide-react'
import { Button } from '../../ui/button'
import type { TCalcRecord } from '../../../types/tCalculator'
import { formatCurrency, formatPercent } from '../../../lib/utils'

interface HistoryListProps {
  records: TCalcRecord[]
  onDelete: (id: string) => void
  onClear: () => void
  onSelect: (record: TCalcRecord) => void
}

export function HistoryList({ records, onDelete, onClear, onSelect }: HistoryListProps) {
  const [expanded, setExpanded] = useState(false)

  if (records.length === 0) {
    return null
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="border-t">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-surface-hover transition-colors"
      >
        <span className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span>历史记录</span>
          <span className="text-xs text-muted-foreground">({records.length}条)</span>
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b">
                  <th className="text-left py-2 font-normal">买价</th>
                  <th className="text-left py-2 font-normal">卖价</th>
                  <th className="text-right py-2 font-normal">数量</th>
                  <th className="text-right py-2 font-normal">净利润</th>
                  <th className="text-right py-2 font-normal">收益率</th>
                  <th className="text-right py-2 font-normal">时间</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-dashed hover:bg-surface-hover cursor-pointer"
                    onClick={() => onSelect(record)}
                  >
                    <td className="py-2 font-mono">{record.buyPrice.toFixed(2)}</td>
                    <td className="py-2 font-mono">{record.sellPrice.toFixed(2)}</td>
                    <td className="py-2 font-mono text-right">{record.quantity}</td>
                    <td className={`py-2 font-mono text-right ${record.result.netProfit >= 0 ? 'text-up' : 'text-down'}`}>
                      {record.result.netProfit >= 0 ? '+' : ''}{formatCurrency(record.result.netProfit)}
                    </td>
                    <td className={`py-2 font-mono text-right ${record.result.profitRate >= 0 ? 'text-up' : 'text-down'}`}>
                      {formatPercent(record.result.profitRate)}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground text-right">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(record.id)
                        }}
                        className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="mt-2 w-full h-7 text-xs text-muted-foreground"
          >
            清空历史记录
          </Button>
        </div>
      )}
    </div>
  )
}
