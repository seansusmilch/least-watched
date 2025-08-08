import { appSettingsService } from '@/lib/database';

export interface KvItem {
  key: string;
  value: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface KvSettingsStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, description?: string): Promise<void>;
  getJson<T>(key: string): Promise<T | null>;
  setJson<T>(key: string, value: T, description?: string): Promise<void>;
  getBoolean(key: string, fallback?: boolean): Promise<boolean>;
  setBoolean(key: string, value: boolean, description?: string): Promise<void>;
  listByPrefix(prefix: string): Promise<KvItem[]>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
  listExcludingPrefixes(prefixes: string[]): Promise<KvItem[]>;
  batchUpsert(
    items: Array<{ key: string; value: string; description?: string }>
  ): Promise<void>;
}

export const kvSettingsStore: KvSettingsStore = {
  async get(key) {
    const setting = await appSettingsService.getByKey(key);
    return setting?.value ?? null;
  },

  async set(key, value, description) {
    await appSettingsService.setValue(key, value, description);
  },

  async getJson(key) {
    const value = await this.get(key);
    if (value == null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },

  async setJson(key, value, description) {
    await this.set(key, JSON.stringify(value), description);
  },

  async getBoolean(key, fallback = false) {
    const value = await this.get(key);
    if (value == null) return fallback;
    return value === 'true';
  },

  async setBoolean(key, value, description) {
    await this.set(key, value.toString(), description);
  },

  async listByPrefix(prefix) {
    const all = await appSettingsService.getAll();
    return all
      .filter((s) => s.key.startsWith(prefix))
      .map((s) => ({
        key: s.key,
        value: s.value,
        description: s.description ?? undefined,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
  },

  async delete(key) {
    await appSettingsService.delete(key);
  },

  async deleteByPrefix(prefix) {
    const all = await this.listByPrefix(prefix);
    await Promise.all(all.map((s) => this.delete(s.key)));
  },

  async listExcludingPrefixes(prefixes) {
    const all = await appSettingsService.getAll();
    return all
      .filter((s) => !prefixes.some((p) => s.key.startsWith(p)))
      .map((s) => ({
        key: s.key,
        value: s.value,
        description: s.description ?? undefined,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
  },

  async batchUpsert(items) {
    await Promise.all(
      items.map((i) =>
        appSettingsService.setValue(i.key, i.value, i.description)
      )
    );
  },
};
