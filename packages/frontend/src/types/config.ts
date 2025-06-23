export interface AppConfig {
  // API Settings
  emby_url: string;
  emby_token: string;
  sonarr_url: string;
  sonarr_api_key: string;
  radarr_url: string;
  radarr_api_key: string;

  // Scan Settings
  days_threshold: number;
  ignore_newer_than_days: number;
  concurrent_limit: number;
  batch_size: number;

  // Application Settings
  timezone: string;
}

export interface ConfigUpdateRequest {
  config: Partial<AppConfig>;
}
