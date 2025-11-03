// Simple in-memory cache for development
const cache = new Map<string, { value: any; expires: number }>();

export const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard:stats',
  FORMS_LIST: 'forms:list',
  FORM_DETAIL: 'form:detail',
  USER_STATS: 'user:stats',
} as const;

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
} as const;

export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  
  const value = await fn();
  cache.set(key, {
    value,
    expires: Date.now() + ttl * 1000,
  });
  
  return value;
}

export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

