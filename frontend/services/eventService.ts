// src/services/eventService.ts

import type { MarketEvent, EventFilter, RepeatRule } from '../types/event';
import { format, addDays, addWeeks, addMonths, addYears, isBefore, isAfter, parseISO } from 'date-fns';
import { api } from '../lib/apiClient';

/**
 * 消息事件服务
 */
class EventService {
  // ==================== 事件 CRUD ====================

  /** 获取所有事件 */
  async getAllEvents(): Promise<MarketEvent[]> {
    try {
      return await api.get<MarketEvent[]>('/events');
    } catch (error) {
      console.error('获取事件列表失败:', error);
      return [];
    }
  }

  /** 获取单个事件 */
  async getEvent(id: string): Promise<MarketEvent | null> {
    try {
      return await api.get<MarketEvent>(`/events/${id}`);
    } catch {
      return null;
    }
  }

  /** 保存事件 */
  async saveEvent(event: MarketEvent): Promise<boolean> {
    try {
      if (event.id) {
        await api.put(`/events/${event.id}`, event);
      } else {
        await api.post('/events', event);
      }
      return true;
    } catch (error) {
      console.error('保存事件失败:', error);
      return false;
    }
  }

  /** 删除事件 */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      await api.delete(`/events/${id}`);
      return true;
    } catch (error) {
      console.error('删除事件失败:', error);
      return false;
    }
  }

  // ==================== 查询方法 ====================

  /** 按日期获取事件 */
  async getEventsByDate(date: string): Promise<MarketEvent[]> {
    const events = await this.getAllEvents();
    return events.filter(e => e.date === date);
  }

  /** 按日期范围获取事件 */
  async getEventsByRange(startDate: string, endDate: string): Promise<MarketEvent[]> {
    try {
      return await api.get<MarketEvent[]>(`/events?startDate=${startDate}&endDate=${endDate}`);
    } catch {
      return [];
    }
  }

  /** 按筛选条件获取事件 */
  async getEventsByFilter(filter: EventFilter): Promise<MarketEvent[]> {
    const params = new URLSearchParams();
    if (filter.eventType?.length) params.append('eventType', filter.eventType.join(','));
    if (filter.importance?.length) params.append('importance', filter.importance.join(','));
    if (filter.status?.length) params.append('status', filter.status.join(','));
    if (filter.tags?.length) params.append('tags', filter.tags.join(','));
    if (filter.dateRange) {
      params.append('startDate', filter.dateRange.start);
      params.append('endDate', filter.dateRange.end);
    }
    if (filter.search) params.append('search', filter.search);

    try {
      return await api.get<MarketEvent[]>(`/events?${params.toString()}`);
    } catch {
      return [];
    }
  }

  /** 获取即将到来的事件 */
  async getUpcomingEvents(days: number = 7): Promise<MarketEvent[]> {
    try {
      return await api.get<MarketEvent[]>(`/events/upcoming/${days}`);
    } catch {
      return [];
    }
  }

  // ==================== 重复事件处理 ====================

  /** 生成重复事件实例 */
  generateRepeatInstances(rule: RepeatRule, startDate: string, untilDate: string): string[] {
    const dates: string[] = [];
    let currentDate = parseISO(startDate);
    const end = parseISO(untilDate);
    let count = 0;

    while (isBefore(currentDate, end) || currentDate.getTime() === end.getTime()) {
      if (rule.endDate && isAfter(currentDate, parseISO(rule.endDate))) {
        break;
      }

      if (rule.count && count >= rule.count) {
        break;
      }

      dates.push(format(currentDate, 'yyyy-MM-dd'));
      count++;

      switch (rule.type) {
        case 'daily':
          currentDate = addDays(currentDate, rule.interval);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, rule.interval);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, rule.interval);
          break;
        case 'yearly':
          currentDate = addYears(currentDate, rule.interval);
          break;
        case 'custom':
          if (rule.weekdays && rule.weekdays.length > 0) {
            currentDate = addDays(currentDate, 1);
            while (!rule.weekdays.includes(currentDate.getDay())) {
              currentDate = addDays(currentDate, 1);
            }
          } else if (rule.monthDay) {
            currentDate = addMonths(currentDate, 1);
          }
          break;
        default:
          return dates;
      }
    }

    return dates;
  }

  // ==================== 工具方法 ====================

  /** 创建新事件 */
  createEvent(data: Partial<MarketEvent>): MarketEvent {
    const now = Date.now();
    return {
      ...data,
      id: `event_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name || '',
      date: data.date || format(new Date(), 'yyyy-MM-dd'),
      eventType: data.eventType || 'fixed',
      importance: data.importance || 'medium',
      status: data.status || 'pending',
      tags: data.tags || [],
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
  }

  /** 更新事件状态 */
  async updateEventStatus(id: string, status: MarketEvent['status']): Promise<boolean> {
    const event = await this.getEvent(id);
    if (!event) return false;
    return this.saveEvent({ ...event, status });
  }

  // ==================== 导出功能 ====================

  /** 导出事件数据 */
  async exportEvents(): Promise<string> {
    const events = await this.getAllEvents();
    return JSON.stringify(events, null, 2);
  }

  /** 导入事件数据 */
  async importEvents(jsonData: string): Promise<boolean> {
    try {
      const events = JSON.parse(jsonData);
      if (!Array.isArray(events)) return false;

      for (const event of events) {
        if (event.id) {
          await api.put(`/events/${event.id}`, event);
        } else {
          await api.post('/events', event);
        }
      }
      return true;
    } catch (error) {
      console.error('导入事件失败:', error);
      return false;
    }
  }
}

// 单例导出
export const eventService = new EventService();
