import { prisma } from '@/lib/database';
import { Prisma } from '@/generated/prisma';
import { EVENTS_PAGE_SIZE, EVENTS_MAX_COUNT } from '@/lib/media-processor/constants';

export type EventLevel = 'info' | 'warning' | 'error';

export type EventComponent =
  | 'media-processor'
  | 'user-action'
  | 'sonarr-api'
  | 'radarr-api'
  | 'emby-api'
  | 'system';

export interface EventFilters {
  search?: string;
  component?: string;
  level?: EventLevel;
}

export interface PaginatedEventsOptions extends EventFilters {
  page?: number;
  pageSize?: number;
}

export interface EventData {
  id: string;
  timestamp: Date;
  level: string;
  component: string;
  message: string;
}

class EventsService {
  async logEvent(
    level: EventLevel,
    component: EventComponent | string,
    message: string
  ): Promise<EventData> {
    const event = await prisma.event.create({
      data: {
        level,
        component,
        message,
      },
    });

    this.pruneEventsIfNeeded().catch((error) => {
      console.error('Failed to prune events:', error);
    });

    return event;
  }

  async logInfo(component: EventComponent | string, message: string): Promise<EventData> {
    return this.logEvent('info', component, message);
  }

  async logWarning(component: EventComponent | string, message: string): Promise<EventData> {
    return this.logEvent('warning', component, message);
  }

  async logError(component: EventComponent | string, message: string): Promise<EventData> {
    return this.logEvent('error', component, message);
  }

  async getEvents(options: PaginatedEventsOptions = {}): Promise<EventData[]> {
    const { page = 1, pageSize = EVENTS_PAGE_SIZE, search, component, level } = options;
    const skip = (page - 1) * pageSize;

    const where = this.buildWhereClause({ search, component, level });

    return prisma.event.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: pageSize,
    });
  }

  async getEventCount(filters: EventFilters = {}): Promise<number> {
    const where = this.buildWhereClause(filters);
    return prisma.event.count({ where });
  }

  async getUniqueComponents(): Promise<string[]> {
    const results = await prisma.event.findMany({
      select: { component: true },
      distinct: ['component'],
      orderBy: { component: 'asc' },
    });
    return results.map((r) => r.component);
  }

  async clearEvents(): Promise<number> {
    const result = await prisma.event.deleteMany();
    return result.count;
  }

  async pruneEventsIfNeeded(): Promise<number> {
    const count = await prisma.event.count();

    if (count <= EVENTS_MAX_COUNT) {
      return 0;
    }

    const eventsToDelete = count - EVENTS_MAX_COUNT;

    const oldestEvents = await prisma.event.findMany({
      select: { id: true },
      orderBy: { timestamp: 'asc' },
      take: eventsToDelete,
    });

    const idsToDelete = oldestEvents.map((e) => e.id);

    const result = await prisma.event.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    return result.count;
  }

  private buildWhereClause(filters: EventFilters): Prisma.EventWhereInput | undefined {
    const { search, component, level } = filters;

    const conditions: Prisma.EventWhereInput[] = [];

    if (search) {
      conditions.push({
        OR: [
          { message: { contains: search } },
          { component: { contains: search } },
        ],
      });
    }

    if (component) {
      conditions.push({ component });
    }

    if (level) {
      conditions.push({ level });
    }

    if (conditions.length === 0) {
      return undefined;
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return { AND: conditions };
  }
}

export const eventsService = new EventsService();
