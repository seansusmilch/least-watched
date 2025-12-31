export type AlertSeverity = 'error' | 'warning';

export type AlertType = 'connection_failure' | 'low_disk_space';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  service?: string;
  path?: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  checkedAt: string;
}
