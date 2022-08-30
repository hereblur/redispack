"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("./redis");
const debug_1 = require("debug");
const debug = (0, debug_1.default)('redisplus');
let __PUBLISHER = null;
const pub = async (key, data) => {
    if (!__PUBLISHER) {
        debug('Create publisher...');
        __PUBLISHER = await (0, redis_1.newClient)();
    }
    else {
        debug('Recycling publisher');
    }
    debug(`publishing ${JSON.stringify(data)}`);
    await __PUBLISHER.publish(key, JSON.stringify(data));
};
const sub = async (listeners) => {
    debug('Create subscriber...');
    const subscriber = (0, redis_1.newClient)();
    const keys = Object.keys(listeners);
    subscriber.on('message', (key, data) => {
        listeners[key] && listeners[key](JSON.parse(data));
    });
    await subscriber.subscribe(...keys, (err, count) => {
        if (err) {
            debug(`Failed to subscribe: ${err.message} ${count}. (${keys.join(', ')})"`);
        }
        else {
            debug(`Pub/Sub ${keys.join(', ')}/${count} subscribed.`);
        }
    });
    return () => {
        debug('UNSUBSCRIBE');
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            subscriber.unsubscribe(key);
        }
    };
};
module.exports = {
    pub,
    sub,
};
//# sourceMappingURL=pubsub.js.map