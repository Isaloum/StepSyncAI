const { PerformanceCache, DateUtils, ArrayUtils } = require('../performance-cache');

describe('PerformanceCache', () => {
    let cache;

    beforeEach(() => {
        cache = new PerformanceCache(3, 1000); // max 3 items, 1 second TTL
    });

    describe('Basic Operations', () => {
        test('should set and get values', () => {
            cache.set('key1', 'value1');
            expect(cache.get('key1')).toBe('value1');
        });

        test('should return null for non-existent keys', () => {
            expect(cache.get('nonexistent')).toBeNull();
        });

        test('should overwrite existing keys', () => {
            cache.set('key1', 'value1');
            cache.set('key1', 'value2');
            expect(cache.get('key1')).toBe('value2');
        });

        test('should handle different data types', () => {
            // Use a larger cache to prevent eviction during this test
            const largeCache = new PerformanceCache(10, 1000);

            largeCache.set('string', 'hello');
            largeCache.set('number', 42);
            largeCache.set('object', { foo: 'bar' });
            largeCache.set('array', [1, 2, 3]);

            expect(largeCache.get('string')).toBe('hello');
            expect(largeCache.get('number')).toBe(42);
            expect(largeCache.get('object')).toEqual({ foo: 'bar' });
            expect(largeCache.get('array')).toEqual([1, 2, 3]);
        });
    });

    describe('LRU Eviction', () => {
        test('should evict least recently used item when cache is full', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            cache.set('key4', 'value4'); // Should evict key1

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBe('value2');
            expect(cache.get('key3')).toBe('value3');
            expect(cache.get('key4')).toBe('value4');
        });

        test('should update access order on get', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            cache.get('key1'); // Access key1, making it most recent

            cache.set('key4', 'value4'); // Should evict key2, not key1

            expect(cache.get('key1')).toBe('value1');
            expect(cache.get('key2')).toBeNull();
            expect(cache.get('key3')).toBe('value3');
            expect(cache.get('key4')).toBe('value4');
        });
    });

    describe('TTL Expiration', () => {
        test('should expire entries after TTL', (done) => {
            cache.set('key1', 'value1', 100); // 100ms TTL

            expect(cache.get('key1')).toBe('value1');

            setTimeout(() => {
                expect(cache.get('key1')).toBeNull();
                done();
            }, 150);
        });

        test('should use default TTL when not specified', (done) => {
            cache.set('key1', 'value1'); // Uses default 1000ms TTL

            expect(cache.get('key1')).toBe('value1');

            setTimeout(() => {
                expect(cache.get('key1')).toBeNull();
                done();
            }, 1100);
        });

        test('should allow custom TTL per entry', (done) => {
            cache.set('short', 'value1', 100);
            cache.set('long', 'value2', 500);

            setTimeout(() => {
                expect(cache.get('short')).toBeNull();
                expect(cache.get('long')).toBe('value2');
                done();
            }, 150);
        });
    });

    describe('Cache Statistics', () => {
        test('should clear all entries', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            cache.clear();

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
            expect(cache.get('key3')).toBeNull();
        });

        test('should check if key exists', () => {
            cache.set('key1', 'value1');

            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(false);
        });

        test('should clear expired entries', (done) => {
            cache.set('key1', 'value1', 100);
            cache.set('key2', 'value2', 5000);

            setTimeout(() => {
                cache.clearExpired();
                expect(cache.get('key1')).toBeNull();
                expect(cache.get('key2')).toBe('value2');
                done();
            }, 150);
        });

        test('should get cache statistics', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');

            const stats = cache.getStats();
            expect(stats.size).toBe(2);
            expect(stats.maxSize).toBe(3);
        });
    });

    describe('Key Generation', () => {
        test('should generate consistent keys from arguments', () => {
            const key1 = cache.generateKey('user', 123);
            const key2 = cache.generateKey('user', 123);
            const key3 = cache.generateKey('user', 456);

            expect(key1).toBe(key2);
            expect(key1).not.toBe(key3);
        });

        test('should handle various data types in key generation', () => {
            const key1 = cache.generateKey('test', 1, 'string', true);
            const key2 = cache.generateKey('test', 1, 'string', true);

            expect(key1).toBe(key2);
            expect(key1).toBe(JSON.stringify(['test', 1, 'string', true]));
        });
    });

    describe('Memoization', () => {
        test('should memoize function results', () => {
            let callCount = 0;
            const expensiveFn = (a, b) => {
                callCount++;
                return a + b;
            };

            const memoized = cache.memoize(expensiveFn);

            expect(memoized(2, 3)).toBe(5);
            expect(callCount).toBe(1);

            expect(memoized(2, 3)).toBe(5); // Should use cache
            expect(callCount).toBe(1); // Not called again

            expect(memoized(3, 4)).toBe(7);
            expect(callCount).toBe(2);
        });

        test('should track hit/miss statistics', () => {
            const fn = (x) => x * 2;
            const memoized = cache.memoize(fn);

            memoized(5); // Miss
            memoized(5); // Hit
            memoized(10); // Miss

            const stats = cache.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(2);
        });
    });
});

