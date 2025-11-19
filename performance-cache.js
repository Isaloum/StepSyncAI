/**
 * Performance Cache Module
 * LRU cache with TTL support for expensive calculations
 */

class PerformanceCache {
    constructor(maxSize = 100, defaultTTL = 300000) { // 5 minute default TTL
        this.cache = new Map();
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
        this.accessOrder = []; // Track access order for LRU
    }

    /**
     * Generate cache key from multiple parameters
     */
    generateKey(...params) {
        return JSON.stringify(params);
    }

    /**
     * Get value from cache
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            return null;
        }

        // Update access order (LRU)
        this.updateAccessOrder(key);

        return entry.value;
    }

    /**
     * Set value in cache
     */
    set(key, value, ttl = this.defaultTTL) {
        // Evict oldest if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const oldestKey = this.accessOrder[0];
            this.cache.delete(oldestKey);
            this.accessOrder.shift();
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });

        this.updateAccessOrder(key);
    }

    /**
     * Check if key exists and is not expired
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Clear entire cache
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }

    /**
     * Clear expired entries
     */
    clearExpired() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
                this.removeFromAccessOrder(key);
            }
        }
    }

    /**
     * Update access order for LRU
     */
    updateAccessOrder(key) {
        this.removeFromAccessOrder(key);
        this.accessOrder.push(key);
    }

    /**
     * Remove key from access order
     */
    removeFromAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: this.hits / (this.hits + this.misses) || 0,
            hits: this.hits || 0,
            misses: this.misses || 0
        };
    }

    /**
     * Memoize a function with caching
     */
    memoize(fn, keyFn, ttl) {
        return (...args) => {
            const key = keyFn ? keyFn(...args) : this.generateKey(...args);

            let result = this.get(key);

            if (result === null) {
                result = fn(...args);
                this.set(key, result, ttl);
                this.misses = (this.misses || 0) + 1;
            } else {
                this.hits = (this.hits || 0) + 1;
            }

            return result;
        };
    }
}

/**
 * Date utilities for performance optimization
 */
class DateUtils {
    /**
     * Pre-compute date key from timestamp
     * Returns ISO date string (YYYY-MM-DD)
     */
    static toDateKey(timestamp) {
        if (!timestamp) return null;
        return typeof timestamp === 'string'
            ? timestamp.split('T')[0]
            : new Date(timestamp).toISOString().split('T')[0];
    }

    /**
     * Get cutoff date for filtering
     */
    static getCutoffDate(days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        cutoff.setHours(0, 0, 0, 0);
        return cutoff;
    }

    /**
     * Check if date is within range
     */
    static isWithinDays(timestamp, days) {
        const cutoff = this.getCutoffDate(days);
        const date = new Date(timestamp);
        return date >= cutoff;
    }

    /**
     * Batch process dates - add dateKey to entries
     */
    static addDateKeys(entries) {
        return entries.map(entry => ({
            ...entry,
            dateKey: this.toDateKey(entry.timestamp || entry.date)
        }));
    }

    /**
     * Group entries by date
     */
    static groupByDate(entries, dateField = 'timestamp') {
        const groups = new Map();

        entries.forEach(entry => {
            const dateKey = this.toDateKey(entry[dateField]);
            if (!groups.has(dateKey)) {
                groups.set(dateKey, []);
            }
            groups.get(dateKey).push(entry);
        });

        return groups;
    }
}

/**
 * Array optimization utilities
 */
class ArrayUtils {
    /**
     * Single-pass multi-filter
     * Instead of: arr.filter(a).filter(b).filter(c)
     * Use: singlePassFilter(arr, [filterA, filterB, filterC])
     */
    static singlePassMultiFilter(array, predicates) {
        return array.filter(item => predicates.every(pred => pred(item)));
    }

    /**
     * Single-pass grouping and counting
     * Replaces multiple filter operations for counting
     */
    static groupAndCount(array, keyFn, valueFns = {}) {
        const result = {};

        array.forEach(item => {
            const key = keyFn(item);

            if (!result[key]) {
                result[key] = { count: 0 };
                Object.keys(valueFns).forEach(vKey => {
                    result[key][vKey] = [];
                });
            }

            result[key].count++;

            Object.entries(valueFns).forEach(([vKey, vFn]) => {
                result[key][vKey].push(vFn(item));
            });
        });

        return result;
    }

    /**
     * Create lookup Map from array
     * O(1) lookups instead of O(n) find()
     */
    static createLookupMap(array, keyFn) {
        return new Map(array.map(item => [keyFn(item), item]));
    }

    /**
     * Paginate array
     */
    static paginate(array, page = 1, pageSize = 50) {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return {
            data: array.slice(startIndex, endIndex),
            page,
            pageSize,
            total: array.length,
            totalPages: Math.ceil(array.length / pageSize),
            hasMore: endIndex < array.length
        };
    }

    /**
     * Limit array size for performance
     */
    static limit(array, maxSize = 1000) {
        return array.length > maxSize ? array.slice(-maxSize) : array;
    }
}

module.exports = {
    PerformanceCache,
    DateUtils,
    ArrayUtils
};
