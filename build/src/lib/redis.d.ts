import Redis from 'ioredis';
import Redlock from 'redlock';
export declare type AsyncFunc = () => Promise<unknown>;
declare type OnUseCacheCallback = (data: unknown) => void;
export declare const client: () => Redis;
export declare const newClient: () => Redis;
export declare const cache: (key: string, ageSeconds: number, getDataAsync: AsyncFunc, onUseCache: OnUseCacheCallback) => Promise<any>;
export declare const redlock: () => Promise<Redlock>;
export declare const get_json: (key: string) => Promise<unknown>;
export declare const set_json: (key: string, data: unknown, ageSeconds: number) => Promise<void>;
export declare const once: (key: string, timeSpanMS: number, func: AsyncFunc, onBusy: Function) => Promise<void>;
export {};
