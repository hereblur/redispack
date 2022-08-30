"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeQuickLookup = void 0;
const redis_1 = require("./redis");
const debug_1 = require("debug");
const dbg = (0, debug_1.default)('qlookup');
const qGet = (name, idField, reload) => {
    return async (id) => {
        const redisClient = (0, redis_1.client)();
        const data = await redisClient.get(`quickLookup_${name}_${id}`);
        if (data) {
            dbg(`parsing ${name}.${idField}: ${data}`);
            return JSON.parse(data);
        }
        const data2 = await reload();
        return data2.filter(l => l[idField] === id).pop();
    };
};
const qGetAll = (name, reload) => {
    return async () => {
        const redisClient = (0, redis_1.client)();
        const data = await redisClient.get(`quickLookup_${name}`);
        if (data) {
            dbg(`parsing ${name}.all: ${data}`);
            return JSON.parse(data);
        }
        return await reload();
    };
};
const qReload = (name, idField, asyncGetAll, isActive, cacheAgeSeconds) => {
    return async () => {
        const ls = await asyncGetAll();
        const all = [];
        const redisClient = (0, redis_1.client)();
        await Promise.all(ls.map(async (l) => {
            if (isActive(l)) {
                await redisClient.set(`quickLookup_${name}_${l[idField]}`, JSON.stringify(l), 'EX', cacheAgeSeconds);
                all.push({ ...l });
            }
            else {
                await redisClient.del(`quickLookup_${name}_${l[idField]}`);
            }
        }));
        await redisClient.set(`quickLookup_${name}`, JSON.stringify(all), 'EX', cacheAgeSeconds);
        return ls;
    };
};
const makeQuickLookup = (name, idField, asyncGetAll, isActive, cacheAgeSeconds) => {
    const reload = qReload(name, idField, asyncGetAll, isActive, cacheAgeSeconds);
    const get = qGet(name, idField, reload);
    const getAll = qGetAll(name, reload);
    return {
        reload,
        get,
        getAll,
    };
};
exports.makeQuickLookup = makeQuickLookup;
//# sourceMappingURL=makeQuickLookup.js.map