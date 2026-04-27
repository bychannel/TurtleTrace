import { api } from '../lib/apiClient'

/**
 * 检查是否已完成欢迎向导
 */
export async function isWelcomeCompleted(): Promise<boolean> {
  try {
    const data = await api.get<{ completed: boolean }>('/settings/welcome')
    return data.completed
  } catch {
    return false
  }
}

/**
 * 标记欢迎向导已完成
 */
export async function markWelcomeCompleted(): Promise<void> {
  await api.put('/settings/welcome', { completed: true })
}

/**
 * 重置欢迎向导状态（用于测试或设置中重新触发）
 */
export async function resetWelcomeStatus(): Promise<void> {
  await api.put('/settings/welcome', { completed: false })
}