/**
 * Module-level cache shared by `useSecurityScan` (drawer) and `useAutoScan`
 * (queue). Both writers compute results for the same `scanKey(address, chainId)`;
 * the cache keeps the most recent write so consumers see the freshest data.
 *
 * The Map is intentionally private — consumers go through `getCachedScan` /
 * `setCachedScan` so the map can't be mutated by reference from outside.
 */
import type { ScanResult, ScannerId } from './scanners/types'

const CACHE_TTL_MS = 3_600_000
const MAX_CACHE_SIZE = 50

type CacheEntry = {
  results: Partial<Record<ScannerId, ScanResult>>
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

const evictOldest = (): void => {
  if (cache.size <= MAX_CACHE_SIZE) return
  let oldestKey: string | null = null
  let oldestTs = Infinity
  for (const [k, v] of cache) {
    if (v.timestamp < oldestTs) {
      oldestTs = v.timestamp
      oldestKey = k
    }
  }
  if (oldestKey) cache.delete(oldestKey)
}

/** Returns the cached entry if it exists and is still within TTL, else null. */
export const getCachedScan = (key: string): CacheEntry | null => {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp >= CACHE_TTL_MS) return null
  return entry
}

/**
 * Writes a result. Concurrent scans for the same key can race; we prefer the
 * newer timestamp so a slow-completing scan never overwrites a faster, fresher one.
 */
export const setCachedScan = (
  key: string,
  results: Partial<Record<ScannerId, ScanResult>>,
  timestamp: number,
): void => {
  const existing = cache.get(key)
  if (existing && existing.timestamp >= timestamp) return
  cache.set(key, { results, timestamp })
  evictOldest()
}

/** Test-only escape hatch — clears the entire cache. */
export const clearScanCache = (): void => {
  cache.clear()
}

export { CACHE_TTL_MS, MAX_CACHE_SIZE }
