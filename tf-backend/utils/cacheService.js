const NodeCache = require('node-cache');

// Create cache instance with default TTL of 1 hour (3600 seconds)
// stdTTL: time to live in seconds for every generated cache element
// checkperiod: period in seconds to check for expired keys
const cache = new NodeCache({ 
    stdTTL: 3600, // 1 hour default TTL
    checkperiod: 600, // Check for expired keys every 10 minutes
    useClones: false // Better performance, but be careful with object mutations
});

// Cache key prefixes for different data types
const CACHE_KEYS = {
    CATEGORIES: 'categories:all',
    SERVICES: 'services:',
    SUBCATEGORIES: 'subcategories:',
    PRICES: 'prices:',
    ARTIST: 'artist:',
    ARTIST_RATINGS: 'artist:ratings:',
    USER_PROFILE: 'user:profile:',
    USER_ADDRESSES: 'user:addresses:',
    CART: 'cart:',
    BOOKINGS: 'bookings:',
};

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if not found
 */
const get = (key) => {
    try {
        const value = cache.get(key);
        if (value !== undefined) {
            return value;
        }
        return null;
    } catch (err) {
        console.error(`Cache get error for key ${key}:`, err);
        return null;
    }
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional, uses default if not provided)
 * @returns {boolean} - Success status
 */
const set = (key, value, ttl = null) => {
    try {
        if (ttl) {
            return cache.set(key, value, ttl);
        }
        return cache.set(key, value);
    } catch (err) {
        console.error(`Cache set error for key ${key}:`, err);
        return false;
    }
};

/**
 * Delete data from cache
 * @param {string} key - Cache key or array of keys
 * @returns {number} - Number of deleted keys
 */
const del = (key) => {
    try {
        return cache.del(key);
    } catch (err) {
        console.error(`Cache delete error for key ${key}:`, err);
        return 0;
    }
};

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., 'user:*')
 * @returns {number} - Number of deleted keys
 */
const delPattern = (pattern) => {
    try {
        const keys = cache.keys();
        const regex = new RegExp(pattern.replace('*', '.*'));
        const matchingKeys = keys.filter(key => regex.test(key));
        if (matchingKeys.length > 0) {
            return cache.del(matchingKeys);
        }
        return 0;
    } catch (err) {
        console.error(`Cache delete pattern error for pattern ${pattern}:`, err);
        return 0;
    }
};

/**
 * Clear all cache
 */
const flush = () => {
    try {
        cache.flushAll();
    } catch (err) {
        console.error('Cache flush error:', err);
    }
};

/**
 * Get cache statistics
 * @returns {object} - Cache stats
 */
const getStats = () => {
    return cache.getStats();
};

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {boolean} - True if exists
 */
const has = (key) => {
    return cache.has(key);
};

module.exports = {
    get,
    set,
    del,
    delPattern,
    flush,
    getStats,
    has,
    CACHE_KEYS
};

