import type { NewsAnalysis } from '../services/aiService'
import logoImage from '../assets/TurtleTraceLogo.png'

// 品牌配置
const BRAND = {
  name: '龟迹复盘',
  slogan: '让投资更透明',
  tagline: 'AI智能解读',
}

// 颜色配置
const COLORS = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  background: '#f8fafc',
  cardBg: '#ffffff',
  text: '#1e293b',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  up: '#10b981',
  down: '#ef4444',
  border: '#e2e8f0',
}

// 枚举映射
const directionLabels: Record<string, string> = {
  POSITIVE: '利好',
  NEGATIVE: '利空',
  NEUTRAL: '中性',
}

const sentimentLabels: Record<string, string> = {
  BULLISH: '看涨',
  BEARISH: '看跌',
  NEUTRAL: '中性',
}

const levelLabels: Record<string, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
}

const timeHorizonLabels: Record<string, string> = {
  SHORT_TERM: '短期',
  MEDIUM_TERM: '中期',
  LONG_TERM: '长期',
}

const expectationLabels: Record<string, string> = {
  SUPERIOR: '超预期',
  IN_LINE: '符合预期',
  INFERIOR: '不及预期',
}

// 绘制圆角矩形
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// 绘制文字（自动换行）
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const chars = text.split('')
  let line = ''
  let currentY = y

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY)
      line = chars[i]
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
  return currentY + lineHeight
}

// 绘制标签
function drawTag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bgColor: string, textColor: string) {
  const padding = 8
  const textWidth = ctx.measureText(text).width
  const width = textWidth + padding * 2
  const height = 28
  const radius = 14

  ctx.fillStyle = bgColor
  roundRect(ctx, x, y, width, height, radius)
  ctx.fill()

  ctx.fillStyle = textColor
  ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText(text, x + padding, y + 18)
}

// 加载并绘制 Logo 图片
async function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, height: number): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // 计算宽度，保持比例
      const aspectRatio = img.width / img.height
      const width = height * aspectRatio
      ctx.drawImage(img, x, y, width, height)
      resolve()
    }
    img.onerror = () => {
      // 加载失败时绘制备用图标
      drawFallbackLogo(ctx, x, y, height)
      resolve()
    }
    img.src = logoImage
  })
}

