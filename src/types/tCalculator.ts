// 费率配置
export interface FeeConfig {
  commissionRate: number      // 佣金率
  minCommission: number       // 最低佣金
  stampTaxRate: number        // 印花税率
  transferFeeRate: number     // 过户费率
}

// 计算结果
export interface TCalcResult {
  buyAmount: number           // 买入金额
  sellAmount: number          // 卖出金额
  buyCommission: number       // 买入佣金
  sellCommission: number      // 卖出佣金
  stampTax: number            // 印花税
  transferFee: number         // 过户费
  totalFee: number            // 总手续费
  netProfit: number           // 净利润
  profitRate: number          // 收益率
  breakEvenPrice: number      // 盈亏平衡价
}

// 输入参数
export interface TCalcInput {
  buyPrice: number
  sellPrice: number
  quantity: number
}

// 历史记录
export interface TCalcRecord {
  id: string
  buyPrice: number
  sellPrice: number
  quantity: number
  result: TCalcResult
  feeConfig: FeeConfig
  createdAt: number
}

// 默认费率配置
export const DEFAULT_FEE_CONFIG: FeeConfig = {
  commissionRate: 0.00025,    // 万分之2.5
  minCommission: 5,           // 最低5元
  stampTaxRate: 0.001,        // 千分之一
  transferFeeRate: 0.00001,   // 万分之0.1
}
