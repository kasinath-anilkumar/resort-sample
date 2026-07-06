import API from '../api';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const store = new Map();

export async function cachedGet(url, ttl = DEFAULT_TTL, axiosConfig) {
    if (ttl === 0) {
        const { data } = await API.get(url, axiosConfig);
        return data;
    }

    const entry = store.get(url);

    if (entry && Date.now() - entry.timestamp < ttl) {
        return entry.data;
    }

    if (entry?.promise) {
        return entry.promise;
    }

    const promise = API.get(url, axiosConfig)
        .then(({ data }) => {
            store.set(url, { data, timestamp: Date.now(), promise: null });
            return data;
        })
        .catch((err) => {
            store.delete(url);
            throw err;
        });

    store.set(url, { ...(entry || {}), promise });
    return promise;
}

export function invalidateCache(url) {
    if (url) {
        store.delete(url);
    } else {
        store.clear();
    }
}

export function invalidateCacheByPrefix(prefix) {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
            store.delete(key);
        }
    }
}