describe('DateUtils', () => {
    describe('toDateKey', () => {
        test('should convert Date to ISO date string', () => {
            const date = new Date('2025-11-19T10:30:00Z');
            expect(DateUtils.toDateKey(date)).toBe('2025-11-19');
        });

        test('should handle ISO timestamp strings', () => {
            expect(DateUtils.toDateKey('2025-11-19T10:30:00Z')).toBe('2025-11-19');
        });

        test('should handle date-only strings', () => {
            expect(DateUtils.toDateKey('2025-11-19')).toBe('2025-11-19');
        });

        test('should return null for invalid input', () => {
            expect(DateUtils.toDateKey(null)).toBeNull();
            expect(DateUtils.toDateKey(undefined)).toBeNull();
            expect(DateUtils.toDateKey('')).toBeNull();
        });

        test('should handle numeric timestamps', () => {
            const timestamp = new Date('2025-11-19T10:30:00Z').getTime();
            expect(DateUtils.toDateKey(timestamp)).toBe('2025-11-19');
        });
    });

    describe('getCutoffDate', () => {
        test('should calculate cutoff date for 7 days', () => {
            const cutoff = DateUtils.getCutoffDate(7);
            const expected = new Date();
            expected.setDate(expected.getDate() - 7);
            expected.setHours(0, 0, 0, 0);

            expect(cutoff.toDateString()).toBe(expected.toDateString());
            expect(cutoff.getHours()).toBe(0);
            expect(cutoff.getMinutes()).toBe(0);
        });

        test('should calculate cutoff date for 30 days', () => {
            const cutoff = DateUtils.getCutoffDate(30);
            const expected = new Date();
            expected.setDate(expected.getDate() - 30);
            expected.setHours(0, 0, 0, 0);

            expect(cutoff.toDateString()).toBe(expected.toDateString());
        });

        test('should handle 0 days (today)', () => {
            const cutoff = DateUtils.getCutoffDate(0);
            const expected = new Date();
            expected.setHours(0, 0, 0, 0);

            expect(cutoff.toDateString()).toBe(expected.toDateString());
        });
    });

    describe('isWithinDays', () => {
        test('should check if date is within range', () => {
            const today = new Date();
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

            expect(DateUtils.isWithinDays(today, 7)).toBe(true);
            expect(DateUtils.isWithinDays(twoDaysAgo, 7)).toBe(true);
            expect(DateUtils.isWithinDays(tenDaysAgo, 7)).toBe(false);
        });
    });

    describe('addDateKeys', () => {
        test('should add dateKey to entries', () => {
            const entries = [
                { id: 1, timestamp: '2025-11-19T10:30:00Z' },
                { id: 2, timestamp: '2025-11-20T15:45:00Z' }
            ];

            const result = DateUtils.addDateKeys(entries);

            expect(result[0].dateKey).toBe('2025-11-19');
            expect(result[1].dateKey).toBe('2025-11-20');
            expect(result[0].id).toBe(1);
        });
    });

    describe('groupByDate', () => {
        test('should group entries by date', () => {
            const entries = [
                { id: 1, timestamp: '2025-11-19T10:00:00Z' },
                { id: 2, timestamp: '2025-11-19T15:00:00Z' },
                { id: 3, timestamp: '2025-11-20T10:00:00Z' }
            ];

            const grouped = DateUtils.groupByDate(entries);

            expect(grouped.get('2025-11-19')).toHaveLength(2);
            expect(grouped.get('2025-11-20')).toHaveLength(1);
        });

        test('should handle custom date field', () => {
            const entries = [
                { id: 1, date: '2025-11-19' },
                { id: 2, date: '2025-11-19' }
            ];

            const grouped = DateUtils.groupByDate(entries, 'date');

            expect(grouped.get('2025-11-19')).toHaveLength(2);
        });
    });
});

