export interface ScanProgress {
  total_items: number;
  processed_items: number;
  percent_complete: number;
  current_item: string;
  unwatched_found: number;
}

export interface ScanStatus {
  scan_in_progress: boolean;
  scan_complete: boolean;
  progress: ScanProgress;
  results?: {
    total_count: number;
    total_size: number;
  };
}

export interface ScanSettings {
  days_threshold: number;
  ignore_newer_than_days: number;
  concurrent_limit: number;
  batch_size: number;
}
