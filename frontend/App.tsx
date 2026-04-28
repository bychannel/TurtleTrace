import { useState, useEffect, useCallback, useMemo } from 'react'
import { PositionManager } from './components/dashboard/PositionManager'
import { ProfitDashboard } from './components/dashboard/ProfitDashboard'
import { NewsFeed } from './components/dashboard/NewsFeed'
import { DataExport } from './components/dashboard/DataExport'
import { ReviewTab } from './components/dashboard/review/ReviewTab'
import { EventCalendar } from './components/dashboard/eventCalendar/EventCalendar'
import { AccountSwitcher } from './components/dashboard/AccountSwitcher'
import { AccountManager } from './components/dashboard/AccountManager'
import { LineChart, TrendingUp, Newspaper, Database, BookOpen, Menu, X, Wallet, ChevronRight, Building2, CalendarDays } from 'lucide-react'
import { TCalculatorTrigger } from './components/dashboard/TCalculator'
import { WelcomeWizard } from './components/welcome'
import type { Position } from './types'
import type { Account } from './types/account'
import { calculateProfitSummary, calculateClearedProfit } from './utils/calculations'
import { formatCurrency, formatPercent } from './lib/utils'
import TurtleTraceLogo from './assets/TurtleTraceLogo.png'
import {
  getAccounts,
  getLastActiveAccount,
  setLastActiveAccount,
  getPositions,
  savePositions,
  initializeAccountSystem,
} from './services/accountService'
import { initApiKey } from './lib/apiClient'
import { isWelcomeCompleted, markWelcomeCompleted } from './services/welcomeService'

