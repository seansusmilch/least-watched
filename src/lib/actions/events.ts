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
    try {
      await eventsService.logError(
        'system',
        `Failed to get events list: ${error instanceof Error ? error.message : String(error)}`
      );
    } catch {
      // Silently fail to prevent infinite loop if events service is down
    }
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
    try {
      await eventsService.logError(
        'system',
        `Failed to get events count: ${error instanceof Error ? error.message : String(error)}`
      );
    } catch {
      // Silently fail to prevent infinite loop if events service is down
    }
    return 0;
  }
}

export async function getUniqueComponents(): Promise<string[]> {
  try {
    return await eventsService.getUniqueComponents();
  } catch (error) {
    try {
      await eventsService.logError(
        'system',
        `Failed to get unique components: ${error instanceof Error ? error.message : String(error)}`
      );
    } catch {
      // Silently fail to prevent infinite loop if events service is down
    }
    return [];
  }
}

export async function clearAllEvents(): Promise<{ success: boolean; count: number }> {
  try {
    const count = await eventsService.clearEvents();
    revalidatePath('/events');
    return { success: true, count };
  } catch (error) {
    try {
      await eventsService.logError(
        'system',
        `Failed to clear events: ${error instanceof Error ? error.message : String(error)}`
      );
    } catch {
      // Silently fail to prevent infinite loop if events service is down
    }
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
    try {
      await eventsService.logError(
        'system',
        `Failed to log event: ${error instanceof Error ? error.message : String(error)}`
      );
    } catch {
      // Silently fail to prevent infinite loop if events service is down
    }
    return false;
  }
}
