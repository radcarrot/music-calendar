import NodeCache from 'node-cache';

// Initialize cache with a default standard TTL (Time To Live)
const apiCache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

export const cacheMiddleware = (durationSeconds) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Create a unique key based on the URL and User ID to prevent cross-user data leaks
        const userId = req.user ? req.user.id : 'anonymous';
        const key = `__express__${userId}__${req.originalUrl || req.url}`;

        const cachedResponse = apiCache.get(key);

        if (cachedResponse) {
            console.log(`[Cache] Serving ${req.originalUrl} from Memory`);
            return res.json(cachedResponse);
        } else {
            // Hijack res.json to save the response to the cache before sending it
            const originalJson = res.json;
            res.json = (body) => {
                // Determine duration; fallback to default if not specified
                apiCache.set(key, body, durationSeconds || 300);
                originalJson.call(res, body);
            };
            next();
        }
    };
};

export const clearCachePrefix = (userId, pathPrefix) => {
    const keys = apiCache.keys();
    keys.forEach(key => {
        if (key.startsWith(`__express__${userId}__${pathPrefix}`)) {
            apiCache.del(key);
        }
    });
};