function App() {
  // 欢迎页状态
  const [showWelcome, setShowWelcome] = useState(true)  // 初始为 true，初始化时检查

  // 持仓数据
  const [allPositions, setAllPositions] = useState<Position[]>([])  // 所有持仓（未筛选）

  // 账户相关状态
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null)  // null 表示全部账户

  // UI 状态
  const [showClearedPositionsInOverview, setShowClearedPositionsInOverview] = useState(false)
  const [showClearedProfitCard, setShowClearedProfitCard] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'news' | 'data' | 'review' | 'calendar' | 'accounts'>('overview')

  // 初始化账户系统和数据迁移
  useEffect(() => {
    // 初始化 API Key
    initApiKey()

    // 检查 welcome 状态
    isWelcomeCompleted().then(completed => {
      setShowWelcome(!completed)
    })

    initializeAccountSystem().then(({ migrated }) => {
      if (migrated) {
        console.log('Data migrated to multi-account structure')
      }
    })

    // 加载账户
    getAccounts().then(loadedAccounts => {
      setAccounts(loadedAccounts)
    })

    // 获取最后活跃账户
    getLastActiveAccount().then(lastActive => {
      setCurrentAccountId(lastActive.id)
    })

    // 加载持仓
    getPositions().then(loadedPositions => {
      setAllPositions(loadedPositions)
    })
  }, [])

  // 根据当前账户筛选持仓（使用 useMemo 避免 effect 中 setState）
  const filteredPositions = useMemo(() => {
    if (currentAccountId === null) {
      return allPositions
    }
    return allPositions.filter(p => p.accountId === currentAccountId)
  }, [currentAccountId, allPositions])

  // 计算收益汇总（使用 useMemo 避免 effect 中 setState）
  const calculatedSummary = useMemo(() => {
    const positionsToUse = showClearedPositionsInOverview
      ? filteredPositions
      : filteredPositions.filter(p => p.quantity > 0)
    const newSummary = calculateProfitSummary(positionsToUse)

    // 计算清仓股票收益
    const clearedProfit = calculateClearedProfit(filteredPositions) ?? undefined

    return {
      ...newSummary,
      clearedProfit,
    }
  }, [filteredPositions, showClearedPositionsInOverview])

  // 处理账户切换
  const handleAccountChange = useCallback((accountId: string | null) => {
    setCurrentAccountId(accountId)
    if (accountId) {
      setLastActiveAccount(accountId)
    }
    // 重新加载账户列表（可能账户信息有变化）
    getAccounts().then(setAccounts)
  }, [])

  // 打开账户管理
  const handleOpenAccountManager = useCallback(() => {
    setActiveTab('accounts')
  }, [])

  // 账户变化后刷新数据
  const handleAccountChangeRefresh = useCallback(() => {
    getAccounts().then(setAccounts)
    getPositions().then(setAllPositions)
  }, [])

  // 持仓变化处理
  const handlePositionsChange = useCallback((newPositions: Position[]) => {
    // 获取当前操作的账户ID（全部账户视图时使用默认账户）
    const targetAccountId = currentAccountId || accounts.find(a => a.isDefault)?.id

    let mergedPositions: Position[]

    if (currentAccountId === null) {
      // 全部账户视图：需要智能合并
      // 1. 保留所有不属于目标账户的持仓
      // 2. 用新持仓替换目标账户的持仓
      const otherAccountPositions = allPositions.filter(
        p => p.accountId !== targetAccountId
      )
      const updatedPositions = newPositions.map(p => ({
        ...p,
        accountId: targetAccountId || p.accountId,
      }))
      mergedPositions = [...otherAccountPositions, ...updatedPositions]
    } else {
      // 指定账户视图：合并其他账户的数据
      const otherAccountPositions = allPositions.filter(p => p.accountId !== currentAccountId)
      const updatedPositions = newPositions.map(p => ({
        ...p,
        accountId: currentAccountId,
      }))
      mergedPositions = [...otherAccountPositions, ...updatedPositions]
    }

    setAllPositions(mergedPositions)
    // 同步到后端 Redis
    savePositions(mergedPositions).catch(err => {
      console.error('Failed to save positions to backend:', err)
    })
  }, [currentAccountId, allPositions, accounts])

  // 导入持仓处理
  const handleImportPositions = (importedPositions: Position[]) => {
    // 导入的持仓需要关联到当前账户
    const accountId = currentAccountId || accounts.find(a => a.isDefault)?.id
    const positionsWithAccount = importedPositions.map(p => ({
      ...p,
      accountId: accountId || p.accountId,
    }))
    setAllPositions(positionsWithAccount)
  }

  // 获取当前显示的持仓市值
  const displayStats = useMemo(() => {
    return {
      totalProfit: calculatedSummary.totalProfit,
      totalProfitPercent: calculatedSummary.totalProfitPercent,
      totalCost: calculatedSummary.totalCost,
      totalValue: calculatedSummary.totalValue,
      positions: calculatedSummary.positions,
    }
  }, [calculatedSummary])

  const tabs = [
    { id: 'overview' as const, label: '总览', icon: LineChart },
    { id: 'positions' as const, label: '持仓管理', icon: TrendingUp },
    { id: 'review' as const, label: '复盘管理', icon: BookOpen },
    { id: 'calendar' as const, label: '消息日历', icon: CalendarDays },
    { id: 'news' as const, label: '新闻快讯', icon: Newspaper },
    { id: 'accounts' as const, label: '账户管理', icon: Building2 },
    { id: 'data' as const, label: '设置', icon: Database },
  ]

  // 欢迎页完成处理
  const handleWelcomeComplete = useCallback(async () => {
    await markWelcomeCompleted()
    setShowWelcome(false)
    // 重新加载账户和持仓数据
    setAccounts(await getAccounts())
    const lastActive = await getLastActiveAccount()
    setCurrentAccountId(lastActive.id)
    setAllPositions(await getPositions())
  }, [])

  // 显示欢迎页
  if (showWelcome) {
    return <WelcomeWizard onComplete={handleWelcomeComplete} />
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* 左侧导航栏 */}
      <aside className={`fixed left-0 top-0 h-screen border-r bg-card flex flex-col transition-all duration-300 z-20 ${
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}>
        {/* Logo 区域 */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <img
              src={TurtleTraceLogo}
              alt="龟迹复盘"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold">龟迹复盘</h1>
              <p className="text-xs text-muted-foreground">个人投资组合复盘</p>
            </div>
          </div>
        </div>

        {/* 持仓市值信息 */}
        {filteredPositions.length > 0 && (
          <div className="px-6 py-4 border-b bg-surface-hover">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {currentAccountId === null ? '全部账户市值' : '持仓市值'}
              </span>
            </div>
            <div className={`text-lg font-bold font-mono tabular-nums ${displayStats.totalProfit >= 0 ? 'text-up' : 'text-down'}`}>
              {displayStats.totalProfit >= 0 ? '+' : ''}
              {formatCurrency(displayStats.totalProfit)}
            </div>
            <div className={`text-sm font-medium ${displayStats.totalProfitPercent >= 0 ? 'text-up' : 'text-down'}`}>
              ({displayStats.totalProfitPercent >= 0 ? '+' : ''}{formatPercent(displayStats.totalProfitPercent)})
            </div>
          </div>
        )}

        {/* 导航菜单 */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left">{tab.label}</span>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            )
          })}
        </nav>

        {/* 侧边栏底部 */}
        <div className="p-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-1">
            <span>龟迹复盘</span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* 顶部栏 */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* 账户切换器（仅当有多个账户时显示） */}
            {accounts.length > 0 && (
              <AccountSwitcher
                accounts={accounts}
                currentAccountId={currentAccountId}
                onAccountChange={handleAccountChange}
                onOpenManager={handleOpenAccountManager}
              />
            )}

            {/* 做T计算器入口 */}
            <TCalculatorTrigger />
          </div>

          <div className="text-xs text-muted-foreground">
            数据仅供参考，不构成投资建议
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          {activeTab === 'overview' && (
            <ProfitDashboard
              summary={calculatedSummary}
              showClearedPositions={showClearedPositionsInOverview}
              onToggleClearedPositions={() => setShowClearedPositionsInOverview(!showClearedPositionsInOverview)}
              hasClearedPositions={filteredPositions.some(p => p.quantity <= 0)}
              showClearedProfitCard={showClearedProfitCard}
              onToggleClearedProfitCard={() => setShowClearedProfitCard(!showClearedProfitCard)}
            />
          )}

          {activeTab === 'positions' && (
            <PositionManager
              positions={filteredPositions}
              onPositionsChange={handlePositionsChange}
              currentAccountId={currentAccountId}
              accounts={accounts}
            />
          )}

          {activeTab === 'news' && (
            <NewsFeed symbols={filteredPositions.map(p => p.symbol)} />
          )}

          {activeTab === 'review' && (
            <ReviewTab
              currentAccountId={currentAccountId}
              accounts={accounts}
              positions={filteredPositions}
              profitSummary={calculatedSummary}
            />
          )}

          {activeTab === 'calendar' && (
            <EventCalendar />
          )}

          {activeTab === 'accounts' && (
            <AccountManager
              onAccountChange={handleAccountChangeRefresh}
            />
          )}

          {activeTab === 'data' && (
            <DataExport
              positions={allPositions}
              summary={calculatedSummary}
              onImport={handleImportPositions}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
