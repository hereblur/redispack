import {newClient} from './redis';
import Debug from 'debug';
import Redis from 'ioredis';

const debug = Debug('redisplus');

interface PlainObject {
  [k: string]: unknown;
}

type ListenerFunc = (data: PlainObject) => void;
interface Listeners {
  [k: string]: ListenerFunc;
}

let __PUBLISHER: Redis | null = null;
export const pub = async (key: string, data: unknown) => {
  if (!__PUBLISHER) {
    debug('Create publisher...');
    __PUBLISHER = await newClient();
  } else {
    debug('Recycling publisher');
  }

  debug(`publishing ${JSON.stringify(data)}`);
  await __PUBLISHER.publish(key, JSON.stringify(data));
};

export const sub = async (listeners: Listeners) => {
  debug('Create subscriber...');
  const subscriber = newClient();

  const keys = Object.keys(listeners);

  subscriber.on('message', (key, data) => {
    listeners[key] && listeners[key](JSON.parse(data));
  });

  await subscriber.subscribe(...keys, (err, count) => {
    if (err) {
      debug(
        `Failed to subscribe: ${err.message} ${count}. (${keys.join(', ')})"`
      );
    } else {
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
