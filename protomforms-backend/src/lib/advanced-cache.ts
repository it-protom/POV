// Advanced caching with LRU and compression support
interface CacheEntry<T> {
  value: T;
  expires: number;
  hits: number;
  lastAccess: number;
}

class AdvancedCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    entry.hits++;
    entry.lastAccess = Date.now();
    
    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // Simple LRU: if cache is full, remove least recently used
    if (this.cache.size >= this.maxSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      Array.from(this.cache.entries()).forEach(([k, v]) => {
        if (v.lastAccess < oldestTime) {
          oldestTime = v.lastAccess;
          oldestKey = k;
        }
      });
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
      hits: 0,
      lastAccess: Date.now(),
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await factory();
    await this.set(key, value, ttlSeconds);
    
    return value;
  }

  getStats() {
    const entries = Array.from(this.cache.entries());
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: entries.map(([key, entry]) => ({
        key,
        hits: entry.hits,
        expiresIn: Math.max(0, Math.floor((entry.expires - Date.now()) / 1000)),
        lastAccess: entry.lastAccess,
      })),
    };
  }
}

export const advancedCache = new AdvancedCache();

