import { useState, useEffect } from 'react';
import { Edit, Trash2, Download, Calendar } from 'lucide-react';
import { weeklyReviewService } from '../../../services/weeklyReviewService';
import type { WeeklyReview } from '../../../types/weeklyReview';
import { getCurrentWeekLabel } from '../../../types/weeklyReview';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils';

interface WeeklyReviewViewerProps {
  onEditWeek?: (weekLabel: string) => void;
}

export function WeeklyReviewViewer({ onEditWeek }: WeeklyReviewViewerProps) {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<WeeklyReview | null>(null);
  const [deletingWeek, setDeletingWeek] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const allReviews = await weeklyReviewService.getAllReviews();
    setReviews(allReviews);
    if (allReviews.length > 0 && !selectedWeek) {
      setSelectedWeek(allReviews[0].weekLabel);
      setSelectedReview(allReviews[0]);
    }
  };

  const handleSelectWeek = (weekLabel: string) => {
    setSelectedWeek(weekLabel);
    const review = reviews.find(r => r.weekLabel === weekLabel);
    setSelectedReview(review || null);
  };

  const handleEdit = () => {
    if (selectedWeek && onEditWeek) {
      onEditWeek(selectedWeek);
    }
  };

  const handleDelete = async (weekLabel: string) => {
    if (!confirm(`确定要删除 ${weekLabel} 的复盘吗？`)) return;

    setDeletingWeek(weekLabel);
    const success = await weeklyReviewService.deleteReview(weekLabel);

    if (success) {
      await loadReviews();
      if (selectedWeek === weekLabel) {
        const remaining = reviews.filter(r => r.weekLabel !== weekLabel);
        if (remaining.length > 0) {
          setSelectedWeek(remaining[0].weekLabel);
          setSelectedReview(remaining[0]);
        } else {
          setSelectedWeek(null);
          setSelectedReview(null);
        }
      }
    }

    setDeletingWeek(null);
  };

  const handleExport = async (weekLabel: string) => {
    await weeklyReviewService.exportToPDF(weekLabel);
  };

  const cycleMap: Record<string, string> = {
    startup: '启动期',
    main_rise: '主升期',
    climax: '高潮期',
    divergence: '分歧期',
    retreat: '退潮期'
  };

  const freqMap: Record<string, string> = {
    excessive: '过度交易',
    moderate: '适度',
    missed: '错失机会'
  };

  if (reviews.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-muted/20 rounded-full mb-4">
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">还没有周复盘记录</h3>
          <p className="text-muted-foreground mb-6">开始创建你的第一个每周复盘吧</p>
          {onEditWeek && (
            <Button onClick={() => onEditWeek(getCurrentWeekLabel())}>
              创建本周复盘
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* 左侧周列表 */}
      <div className="col-span-3">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              历史复盘
            </h3>
            <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin">
              {reviews.map(review => (
                <button
                  key={review.weekLabel}
                  onClick={() => handleSelectWeek(review.weekLabel)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-all border",
                    selectedWeek === review.weekLabel
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-surface-hover border-transparent'
                  )}
                >
                  <div className="font-medium font-mono">{review.weekLabel}</div>
                  <div className={cn("text-xs mt-1", selectedWeek === review.weekLabel ? "opacity-80" : "text-muted-foreground")}>
                    {review.startDate} ~ {review.endDate}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 右侧复盘详情 */}
      <div className="col-span-9">
        {selectedReview ? (
          <div className="space-y-6">
            {/* 顶部操作栏 */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    {selectedReview.weekLabel}
                    <Badge variant="outline" className="text-sm">每周复盘</Badge>
                  </h2>
                  <p className="text-muted-foreground mt-1 font-mono">{selectedReview.startDate} ~ {selectedReview.endDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport(selectedReview.weekLabel)}
                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                    title="导出PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {onEditWeek && (
                    <button
                      onClick={handleEdit}
                      className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedReview.weekLabel)}
                    disabled={deletingWeek === selectedReview.weekLabel}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors disabled:opacity-50"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>

            {/* 复盘内容 */}
            <div className="space-y-6">
              {/* 一、本周核心目标回顾 */}
              {selectedReview.coreGoals && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>🎯</span>
                      <span>一、本周核心目标回顾</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">主线板块：</span>
                        <span className="ml-2">{selectedReview.coreGoals.mainSectors.join('、') || '-'}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">核心逻辑：</span>
                        <p className="mt-1 text-sm bg-muted/50 p-3 rounded-md">
                          {selectedReview.coreGoals.coreLogic || '-'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 二、本周成果评估 */}
              {selectedReview.achievements && selectedReview.achievements.marketPerformance && selectedReview.achievements.sectorPerformance && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>📊</span>
                      <span>二、本周成果评估</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className={cn("p-3 rounded-lg border", selectedReview.achievements.marketPerformance.shanghaiChange >= 0 ? "bg-up/5 border-up/20" : "bg-down/5 border-down/20")}>
                          <div className="text-sm text-muted-foreground">上证涨跌</div>
                          <div className={cn("text-lg font-semibold font-mono", selectedReview.achievements.marketPerformance.shanghaiChange >= 0 ? 'text-up' : 'text-down')}>
                            {selectedReview.achievements.marketPerformance.shanghaiChange >= 0 ? '+' : ''}{selectedReview.achievements.marketPerformance.shanghaiChange.toFixed(2)}%
                          </div>
                        </div>
                        <div className={cn("p-3 rounded-lg border", selectedReview.achievements.marketPerformance.chinextChange >= 0 ? "bg-up/5 border-up/20" : "bg-down/5 border-down/20")}>
                          <div className="text-sm text-muted-foreground">创业板涨跌</div>
                          <div className={cn("text-lg font-semibold font-mono", selectedReview.achievements.marketPerformance.chinextChange >= 0 ? 'text-up' : 'text-down')}>
                            {selectedReview.achievements.marketPerformance.chinextChange >= 0 ? '+' : ''}{selectedReview.achievements.marketPerformance.chinextChange.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      <div className="bg-surface/50 p-3 rounded-lg border">
                        <div className="text-sm text-muted-foreground">主线板块 vs 大盘</div>
                        <div className="text-lg font-semibold font-mono">
                          <span className={selectedReview.achievements.sectorPerformance.sectorChange >= 0 ? 'text-up' : 'text-down'}>
                            {selectedReview.achievements.sectorPerformance.sectorChange >= 0 ? '+' : ''}{selectedReview.achievements.sectorPerformance.sectorChange.toFixed(2)}%
                          </span>
                          <span className="text-muted-foreground mx-2">vs</span>
                          <span className={selectedReview.achievements.marketPerformance.shanghaiChange >= 0 ? 'text-up' : 'text-down'}>
                            {selectedReview.achievements.marketPerformance.shanghaiChange >= 0 ? '+' : ''}{selectedReview.achievements.marketPerformance.shanghaiChange.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-surface/50 p-3 rounded-lg text-center border">
                          <div className="text-sm text-muted-foreground">主线仓位</div>
                          <div className="text-lg font-semibold font-mono">{selectedReview.achievements.mainSectorPosition.toFixed(1)}%</div>
                        </div>
                        <div className={cn("p-3 rounded-lg text-center border", selectedReview.achievements.totalProfitLoss >= 0 ? "bg-up/5 border-up/20" : "bg-down/5 border-down/20")}>
                          <div className="text-sm text-muted-foreground">总体盈亏</div>
                          <div className={cn("text-lg font-semibold font-mono", selectedReview.achievements.totalProfitLoss >= 0 ? 'text-up' : 'text-down')}>
                            {selectedReview.achievements.totalProfitLoss >= 0 ? '+' : ''}{selectedReview.achievements.totalProfitLoss.toFixed(2)}%
                          </div>
                        </div>
                        <div className="bg-surface/50 p-3 rounded-lg text-center border">
                          <div className="text-sm text-muted-foreground">胜率</div>
                          <div className="text-lg font-semibold font-mono">{selectedReview.achievements.winRate.toFixed(1)}%</div>
                        </div>
                      </div>
                      {selectedReview.achievements.highlights.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2 text-success">✓ 操作亮点</div>
                          <ul className="space-y-1">
                            {selectedReview.achievements.highlights.map((h, i) => (
                              <li key={i} className="text-sm text-muted-foreground">• {h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedReview.achievements.lowlights.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2 text-destructive">✗ 操作槽点</div>
                          <ul className="space-y-1">
                            {selectedReview.achievements.lowlights.map((l, i) => (
                              <li key={i} className="text-sm text-muted-foreground">• {l}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 三、资源投入分析 */}
              {selectedReview.resourceAnalysis && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>💰</span>
                      <span>三、资源投入分析</span>
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-40">资金集中主线：</span>
                        <span className={cn("font-medium", selectedReview.resourceAnalysis.focusedOnMain ? 'text-success' : 'text-destructive')}>
                          {selectedReview.resourceAnalysis.focusedOnMain ? '✓ 是' : '✗ 否'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-40">分散杂毛股：</span>
                        <span className={cn("font-medium", selectedReview.resourceAnalysis.scatteredAttention ? 'text-destructive' : 'text-success')}>
                          {selectedReview.resourceAnalysis.scatteredAttention ? '✗ 是' : '✓ 否'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-40">操作频率：</span>
                        <span className="font-medium">{freqMap[selectedReview.resourceAnalysis.tradingFrequency]}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 四、关键信号与市场节奏判断 */}
              {selectedReview.marketRhythm && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>📈</span>
                      <span>四、关键信号与市场节奏判断</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">情绪周期：</span>
                        <span className="ml-2 font-medium">{cycleMap[selectedReview.marketRhythm.emotionCycle]}</span>
                      </div>
                      {selectedReview.marketRhythm.keySignals.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">核心信号：</span>
                          <ul className="mt-2 space-y-1">
                            {selectedReview.marketRhythm.keySignals.map((s, i) => (
                              <li key={i} className="text-sm bg-muted/50 p-2 rounded">• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-muted/50 p-2 rounded">
                          <div className="text-muted-foreground">北向资金</div>
                          <div>{selectedReview.marketRhythm.northwardFunds}</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded">
                          <div className="text-muted-foreground">量能</div>
                          <div>{selectedReview.marketRhythm.volume}</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded">
                          <div className="text-muted-foreground">涨停家数</div>
                          <div>{selectedReview.marketRhythm.limitUpCount}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 五、下周核心策略制定 */}
              {selectedReview.nextWeekStrategy && selectedReview.nextWeekStrategy.riskControl && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>🎯</span>
                      <span>五、下周核心策略制定</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">聚焦主线：</span>
                        <span className="ml-2 font-medium">{selectedReview.nextWeekStrategy.mainSector}</span>
                      </div>
                      {selectedReview.nextWeekStrategy.catalystEvents.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">催化事件：</span>
                          <ul className="mt-2 space-y-1">
                            {selectedReview.nextWeekStrategy.catalystEvents.map((e, i) => (
                              <li key={i} className="text-sm bg-muted/50 p-2 rounded">• {e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 p-2 rounded">
                          <div className="text-sm text-muted-foreground">主升期仓位</div>
                          <div>{selectedReview.nextWeekStrategy.positionPlan.mainRise}</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded">
                          <div className="text-sm text-muted-foreground">退潮期仓位</div>
                          <div>{selectedReview.nextWeekStrategy.positionPlan.divergence}</div>
                        </div>
                      </div>
                      {selectedReview.nextWeekStrategy.focusTargets.filter(t => t.name).length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">关注标的：</span>
                          <div className="mt-2 space-y-2">
                            {selectedReview.nextWeekStrategy.focusTargets
                              .filter(t => t.name)
                              .map((t, i) => (
                                <div key={i} className="bg-muted/50 p-2 rounded text-sm">
                                  <span className="font-medium">{t.name}</span>
                                  <span className="text-muted-foreground mx-2">({t.symbol})</span>
                                  <span className="text-muted-foreground">- {t.logic}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">最大止损：</span>
                          <span className="font-medium">{selectedReview.nextWeekStrategy.riskControl.maxSingleLoss}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">退潮减仓至：</span>
                          <span className="font-medium">{selectedReview.nextWeekStrategy.riskControl.retreatPosition}成</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 六、本周最大认知收获 */}
              {selectedReview.keyInsight && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>💡</span>
                      <span>六、本周最大认知收获</span>
                    </h3>
                    <p className="text-sm bg-muted/50 p-4 rounded-md italic border-l-4 border-primary">
                      {selectedReview.keyInsight}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 底部信息 */}
              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                创建于 {new Date(selectedReview.createdAt).toLocaleString('zh-CN')}
                {selectedReview.updatedAt !== selectedReview.createdAt && (
                  <span> · 更新于 {new Date(selectedReview.updatedAt).toLocaleString('zh-CN')}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">请选择一周查看复盘</p>
          </div>
        )}
      </div>
    </div>
  );
}
