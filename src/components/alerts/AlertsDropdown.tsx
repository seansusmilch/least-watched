'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAlerts } from '@/lib/actions/alerts';
import type { Alert } from '@/lib/types/alerts';
import { cn } from '@/lib/utils';

function AlertIcon({ severity }: { severity: Alert['severity'] }) {
  if (severity === 'error') {
    return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
  }
  return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
}

function AlertItem({ alert }: { alert: Alert }) {
  return (
    <div className="flex items-start gap-3 p-3 border-b last:border-b-0">
      <AlertIcon severity={alert.severity} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none mb-1">{alert.title}</p>
        <p className="text-xs text-muted-foreground break-words">
          {alert.message}
        </p>
      </div>
    </div>
  );
}

function AlertsList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
        <p className="text-sm font-medium">All systems operational</p>
        <p className="text-xs text-muted-foreground">No active alerts</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-80">
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} />
      ))}
    </ScrollArea>
  );
}

export function AlertsDropdown() {
  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlerts(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const alertCount = data?.alerts.length ?? 0;
  const hasAlerts = alertCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasAlerts && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center',
                'rounded-full bg-destructive text-[10px] font-medium text-white'
              )}
            >
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
          <span className="sr-only">
            {hasAlerts ? `${alertCount} alerts` : 'No alerts'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Alerts</h4>
          {data?.checkedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(data.checkedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <AlertsList alerts={data?.alerts ?? []} />
        )}
      </PopoverContent>
    </Popover>
  );
}
