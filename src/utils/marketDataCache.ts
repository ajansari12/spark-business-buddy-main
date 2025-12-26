// ============================================================================
// MARKET DATA CACHING
// Caches expensive API calls for competitors, market validation, and trending
// ============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export interface CacheConfig {
  // Default TTL in seconds
  defaultTTL: number;
  // Specific TTLs by cache type
  ttlByType: Record<CacheType, number>;
  // Max entries per type (LRU eviction)
  maxEntries: number;
  // Whether to use Supabase for persistence
  persistToDatabase: boolean;
}

export type CacheType =
  | "competitors"
  | "market_validation"
  | "trending_businesses"
  | "grants"
  | "ai_response";

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 3600, // 1 hour default
  ttlByType: {
    competitors: 86400, // 24 hours - competitors don't change often
    market_validation: 43200, // 12 hours
    trending_businesses: 3600, // 1 hour - more dynamic
    grants: 604800, // 7 days - grants are stable
    ai_response: 300, // 5 minutes - for deduping rapid requests
  },
  maxEntries: 1000,
  persistToDatabase: true,
};

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

export function generateCacheKey(
  type: CacheType,
  params: Record<string, unknown>
): string {
  // Sort keys for consistent hashing
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${JSON.stringify(params[key])}`)
    .join("|");

  return `${type}::${sortedParams}`;
}

// ============================================================================
// IN-MEMORY CACHE (for edge functions)
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
  hitCount: number;
}

class InMemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hitCount++;
    return entry.data;
  }

  set(key: string, data: T, ttlSeconds: number): void {
    // LRU eviction if at capacity
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
      hitCount: 0,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictLRU(): void {
    // Find entry with lowest hit count and oldest access
    let oldestKey: string | null = null;
    let lowestScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score based on recency and hit count
      const age = Date.now() - entry.createdAt;
      const score = entry.hitCount / (age / 1000);

      if (score < lowestScore) {
        lowestScore = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Cleanup expired entries
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  stats(): { size: number; hitRate: number } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount;
    }

    return {
      size: this.cache.size,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
    };
  }
}

// Global cache instance
const memoryCache = new InMemoryCache(DEFAULT_CONFIG.maxEntries);

// ============================================================================
// DATABASE CACHE (for persistence across function instances)
// ============================================================================

interface DbCacheEntry {
  cache_key: string;
  cache_type: CacheType;
  data: unknown;
  expires_at: string;
  created_at: string;
  hit_count: number;
  metadata?: Record<string, unknown>;
}

async function getFromDbCache<T>(
  supabase: SupabaseClient,
  key: string
): Promise<T | null> {
  const { data, error } = await supabase
    .from("ft_cache")
    .select("data, expires_at, hit_count")
    .eq("cache_key", key)
    .single();

  if (error || !data) {
    return null;
  }

  // Check expiration
  if (new Date(data.expires_at) < new Date()) {
    // Delete expired entry
    await supabase.from("ft_cache").delete().eq("cache_key", key);
    return null;
  }

  // Update hit count (fire and forget)
  supabase
    .from("ft_cache")
    .update({ hit_count: (data.hit_count || 0) + 1 })
    .eq("cache_key", key);

  return data.data as T;
}

async function setInDbCache<T>(
  supabase: SupabaseClient,
  key: string,
  type: CacheType,
  data: T,
  ttlSeconds: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  await supabase.from("ft_cache").upsert({
    cache_key: key,
    cache_type: type,
    data,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
    hit_count: 0,
    metadata,
  });
}

async function deleteFromDbCache(
  supabase: SupabaseClient,
  key: string
): Promise<void> {
  await supabase.from("ft_cache").delete().eq("cache_key", key);
}

// ============================================================================
// UNIFIED CACHE API
// ============================================================================

export interface CacheOptions {
  ttl?: number;
  skipMemory?: boolean;
  skipDatabase?: boolean;
  metadata?: Record<string, unknown>;
}

export class MarketDataCache {
  private supabase: SupabaseClient | null;
  private config: CacheConfig;

  constructor(supabase?: SupabaseClient, config?: Partial<CacheConfig>) {
    this.supabase = supabase || null;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async get<T>(
    type: CacheType,
    params: Record<string, unknown>,
    options?: CacheOptions
  ): Promise<T | null> {
    const key = generateCacheKey(type, params);

    // Try memory cache first
    if (!options?.skipMemory) {
      const memoryResult = memoryCache.get(key) as T | null;
      if (memoryResult !== null) {
        return memoryResult;
      }
    }

    // Try database cache
    if (this.supabase && this.config.persistToDatabase && !options?.skipDatabase) {
      const dbResult = await getFromDbCache<T>(this.supabase, key);
      if (dbResult !== null) {
        // Populate memory cache
        const ttl = options?.ttl || this.config.ttlByType[type] || this.config.defaultTTL;
        memoryCache.set(key, dbResult, ttl);
        return dbResult;
      }
    }

    return null;
  }

  async set<T>(
    type: CacheType,
    params: Record<string, unknown>,
    data: T,
    options?: CacheOptions
  ): Promise<void> {
    const key = generateCacheKey(type, params);
    const ttl = options?.ttl || this.config.ttlByType[type] || this.config.defaultTTL;

    // Set in memory cache
    if (!options?.skipMemory) {
      memoryCache.set(key, data, ttl);
    }

    // Set in database cache
    if (this.supabase && this.config.persistToDatabase && !options?.skipDatabase) {
      await setInDbCache(this.supabase, key, type, data, ttl, options?.metadata);
    }
  }

  async invalidate(
    type: CacheType,
    params: Record<string, unknown>
  ): Promise<void> {
    const key = generateCacheKey(type, params);

    memoryCache.delete(key);

    if (this.supabase && this.config.persistToDatabase) {
      await deleteFromDbCache(this.supabase, key);
    }
  }

  async invalidateByType(type: CacheType): Promise<void> {
    // For memory cache, we'd need to iterate - skip for simplicity
    // For database, we can use the type index
    if (this.supabase && this.config.persistToDatabase) {
      await this.supabase.from("ft_cache").delete().eq("cache_type", type);
    }
  }

  getStats(): { memory: { size: number; hitRate: number } } {
    return {
      memory: memoryCache.stats(),
    };
  }

  cleanup(): number {
    return memoryCache.cleanup();
  }
}

// ============================================================================
// CACHED FETCH WRAPPER
// ============================================================================

export interface CachedFetchOptions extends CacheOptions {
  type: CacheType;
  params: Record<string, unknown>;
}

export async function cachedFetch<T>(
  cache: MarketDataCache,
  fetchFn: () => Promise<T>,
  options: CachedFetchOptions
): Promise<T> {
  // Try cache first
  const cached = await cache.get<T>(options.type, options.params, options);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache the result
  await cache.set(options.type, options.params, data, options);

  return data;
}

// ============================================================================
// SPECIFIC CACHE HELPERS
// ============================================================================

export async function getCachedCompetitors(
  cache: MarketDataCache,
  businessType: string,
  city: string,
  province: string,
  fetchFn: () => Promise<unknown>
): Promise<unknown> {
  return cachedFetch(cache, fetchFn, {
    type: "competitors",
    params: { businessType, city, province },
  });
}

export async function getCachedMarketValidation(
  cache: MarketDataCache,
  businessType: string,
  city: string,
  province: string,
  fetchFn: () => Promise<unknown>
): Promise<unknown> {
  return cachedFetch(cache, fetchFn, {
    type: "market_validation",
    params: { businessType, city, province },
  });
}

export async function getCachedTrendingBusinesses(
  cache: MarketDataCache,
  province: string,
  city: string | undefined,
  budgetRange: { min: number; max: number },
  fetchFn: () => Promise<unknown>
): Promise<unknown> {
  return cachedFetch(cache, fetchFn, {
    type: "trending_businesses",
    params: { province, city, budgetMin: budgetRange.min, budgetMax: budgetRange.max },
    ttl: 3600, // 1 hour for trending
  });
}

export async function getCachedGrants(
  cache: MarketDataCache,
  province: string,
  eligibilityCriteria: Record<string, unknown>,
  fetchFn: () => Promise<unknown>
): Promise<unknown> {
  return cachedFetch(cache, fetchFn, {
    type: "grants",
    params: { province, ...eligibilityCriteria },
    ttl: 604800, // 7 days for grants
  });
}

// ============================================================================
// DATABASE MIGRATION
// ============================================================================

export const CACHE_TABLE_MIGRATION = `
-- Create cache table
CREATE TABLE IF NOT EXISTS public.ft_cache (
  cache_key TEXT PRIMARY KEY,
  cache_type TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB
);

-- Index for type-based queries
CREATE INDEX IF NOT EXISTS idx_ft_cache_type ON public.ft_cache(cache_type);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_ft_cache_expires ON public.ft_cache(expires_at);

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ft_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily)
-- Note: You'll need pg_cron extension or use Supabase cron jobs
`;

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let cacheInstance: MarketDataCache | null = null;

export function getCache(supabase?: SupabaseClient): MarketDataCache {
  if (!cacheInstance) {
    cacheInstance = new MarketDataCache(supabase);
  }
  return cacheInstance;
}
