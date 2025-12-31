'use server';

import { alertsService } from '@/lib/services/alerts-service';
import type { AlertsResponse } from '@/lib/types/alerts';

export async function getAlerts(): Promise<AlertsResponse> {
  const alerts = await alertsService.getAllAlerts();

  return {
    alerts,
    checkedAt: new Date().toISOString(),
  };
}
