import { PrefetchCacheEntry } from './router-reducer-types'

const FIVE_MINUTES = 5 * 60 * 1000
const THIRTY_SECONDS = 5 * 1000

export enum PrefetchCacheEntryStatus {
  'reusable',
  'expired',
  'stale',
}

export function getPrefetchEntryCacheStatus({
  kind,
  prefetchTime,
  lastUsedTime,
}: PrefetchCacheEntry): PrefetchCacheEntryStatus {
  // if the cache entry was prefetched or read less than 30s ago, then we want to re-use it
  if (Date.now() < (lastUsedTime ?? prefetchTime) + THIRTY_SECONDS) {
    return PrefetchCacheEntryStatus.reusable
  }

  // if the cache entry was prefetched less than 5 mins ago, then we want to re-use only the loading state
  if (kind === 'auto') {
    if (Date.now() < prefetchTime + FIVE_MINUTES) {
      return PrefetchCacheEntryStatus.stale
    }
  }

  // if the cache entry was prefetched less than 5 mins ago and was a "full" prefetch, then we want to re-use it "full
  if (kind === 'full') {
    if (Date.now() < prefetchTime + FIVE_MINUTES) {
      return PrefetchCacheEntryStatus.reusable
    }
  }

  return PrefetchCacheEntryStatus.expired
}
