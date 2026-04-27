import type { TCalcResult } from '../../../types/tCalculator'
import { formatCurrency, formatPercent } from '../../../lib/utils'

interface ResultPanelProps {
  result: TCalcResult | null
}

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        请输入买卖价格和数量
      </div>
    )
  }

  const { netProfit, profitRate, buyAmount, sellAmount, totalFee, breakEvenPrice,
    buyCommission, sellCommission, stampTax, transferFee } = result

  return (
    <div className="space-y-4">
      {/* 核心结果 */}
      <div className={`p-4 rounded-lg ${netProfit >= 0 ? 'bg-up/10' : 'bg-down/10'}`}>
        <div className="text-sm text-muted-foreground mb-1">净利润</div>
        <div className={`text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-up' : 'text-down'}`}>
          {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
        </div>
        <div className={`text-lg font-medium ${profitRate >= 0 ? 'text-up' : 'text-down'}`}>
          收益率: {formatPercent(profitRate)}
        </div>
      </div>

      {/* 详细数据 */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-1.5 border-b">
          <span className="text-muted-foreground">买入金额</span>
          <span className="font-mono">{formatCurrency(buyAmount)}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b">
          <span className="text-muted-foreground">卖出金额</span>
          <span className="font-mono">{formatCurrency(sellAmount)}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b">
          <span className="text-muted-foreground">买入佣金</span>
          <span className="font-mono">{formatCurrency(buyCommission)}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b">
          <span className="text-muted-foreground">卖出佣金</span>
          <span className="font-mono">{formatCurrency(sellCommission)}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b">
          <span className="text-muted-foreground">印花税</span>
          <span className="font-mono">{formatCurrency(stampTax)}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b">
          <span className="text-muted-foreground">过户费</span>
          <span className="font-mono">{formatCurrency(transferFee)}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b">
          <span className="text-muted-foreground font-medium">总手续费</span>
          <span className="font-mono font-medium text-destructive">{formatCurrency(totalFee)}</span>
        </div>
      </div>

      {/* 盈亏平衡价 */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">盈亏平衡卖出价</div>
        <div className="text-lg font-bold font-mono">
          {breakEvenPrice.toFixed(3)} 元
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          卖出价高于此价格才能盈利
        </div>
      </div>
    </div>
  )
}
