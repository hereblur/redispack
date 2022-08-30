"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.once = exports.set_json = exports.get_json = exports.redlock = exports.cache = exports.newClient = exports.client = void 0;
const ioredis_1 = require("ioredis");
const redlock_1 = require("redlock");
let defaultClient;
const client = () => {
    if (!defaultClient) {
        defaultClient = (0, exports.newClient)();
    }
    return defaultClient;
};
exports.client = client;
const newClient = () => {
    const client = new ioredis_1.default(`${process.env.REDIS_URL}`);
    return client;
};
exports.newClient = newClient;
const cache = async (key, ageSeconds, getDataAsync, onUseCache) => {
    const c = (0, exports.client)();
    const data = await c.get(key);
    if (!data) {
        const newData = await getDataAsync();
        await c.set(key, JSON.stringify(newData), 'EX', ageSeconds);
        return newData;
    }
    else {
        const d = JSON.parse(data);
        onUseCache && onUseCache(d);
        return d;
    }
};
exports.cache = cache;
let __REDLOCK;
const redlock = async () => {
    if (!__REDLOCK) {
        __REDLOCK = new redlock_1.default([(0, exports.client)()], {
            driftFactor: 0.01,
            retryCount: 10,
            retryDelay: 600,
            retryJitter: 400,
        });
        __REDLOCK.on('clientError', err => {
            console.error('A redis error has occurred:', err);
        });
    }
    return __REDLOCK;
};
exports.redlock = redlock;
const get_json = async (key) => {
    const c = (0, exports.client)();
    const data = await c.get(key);
    if (data) {
        return JSON.parse(data);
    }
    return null;
};
exports.get_json = get_json;
const set_json = async (key, data, ageSeconds) => {
    const c = (0, exports.client)();
    await c.set(key, JSON.stringify(data || null), 'EX', ageSeconds);
};
exports.set_json = set_json;
let __LOCKER__;
const onceLocker = () => {
    if (!__LOCKER__) {
        const c = (0, exports.client)();
        __LOCKER__ = new redlock_1.default([c], {
            driftFactor: 0.01,
            retryCount: 0,
            retryDelay: 200,
            retryJitter: 50,
        });
    }
    return __LOCKER__;
};
const once = async (key, timeSpanMS, func, onBusy) => {
    const locker = onceLocker();
    let lock;
    try {
        lock = await locker.acquire([`LOCK-${key}`], 2000);
    }
    catch (err) {
        onBusy && onBusy();
        return;
    }
    try {
        const done = await (0, exports.get_json)(`ONCEz-${key}`);
        if (done) {
            onBusy && onBusy();
            return;
        }
        await (0, exports.set_json)(`ONCEz-${key}`, { done: true, key }, Math.ceil(timeSpanMS / 1000));
        await func();
    }
    catch (err) {
        console.error(`ERROR ${key}`, err);
    }
    finally {
        lock.release().catch(() => { });
    }
};
exports.once = once;
//# sourceMappingURL=redis.js.map