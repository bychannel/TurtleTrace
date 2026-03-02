import { useState } from 'react'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import type { FeeConfig } from '../../../types/tCalculator'
import { DEFAULT_FEE_CONFIG } from '../../../types/tCalculator'

interface FeeSettingsProps {
  config: FeeConfig
  onChange: (config: FeeConfig) => void
}

export function FeeSettings({ config, onChange }: FeeSettingsProps) {
  const [expanded, setExpanded] = useState(false)

  const handleChange = (key: keyof FeeConfig, value: string) => {
    const numValue = parseFloat(value) || 0
    onChange({ ...config, [key]: numValue })
  }

  const handleReset = () => {
    onChange({ ...DEFAULT_FEE_CONFIG })
  }

  // 将费率转换为更友好的显示格式
  const formatRateForDisplay = (rate: number) => {
    // 万分之几
    return (rate * 10000).toFixed(2)
  }

  const parseRateFromInput = (value: string) => {
    const num = parseFloat(value) || 0
    return num / 10000
  }

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:bg-surface-hover transition-colors"
      >
        <span>手续费设置</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                佣金 (万分之)
              </label>
              <Input
                type="number"
                value={formatRateForDisplay(config.commissionRate)}
                onChange={(e) => onChange({ ...config, commissionRate: parseRateFromInput(e.target.value) })}
                className="h-8 text-sm"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                最低佣金 (元)
              </label>
              <Input
                type="number"
                value={config.minCommission}
                onChange={(e) => handleChange('minCommission', e.target.value)}
                className="h-8 text-sm"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                印花税 (万分之)
              </label>
              <Input
                type="number"
                value={formatRateForDisplay(config.stampTaxRate)}
                onChange={(e) => onChange({ ...config, stampTaxRate: parseRateFromInput(e.target.value) })}
                className="h-8 text-sm"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                过户费 (万分之)
              </label>
              <Input
                type="number"
                value={formatRateForDisplay(config.transferFeeRate)}
                onChange={(e) => onChange({ ...config, transferFeeRate: parseRateFromInput(e.target.value) })}
                className="h-8 text-sm"
                step="0.01"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-full h-7 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            恢复默认
          </Button>
        </div>
      )}
    </div>
  )
}