describe('ArrayUtils', () => {
    describe('createLookupMap', () => {
        test('should create map from array with key function', () => {
            const users = [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' },
                { id: 3, name: 'Charlie' }
            ];

            const map = ArrayUtils.createLookupMap(users, user => user.id);

            expect(map.get(1)).toEqual({ id: 1, name: 'Alice' });
            expect(map.get(2)).toEqual({ id: 2, name: 'Bob' });
            expect(map.get(3)).toEqual({ id: 3, name: 'Charlie' });
        });

        test('should handle empty array', () => {
            const map = ArrayUtils.createLookupMap([], item => item.id);
            expect(map.size).toBe(0);
        });

        test('should handle custom key functions', () => {
            const items = [
                { name: 'apple', category: 'fruit' },
                { name: 'banana', category: 'fruit' }
            ];

            const map = ArrayUtils.createLookupMap(items, item => item.name);

            expect(map.get('apple')).toEqual({ name: 'apple', category: 'fruit' });
            expect(map.get('banana')).toEqual({ name: 'banana', category: 'fruit' });
        });
    });

    describe('paginate', () => {
        const items = Array.from({ length: 100 }, (_, i) => i + 1);

        test('should paginate with default page size', () => {
            const result = ArrayUtils.paginate(items, 1);

            expect(result.data).toHaveLength(50);
            expect(result.data[0]).toBe(1);
            expect(result.data[49]).toBe(50);
            expect(result.page).toBe(1);
            expect(result.pageSize).toBe(50);
            expect(result.total).toBe(100);
            expect(result.totalPages).toBe(2);
            expect(result.hasMore).toBe(true);
        });

        test('should paginate with custom page size', () => {
            const result = ArrayUtils.paginate(items, 1, 10);

            expect(result.data).toHaveLength(10);
            expect(result.data[0]).toBe(1);
            expect(result.pageSize).toBe(10);
            expect(result.totalPages).toBe(10);
        });

        test('should handle page 2', () => {
            const result = ArrayUtils.paginate(items, 2, 10);

            expect(result.data).toHaveLength(10);
            expect(result.data[0]).toBe(11);
            expect(result.data[9]).toBe(20);
            expect(result.hasMore).toBe(true);
        });

        test('should handle last page', () => {
            const result = ArrayUtils.paginate(items, 10, 10);

            expect(result.data).toHaveLength(10);
            expect(result.data[0]).toBe(91);
            expect(result.data[9]).toBe(100);
            expect(result.hasMore).toBe(false);
        });

        test('should handle partial last page', () => {
            const result = ArrayUtils.paginate(items, 3, 45);

            expect(result.data).toHaveLength(10);
            expect(result.data[0]).toBe(91);
            expect(result.hasMore).toBe(false);
        });

        test('should handle empty array', () => {
            const result = ArrayUtils.paginate([], 1, 10);

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.totalPages).toBe(0);
            expect(result.hasMore).toBe(false);
        });
    });

    describe('singlePassMultiFilter', () => {
        test('should apply multiple filters in single pass', () => {
            const items = [
                { age: 25, active: true },
                { age: 35, active: false },
                { age: 30, active: true },
                { age: 20, active: true }
            ];

            const filters = [
                item => item.age >= 25,
                item => item.active === true
            ];

            const result = ArrayUtils.singlePassMultiFilter(items, filters);

            expect(result).toHaveLength(2);
            expect(result[0].age).toBe(25);
            expect(result[1].age).toBe(30);
        });

        test('should handle empty predicates array', () => {
            const items = [{ id: 1 }, { id: 2 }];
            const result = ArrayUtils.singlePassMultiFilter(items, []);

            expect(result).toHaveLength(2);
        });
    });

    describe('groupAndCount', () => {
        test('should group and count items', () => {
            const items = [
                { type: 'fruit', price: 1.5, name: 'apple' },
                { type: 'fruit', price: 2.0, name: 'banana' },
                { type: 'vegetable', price: 1.0, name: 'carrot' }
            ];

            const result = ArrayUtils.groupAndCount(
                items,
                item => item.type,
                { prices: item => item.price, names: item => item.name }
            );

            expect(result.fruit.count).toBe(2);
            expect(result.vegetable.count).toBe(1);
            expect(result.fruit.prices).toEqual([1.5, 2.0]);
            expect(result.fruit.names).toEqual(['apple', 'banana']);
        });

        test('should handle simple counting without value functions', () => {
            const items = [{ type: 'A' }, { type: 'B' }, { type: 'A' }];
            const result = ArrayUtils.groupAndCount(items, item => item.type);

            expect(result.A.count).toBe(2);
            expect(result.B.count).toBe(1);
        });
    });

    describe('limit', () => {
        test('should limit array to max size', () => {
            const items = Array.from({ length: 2000 }, (_, i) => i);
            const result = ArrayUtils.limit(items, 1000);

            expect(result).toHaveLength(1000);
            expect(result[0]).toBe(1000); // Gets last 1000 items
            expect(result[999]).toBe(1999);
        });

        test('should not modify array smaller than max size', () => {
            const items = [1, 2, 3, 4, 5];
            const result = ArrayUtils.limit(items, 1000);

            expect(result).toHaveLength(5);
            expect(result).toEqual([1, 2, 3, 4, 5]);
        });
    });
});
