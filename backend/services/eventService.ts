import redis from './redis';
import { MarketEvent, EventFilter } from '../types';

const EVENTS_KEY = 'turtletrace:events';

export async function getEvents(): Promise<MarketEvent[]> {
  const data = await redis.get(EVENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveEvents(events: MarketEvent[]): Promise<void> {
  await redis.set(EVENTS_KEY, JSON.stringify(events));
}

export async function getEventById(id: string): Promise<MarketEvent | null> {
  const events = await getEvents();
  return events.find(e => e.id === id) ?? null;
}

export async function getFilteredEvents(filter: EventFilter): Promise<MarketEvent[]> {
  let events = await getEvents();

  if (filter.eventType?.length) {
    events = events.filter(e => filter.eventType!.includes(e.eventType));
  }
  if (filter.importance?.length) {
    events = events.filter(e => filter.importance!.includes(e.importance));
  }
  if (filter.status?.length) {
    events = events.filter(e => filter.status!.includes(e.status));
  }
  if (filter.tags?.length) {
    events = events.filter(e => filter.tags!.some(t => e.tags.includes(t)));
  }
  if (filter.dateRange) {
    events = events.filter(e => e.date >= filter.dateRange!.start && e.date <= filter.dateRange!.end);
  }
  if (filter.search) {
    const search = filter.search.toLowerCase();
    events = events.filter(e => e.name.toLowerCase().includes(search) || e.tags.some(t => t.includes(search)));
  }

  return events;
}

export async function getUpcomingEvents(days: number): Promise<MarketEvent[]> {
  const events = await getEvents();
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);

  const todayStr = today.toISOString().split('T')[0];
  const futureStr = futureDate.toISOString().split('T')[0];

  return events.filter(e => e.date >= todayStr && e.date <= futureStr && e.status !== 'completed');
}

export async function createEvent(event: MarketEvent): Promise<MarketEvent> {
  const events = await getEvents();
  events.push({ ...event, createdAt: Date.now(), updatedAt: Date.now() });
  await saveEvents(events);
  return event;
}

export async function updateEvent(id: string, updates: Partial<MarketEvent>): Promise<MarketEvent> {
  const events = await getEvents();
  const index = events.findIndex(e => e.id === id);
  if (index === -1) throw new Error('Event not found');

  events[index] = { ...events[index], ...updates, updatedAt: Date.now() };
  await saveEvents(events);
  return events[index];
}

export async function deleteEvent(id: string): Promise<void> {
  const events = await getEvents();
  const index = events.findIndex(e => e.id === id);
  if (index === -1) throw new Error('Event not found');

  events.splice(index, 1);
  await saveEvents(events);
}
