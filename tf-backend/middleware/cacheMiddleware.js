const cacheService = require('../utils/cacheService');

/**
 * Cache middleware for Express routes
 * Caches GET responses based on cache key
 * 
 * @param {object} options - Cache options
 * @param {string} options.key - Cache key (can be a function that receives req)
 * @param {number} options.ttl - Time to live in seconds (optional)
 * @param {function} options.generateKey - Function to generate cache key from request (optional)
 * @returns {function} Express middleware
 */
const cacheMiddleware = (options = {}) => {
    const { key, ttl, generateKey } = options;

    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate cache key
        let cacheKey;
        if (generateKey) {
            cacheKey = generateKey(req);
        } else if (key) {
            cacheKey = typeof key === 'function' ? key(req) : key;
        } else {
            // Default: use URL path + query string
            cacheKey = `route:${req.originalUrl || req.url}`;
        }

        // Try to get from cache
        const cachedData = cacheService.get(cacheKey);
        if (cachedData !== null) {
            // Set cache hit header
            res.setHeader('X-Cache', 'HIT');
            return res.json(cachedData);
        }

        // Cache miss - store original json method
        const originalJson = res.json.bind(res);
        
        // Override json method to cache response
        res.json = function(data) {
            // Cache the response
            cacheService.set(cacheKey, data, ttl);
            // Set cache miss header
            res.setHeader('X-Cache', 'MISS');
            // Call original json method
            return originalJson(data);
        };

        next();
    };
};

/**
 * Invalidate cache middleware
 * Call this after write operations (POST, PUT, DELETE, PATCH)
 * 
 * @param {string|function} keyPattern - Cache key pattern to invalidate (supports wildcards)
 * @returns {function} Express middleware
 */
const invalidateCache = (keyPattern) => {
    return (req, res, next) => {
        // Call next first to let the route handler execute
        const originalJson = res.json.bind(res);
        
        res.json = function(data) {
            // Invalidate cache after successful response
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const pattern = typeof keyPattern === 'function' 
                    ? keyPattern(req) 
                    : keyPattern;
                
                if (pattern) {
                    if (pattern.includes('*')) {
                        cacheService.delPattern(pattern);
                    } else {
                        cacheService.del(pattern);
                    }
                }
            }
            return originalJson(data);
        };

        next();
    };
};

module.exports = {
    cacheMiddleware,
    invalidateCache
};

