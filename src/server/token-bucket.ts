type BucketEntry = {
  tokens: number;
  lastRefill: number;
  lastSeen: number;
};

export type TokenBucket = Readonly<{
  consume(key: string): boolean;
  size(): number;
}>;

export function createTokenBucket(options: Readonly<{
  capacity: number;
  refillWindowMs: number;
  maxEntries: number;
  now: () => number;
}>): TokenBucket {
  const entries = new Map<string, BucketEntry>();

  const evictOldest = (): void => {
    let oldestKey: string | undefined;
    let oldestSeen = Number.POSITIVE_INFINITY;
    for (const [key, entry] of entries) {
      if (entry.lastSeen < oldestSeen) {
        oldestSeen = entry.lastSeen;
        oldestKey = key;
      }
    }
    if (oldestKey !== undefined) entries.delete(oldestKey);
  };

  return {
    consume(key) {
      const now = options.now();
      let entry = entries.get(key);
      if (!entry) {
        if (entries.size >= options.maxEntries) evictOldest();
        entry = { tokens: options.capacity, lastRefill: now, lastSeen: now };
        entries.set(key, entry);
      }

      const elapsed = Math.max(0, now - entry.lastRefill);
      const refill = (elapsed / options.refillWindowMs) * options.capacity;
      entry.tokens = Math.min(options.capacity, entry.tokens + refill);
      entry.lastRefill = now;
      entry.lastSeen = now;
      if (entry.tokens < 1) return false;
      entry.tokens -= 1;
      return true;
    },
    size() {
      return entries.size;
    },
  };
}
