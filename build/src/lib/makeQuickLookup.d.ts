interface PlainObject {
    [k: string]: unknown;
}
declare type AsyncListFunc = () => Promise<Array<PlainObject>>;
declare type IsActiveFunc = (data: PlainObject) => boolean;
declare type QReloadFunc = () => Promise<Array<PlainObject>>;
export declare const makeQuickLookup: (name: string, idField: string, asyncGetAll: AsyncListFunc, isActive: IsActiveFunc, cacheAgeSeconds: number) => {
    reload: QReloadFunc;
    get: (id: string) => Promise<any>;
    getAll: () => Promise<any>;
};
export {};
