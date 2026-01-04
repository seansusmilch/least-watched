'use server';

import { eventsService, type EventLevel, type EventFilters } from '@/lib/services/events-service';
import { EVENTS_PAGE_SIZE } from '@/lib/media-processor/constants';
import { revalidatePath } from 'next/cache';

export interface EventsListResult {
  events: {
    id: string;
    timestamp: Date;
    level: string;
    component: string;
    message: string;
  }[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function getEventsList(
  page: number = 1,
  filters: EventFilters = {}
): Promise<EventsListResult> {
  try {
    const [events, totalCount] = await Promise.all([
      eventsService.getEvents({ page, pageSize: EVENTS_PAGE_SIZE, ...filters }),
      eventsService.getEventCount(filters),
    ]);

    return {
      events,
      totalCount,
      totalPages: Math.ceil(totalCount / EVENTS_PAGE_SIZE),
      currentPage: page,
      pageSize: EVENTS_PAGE_SIZE,
    };
  } catch (error) {
    console.error('Failed to get events list:', error);
    return {
      events: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      pageSize: EVENTS_PAGE_SIZE,
    };
  }
}

export async function getEventsCount(filters: EventFilters = {}): Promise<number> {
  try {
    return await eventsService.getEventCount(filters);
  } catch (error) {
    console.error('Failed to get events count:', error);
    return 0;
  }
}

export async function getUniqueComponents(): Promise<string[]> {
  try {
    return await eventsService.getUniqueComponents();
  } catch (error) {
    console.error('Failed to get unique components:', error);
    return [];
  }
}

export async function clearAllEvents(): Promise<{ success: boolean; count: number }> {
  try {
    const count = await eventsService.clearEvents();
    revalidatePath('/events');
    return { success: true, count };
  } catch (error) {
    console.error('Failed to clear events:', error);
    return { success: false, count: 0 };
  }
}

export async function logEvent(
  level: EventLevel,
  component: string,
  message: string
): Promise<boolean> {
  try {
    await eventsService.logEvent(level, component, message);
    return true;
  } catch (error) {
    console.error('Failed to log event:', error);
    return false;
  }
}
