import {client} from './redis';
import Debug from 'debug';
const dbg = Debug('qlookup');

interface PlainObject {
  [k: string]: unknown;
}

type AsyncListFunc = () => Promise<Array<PlainObject>>;
type IsActiveFunc = (data: PlainObject) => boolean;

const qGet = (name: string, idField: string, reload: AsyncListFunc) => {
  return async (id: string) => {
    const redisClient = client();
    const data = await redisClient.get(`quickLookup_${name}_${id}`);
    if (data) {
      dbg(`parsing ${name}.${idField}: ${data}`);
      return JSON.parse(data);
    }
    const data2 = await reload();
    return data2.filter(l => l[idField] === id).pop();
  };
};

const qGetAll = (name: string, reload: QReloadFunc) => {
  return async () => {
    const redisClient = client();
    const data = await redisClient.get(`quickLookup_${name}`);
    if (data) {
      dbg(`parsing ${name}.all: ${data}`);
      return JSON.parse(data);
    }
    return await reload();
  };
};

type QReloadFunc = () => Promise<Array<PlainObject>>;

const qReload = (
  name: string,
  idField: string,
  asyncGetAll: AsyncListFunc,
  isActive: IsActiveFunc,
  cacheAgeSeconds: number
): QReloadFunc => {
  return async () => {
    const ls = await asyncGetAll();
    const all: Array<PlainObject> = [];
    const redisClient = client();
    await Promise.all(
      ls.map(async l => {
        if (isActive(l)) {
          await redisClient.set(
            `quickLookup_${name}_${l[idField]}`,
            JSON.stringify(l),
            'EX',
            cacheAgeSeconds
          );
          all.push({...l});
        } else {
          await redisClient.del(`quickLookup_${name}_${l[idField]}`);
        }
      })
    );

    await redisClient.set(
      `quickLookup_${name}`,
      JSON.stringify(all),
      'EX',
      cacheAgeSeconds
    );

    return ls;
  };
};

export const makeQuickLookup = (
  name: string,
  idField: string,
  asyncGetAll: AsyncListFunc,
  isActive: IsActiveFunc,
  cacheAgeSeconds: number
) => {
  const reload = qReload(name, idField, asyncGetAll, isActive, cacheAgeSeconds);
  const get = qGet(name, idField, reload);
  const getAll = qGetAll(name, reload);
  return {
    reload,
    get,
    getAll,
  };
};
