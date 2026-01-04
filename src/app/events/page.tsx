'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  Info,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Expand,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRelativeTime, formatDateTime } from '@/lib/utils/formatters';
import {
  getEventsList,
  getUniqueComponents,
  clearAllEvents,
  type EventsListResult,
} from '@/lib/actions/events';
import type { EventLevel, EventData } from '@/lib/services/events-service';

const LEVEL_CONFIG: Record<
  EventLevel,
  {
    icon: React.ReactNode;
    variant: 'default' | 'secondary' | 'destructive';
    label: string;
  }
> = {
  info: {
    icon: <Info className='h-3 w-3' />,
    variant: 'default',
    label: 'Info',
  },
  warning: {
    icon: <AlertTriangle className='h-3 w-3' />,
    variant: 'secondary',
    label: 'Warning',
  },
  error: {
    icon: <XCircle className='h-3 w-3' />,
    variant: 'destructive',
    label: 'Error',
  },
};

function LevelBadge({ level }: { level: string }) {
  const config = LEVEL_CONFIG[level as EventLevel] || LEVEL_CONFIG.info;
  return (
    <Badge variant={config.variant} className='gap-1'>
      {config.icon}
      {config.label}
    </Badge>
  );
}

function ComponentBadge({ component }: { component: string }) {
  return (
    <Badge variant='outline' className='font-mono text-xs'>
      {component}
    </Badge>
  );
}

interface EventMessageCellProps {
  event: EventData;
  onOpenDetails: (event: EventData) => void;
}

function EventMessageCell({ event, onOpenDetails }: EventMessageCellProps) {
  const isLongMessage = event.message.length > 60;

  if (!isLongMessage) {
    return <span>{event.message}</span>;
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          onClick={() => onOpenDetails(event)}
          className='flex items-center gap-2 text-left w-full group cursor-pointer'
        >
          <span className='truncate flex-1'>{event.message}</span>
          <Expand className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0' />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align='start' className='w-96 max-w-[90vw]'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <LevelBadge level={event.level} />
            <ComponentBadge component={event.component} />
          </div>
          <p className='text-sm whitespace-pre-wrap break-words'>
            {event.message}
          </p>
          <p className='text-xs text-muted-foreground'>
            {formatDateTime(event.timestamp)}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

interface EventDetailDialogProps {
  event: EventData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EventDetailDialog({
  event,
  open,
  onOpenChange,
}: EventDetailDialogProps) {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ScrollText className='h-5 w-5' />
            Event Details
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <LevelBadge level={event.level} />
            <ComponentBadge component={event.component} />
            <span className='text-sm text-muted-foreground'>
              {formatDateTime(event.timestamp)}
            </span>
          </div>
          <div className='rounded-md border bg-muted/30 p-4'>
            <p className='text-sm whitespace-pre-wrap break-words font-mono'>
              {event.message}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EventsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [component, setComponent] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleOpenEventDetails = useCallback((event: EventData) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      component: component || undefined,
      level: (level as EventLevel) || undefined,
    }),
    [debouncedSearch, component, level]
  );

  const {
    data: eventsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<EventsListResult>({
    queryKey: ['events', page, filters],
    queryFn: () => getEventsList(page, filters),
    staleTime: 30 * 1000,
  });

  const { data: components = [] } = useQuery<string[]>({
    queryKey: ['event-components'],
    queryFn: getUniqueComponents,
    staleTime: 60 * 1000,
  });

  const handleClearEvents = useCallback(async () => {
    const result = await clearAllEvents();
    if (result.success) {
      toast.success(`Cleared ${result.count} events`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-components'] });
      setPage(1);
    } else {
      toast.error('Failed to clear events');
    }
  }, [queryClient]);

  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['event-components'] });
  }, [refetch, queryClient]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleComponentChange = useCallback((value: string) => {
    setComponent(value === 'all' ? '' : value);
    setPage(1);
  }, []);

  const handleLevelChange = useCallback((value: string) => {
    setLevel(value === 'all' ? '' : value);
    setPage(1);
  }, []);

  const events = eventsData?.events || [];
  const totalPages = eventsData?.totalPages || 0;
  const totalCount = eventsData?.totalCount || 0;

  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <CardTitle className='flex items-center space-x-2'>
              <ScrollText className='h-5 w-5' />
              <span>Events Log</span>
              {totalCount > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  {totalCount.toLocaleString()} events
                </Badge>
              )}
            </CardTitle>

            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative flex-1 min-w-[200px] md:flex-none'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search events...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='h-9 pl-8 md:w-[250px]'
                />
              </div>

              <Select
                value={component || 'all'}
                onValueChange={handleComponentChange}
              >
                <SelectTrigger className='h-9 w-[150px]'>
                  <SelectValue placeholder='Component' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Components</SelectItem>
                  {components.map((comp) => (
                    <SelectItem key={comp} value={comp}>
                      {comp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={level || 'all'} onValueChange={handleLevelChange}>
                <SelectTrigger className='h-9 w-[120px]'>
                  <SelectValue placeholder='Level' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Levels</SelectItem>
                  <SelectItem value='info'>Info</SelectItem>
                  <SelectItem value='warning'>Warning</SelectItem>
                  <SelectItem value='error'>Error</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='destructive'
                    size='sm'
                    disabled={totalCount === 0}
                  >
                    <Trash2 className='h-4 w-4 mr-1' />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Events?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all{' '}
                      {totalCount.toLocaleString()} events. This action cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearEvents}>
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[180px]'>Timestamp</TableHead>
                  <TableHead className='w-[100px]'>Level</TableHead>
                  <TableHead className='w-[150px]'>Component</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-32 text-center'>
                      <div className='flex items-center justify-center'>
                        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className='h-32 text-center text-muted-foreground'
                    >
                      {debouncedSearch || component || level
                        ? 'No events match your filters'
                        : 'No events logged yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className='font-mono text-xs text-muted-foreground'>
                        <div title={formatDateTime(event.timestamp)}>
                          {formatRelativeTime(event.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <LevelBadge level={event.level} />
                      </TableCell>
                      <TableCell>
                        <ComponentBadge component={event.component} />
                      </TableCell>
                      <TableCell className='max-w-[400px]'>
                        <EventMessageCell
                          event={event}
                          onOpenDetails={handleOpenEventDetails}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4'>
              <div className='text-sm text-muted-foreground'>
                Page {page} of {totalPages}
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || isFetching}
                >
                  <ChevronLeft className='h-4 w-4' />
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || isFetching}
                >
                  Next
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EventDetailDialog
        event={selectedEvent}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </AppLayout>
  );
}
