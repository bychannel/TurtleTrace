import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import { FeeSettings } from './FeeSettings'
import type { TCalcInput, FeeConfig } from '../../../types/tCalculator'

interface InputPanelProps {
  input: TCalcInput
  onInputChange: (input: TCalcInput) => void
  feeConfig: FeeConfig
  onFeeConfigChange: (config: FeeConfig) => void
  onCalculate: () => void
  onClear: () => void
}

export function InputPanel({
  input,
  onInputChange,
  feeConfig,
  onFeeConfigChange,
  onCalculate,
  onClear,
}: InputPanelProps) {
  const handleFieldChange = (field: keyof TCalcInput, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value)
    onInputChange({ ...input, [field]: numValue })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onCalculate()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            买入价格 <span className="text-muted-foreground">(元/股)</span>
          </label>
          <Input
            type="number"
            value={input.buyPrice || ''}
            onChange={(e) => handleFieldChange('buyPrice', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
            className="font-mono"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            卖出价格 <span className="text-muted-foreground">(元/股)</span>
          </label>
          <Input
            type="number"
            value={input.sellPrice || ''}
            onChange={(e) => handleFieldChange('sellPrice', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
            className="font-mono"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            数量 <span className="text-muted-foreground">(股)</span>
          </label>
          <Input
            type="number"
            value={input.quantity || ''}
            onChange={(e) => handleFieldChange('quantity', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="100的整数倍"
            className="font-mono"
            step="100"
          />
        </div>
      </div>

      <FeeSettings config={feeConfig} onChange={onFeeConfigChange} />

      <div className="flex gap-2">
        <Button onClick={onCalculate} className="flex-1">
          计算
        </Button>
        <Button variant="outline" onClick={onClear}>
          清空
        </Button>
      </div>
    </div>
  )
}
