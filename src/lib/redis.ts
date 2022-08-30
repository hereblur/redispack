import Redis from 'ioredis';
import Redlock from 'redlock';

let defaultClient: Redis;
export type AsyncFunc = () => Promise<unknown>;
type OnUseCacheCallback = (data: unknown) => void;

export const client = (): Redis => {
  if (!defaultClient) {
    defaultClient = newClient();
  }

  return defaultClient;
};

export const newClient = (): Redis => {
  const client = new Redis(`${process.env.REDIS_URL}`);
  return client;
};

export const cache = async (
  key: string,
  ageSeconds: number,
  getDataAsync: AsyncFunc,
  onUseCache: OnUseCacheCallback
) => {
  const c = client();

  const data = await c.get(key);
  if (!data) {
    const newData = await getDataAsync();
    await c.set(key, JSON.stringify(newData), 'EX', ageSeconds);

    return newData;
  } else {
    const d = JSON.parse(data);
    onUseCache && onUseCache(d);

    return d;
  }
};

let __REDLOCK: Redlock;
export const redlock = async () => {
  if (!__REDLOCK) {
    __REDLOCK = new Redlock([client()], {
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

export const get_json = async (key: string): Promise<unknown> => {
  const c = client();

  const data = await c.get(key);
  if (data) {
    return JSON.parse(data);
  }

  return null;
};

export const set_json = async (
  key: string,
  data: unknown,
  ageSeconds: number
): Promise<void> => {
  const c = client();
  await c.set(key, JSON.stringify(data || null), 'EX', ageSeconds);
};

let __LOCKER__: Redlock;
const onceLocker = () => {
  if (!__LOCKER__) {
    const c = client();

    __LOCKER__ = new Redlock([c], {
      driftFactor: 0.01,
      retryCount: 0,
      retryDelay: 200,
      retryJitter: 50,
    });
  }

  return __LOCKER__;
};

export const once = async (
  key: string,
  timeSpanMS: number,
  func: AsyncFunc,
  onBusy: Function
) => {
  const locker = onceLocker();
  let lock;
  try {
    lock = await locker.acquire([`LOCK-${key}`], 2000);
  } catch (err) {
    onBusy && onBusy();
    return;
  }

  try {
    const done = await get_json(`ONCEz-${key}`);

    if (done) {
      onBusy && onBusy();
      return;
    }

    await set_json(
      `ONCEz-${key}`,
      {done: true, key},
      Math.ceil(timeSpanMS / 1000)
    );
    await func();
  } catch (err) {
    console.error(`ERROR ${key}`, err);
  } finally {
    lock.release().catch(() => {});
  }
};
