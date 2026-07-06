/**
 * Simple in-memory cache for API responses.
 *
 * Each cache entry stores the data, a timestamp, and the in-flight promise
 * (to deduplicate concurrent requests for the same key).
 *
 * Usage:
 *   import { cachedGet, invalidateCache } from '../utils/cache';
 *   const data = await cachedGet('/rooms');            // cached 5 min
 *   const data = await cachedGet('/rooms', 0);         // skip cache
 *   invalidateCache('/rooms');                         // manual bust
 *   invalidateCache();                                 // bust everything
 */
import API from '../api';

const DEFAULT_TTL = 10 * 1000; // 10 seconds (prevents concurrent request duplication but updates quickly)

const store = new Map();

/**
 * Returns cached data if still fresh, otherwise fetches from the API.
 *
 * @param {string}  url           – The API path (e.g. '/rooms')
 * @param {number}  [ttl]         – Time-to-live in ms.  Pass 0 to bypass cache.
 * @param {object}  [axiosConfig] – Extra axios config forwarded to API.get()
 * @returns {Promise<any>}        – The response `data`
 */
export async function cachedGet(url, ttl = DEFAULT_TTL, axiosConfig) {
    // ttl === 0 means "always fresh"
    if (ttl === 0) {
        const { data } = await API.get(url, axiosConfig);
        return data;
    }

    const entry = store.get(url);

    // Return cached data if it's still within TTL
    if (entry && Date.now() - entry.timestamp < ttl) {
        return entry.data;
    }

    // If there's already an in-flight request for this URL, piggyback on it
    if (entry?.promise) {
        return entry.promise;
    }

    // Start a new fetch and store the promise so concurrent callers share it
    const promise = API.get(url, axiosConfig)
        .then(({ data }) => {
            store.set(url, { data, timestamp: Date.now(), promise: null });
            return data;
        })
        .catch((err) => {
            // On error, remove the stale entry so the next call retries
            store.delete(url);
            throw err;
        });

    store.set(url, { ...(entry || {}), promise });
    return promise;
}

/**
 * Invalidate one or all cache entries.
 * Call after mutations (create / update / delete) so the next read is fresh.
 *
 * @param {string} [url] – Specific URL to invalidate. Omit to clear everything.
 */
export function invalidateCache(url) {
    if (url) {
        store.delete(url);
    } else {
        store.clear();
    }
}

/**
 * Invalidate all entries whose key starts with the given prefix.
 * Handy for busting e.g. all `/rooms` variants at once.
 *
 * @param {string} prefix
 */
export function invalidateCacheByPrefix(prefix) {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
            store.delete(key);
        }
    }
}
