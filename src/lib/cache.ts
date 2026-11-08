// src/lib/cache.ts
// ---------------------------------------------------------------------------
// Tiny in-memory TTL cache used by the sensor history API.
//
// The ESP posts every 2s, but dashboards only poll the history endpoints on
// user interaction (range/date change). Caching the last N minutes of
// aggregated results cuts DB round-trips dramatically and keeps the charts
// snappy under concurrent users.
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SimpleTTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlMs = 30_000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

// Shared cache instance for sensor history responses.
export const sensorCache = new SimpleTTLCache<unknown>(15_000);