// 备用 Logo（加载失败时使用）
function drawFallbackLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // 绘制一个简化的乌龟形状
  ctx.save()
  ctx.translate(x, y)

  // 龟壳（椭圆形）
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.ellipse(size / 2, size / 2, size / 2, size / 2.5, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

// 生成分享图片
export async function generateShareImage(analysis: NewsAnalysis, newsTitle: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  // 设置画布尺寸
  const width = 750
  let height = 1400 // 初始高度，会根据内容调整
  canvas.width = width
  canvas.height = height

  const padding = 40
  const contentWidth = width - padding * 2

  // 背景
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, width, height)

  // 绘制头部背景
  const headerHeight = 160
  const gradient = ctx.createLinearGradient(0, 0, width, headerHeight)
  gradient.addColorStop(0, COLORS.primary)
  gradient.addColorStop(1, COLORS.primaryDark)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, headerHeight)

  // 绘制 Logo（异步加载图片）
  const logoHeight = 50
  await drawLogo(ctx, padding, 35, logoHeight)

  // 品牌名称（Logo 后面留出间距）
  const logoWidth = logoHeight * 1.5 // 假设 Logo 宽高比为 1.5
  const textStartX = padding + logoWidth + 20

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText(BRAND.name, textStartX, 58)

  ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillText(BRAND.tagline, textStartX, 82)

  // 当前Y位置
  let currentY = headerHeight + 30

  // 新闻标题卡片
  ctx.fillStyle = COLORS.cardBg
  roundRect(ctx, padding, currentY, contentWidth, 80, 12)
  ctx.fill()

  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif'
  const titleMaxWidth = contentWidth - 40
  currentY += 30
  currentY = wrapText(ctx, newsTitle, padding + 20, currentY, titleMaxWidth, 26) + 10

  currentY += 20

  // 核心摘要
  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('📌 核心摘要', padding, currentY)
  currentY += 30

  ctx.fillStyle = COLORS.textMuted
  ctx.font = '15px -apple-system, BlinkMacSystemFont, sans-serif'
  currentY = wrapText(ctx, analysis.summary || '暂无摘要', padding, currentY, contentWidth, 24)
  currentY += 20

  // 涉及标的/行业
  if (analysis.entities && analysis.entities.length > 0) {
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('🏷️ 涉及标的/行业', padding, currentY)
    currentY += 30

    let tagX = padding
    const tagSpacing = 12
    analysis.entities.forEach((entity) => {
      const tagText = entity
      const tagWidth = ctx.measureText(tagText).width + 24
      if (tagX + tagWidth > width - padding) {
        tagX = padding
        currentY += 38
      }
      drawTag(ctx, tagText, tagX, currentY, '#e0f2fe', COLORS.primary)
      tagX += tagWidth + tagSpacing
    })
    currentY += 50
  }

  // 影响分析
  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('📊 影响分析', padding, currentY)
  currentY += 25

  const analysisData = analysis.analysis
  const cardWidth = (contentWidth - 20) / 2
  const cardHeight = 120

  // 基本面影响卡片
  const fundamental = analysisData?.fundamental_impact
  ctx.fillStyle = COLORS.cardBg
  roundRect(ctx, padding, currentY, cardWidth, cardHeight, 12)
  ctx.fill()
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('基本面影响', padding + 15, currentY + 28)

  const fundamentalDir = fundamental?.direction || 'NEUTRAL'
  const fundamentalColor = fundamentalDir === 'POSITIVE' ? COLORS.up : fundamentalDir === 'NEGATIVE' ? COLORS.down : COLORS.textMuted
  drawTag(ctx, directionLabels[fundamentalDir] || '中性', padding + 15, currentY + 40, fundamentalColor + '20', fundamentalColor)

  ctx.fillStyle = COLORS.textMuted
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText(`程度: ${levelLabels[fundamental?.level || 'MEDIUM']}`, padding + 100, currentY + 58)

  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
  const reasoning1 = fundamental?.reasoning || '暂无分析'
  wrapText(ctx, reasoning1.substring(0, 50) + (reasoning1.length > 50 ? '...' : ''), padding + 15, currentY + 85, cardWidth - 30, 16)

  // 情绪影响卡片
  const sentiment = analysisData?.sentiment_impact
  ctx.fillStyle = COLORS.cardBg
  roundRect(ctx, padding + cardWidth + 20, currentY, cardWidth, cardHeight, 12)
  ctx.fill()
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('情绪影响', padding + cardWidth + 35, currentY + 28)

  const sentimentDir = sentiment?.direction || 'NEUTRAL'
  const sentimentColor = sentimentDir === 'POSITIVE' ? COLORS.up : sentimentDir === 'NEGATIVE' ? COLORS.down : COLORS.textMuted
  drawTag(ctx, directionLabels[sentimentDir] || '中性', padding + cardWidth + 35, currentY + 40, sentimentColor + '20', sentimentColor)

  ctx.fillStyle = COLORS.textMuted
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText(`程度: ${levelLabels[sentiment?.level || 'MEDIUM']}`, padding + cardWidth + 120, currentY + 58)

  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
  const reasoning2 = sentiment?.reasoning || '暂无分析'
  wrapText(ctx, reasoning2.substring(0, 50) + (reasoning2.length > 50 ? '...' : ''), padding + cardWidth + 35, currentY + 85, cardWidth - 30, 16)

  currentY += cardHeight + 25

  // 预期差
  if (analysisData?.expectation_gap) {
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('📈 预期差', padding, currentY)
    currentY += 28

    const expectationColor = analysisData.expectation_gap === 'SUPERIOR' ? COLORS.up :
      analysisData.expectation_gap === 'INFERIOR' ? COLORS.down : COLORS.textMuted
    drawTag(ctx, expectationLabels[analysisData.expectation_gap] || '未知', padding, currentY, expectationColor + '20', expectationColor)
    currentY += 45
  }

  // 结论
  const conclusion = analysis.conclusion
  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('💡 结论', padding, currentY)
  currentY += 30

  // 综合判断行
  const overallSentiment = conclusion?.overall_sentiment || 'NEUTRAL'
  const overallColor = overallSentiment === 'BULLISH' ? COLORS.up : overallSentiment === 'BEARISH' ? COLORS.down : COLORS.textMuted

  ctx.fillStyle = COLORS.cardBg
  roundRect(ctx, padding, currentY, contentWidth, 50, 12)
  ctx.fill()

  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillStyle = COLORS.textMuted
  ctx.fillText('综合判断:', padding + 15, currentY + 30)

  ctx.fillStyle = overallColor
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
  const sentimentText = sentimentLabels[overallSentiment] || '中性'
  const sentimentEmoji = overallSentiment === 'BULLISH' ? '📈' : overallSentiment === 'BEARISH' ? '📉' : '➡️'
  ctx.fillText(`${sentimentEmoji} ${sentimentText}`, padding + 100, currentY + 30)

  ctx.fillStyle = COLORS.textMuted
  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('|', padding + 200, currentY + 30)
  ctx.fillText(`影响: ${levelLabels[conclusion?.overall_impact_level || 'MEDIUM']}`, padding + 220, currentY + 30)
  ctx.fillText('|', padding + 320, currentY + 30)
  ctx.fillText(`${timeHorizonLabels[conclusion?.time_horizon || 'MEDIUM_TERM']}`, padding + 340, currentY + 30)

  currentY += 70

  // 操作建议
  if (conclusion?.strategy_suggestion) {
    ctx.fillStyle = '#eff6ff'
    roundRect(ctx, padding, currentY, contentWidth, 80, 12)
    ctx.fill()

    ctx.fillStyle = COLORS.primary
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('💡 操作建议', padding + 15, currentY + 25)

    ctx.fillStyle = COLORS.text
    ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif'
    wrapText(ctx, conclusion.strategy_suggestion, padding + 15, currentY + 48, contentWidth - 30, 20)

    currentY += 100
  }

  // 风险因素
  if (conclusion?.risk_factors && conclusion.risk_factors.length > 0) {
    ctx.fillStyle = '#fef2f2'
    roundRect(ctx, padding, currentY, contentWidth, 40 + conclusion.risk_factors.length * 22, 12)
    ctx.fill()

    ctx.fillStyle = COLORS.down
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('⚠️ 风险因素', padding + 15, currentY + 25)

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
    conclusion.risk_factors.forEach((risk, index) => {
      ctx.fillText(`• ${risk}`, padding + 15, currentY + 50 + index * 22)
    })

    currentY += 60 + conclusion.risk_factors.length * 22
  }

  // 底部品牌区域
  currentY += 30
  const footerHeight = 100

  ctx.fillStyle = COLORS.cardBg
  roundRect(ctx, padding, currentY, contentWidth, footerHeight, 12)
  ctx.fill()

  // 底部 Logo
  await drawLogo(ctx, width / 2 - 30, currentY + 15, 40)

  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(BRAND.name, width / 2, currentY + 70)

  ctx.fillStyle = COLORS.textMuted
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText(BRAND.slogan, width / 2, currentY + 88)
  ctx.textAlign = 'left'

  // 调整画布高度
  const finalHeight = currentY + footerHeight + 30
  if (finalHeight !== height) {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = finalHeight
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.drawImage(canvas, 0, 0)
    canvas.width = width
    canvas.height = finalHeight
    ctx.drawImage(tempCanvas, 0, 0)
  }

  // 转换为 Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('生成图片失败'))
      }
    }, 'image/png')
  })
}

// 下载图片
export function downloadImage(blob: Blob, filename: string = 'ai-analysis.png') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 复制图片到剪贴板
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    return true
  } catch (err) {
    console.error('复制到剪贴板失败:', err)
    return false
  }
}

// 系统分享（移动端）
export async function shareImage(blob: Blob, title: string = 'AI智能解读'): Promise<boolean> {
  if (!navigator.share) {
    return false
  }

  try {
    const file = new File([blob], 'ai-analysis.png', { type: 'image/png' })
    await navigator.share({
      title,
      files: [file]
    })
    return true
  } catch (err) {
    console.error('分享失败:', err)
    return false
  }
}
