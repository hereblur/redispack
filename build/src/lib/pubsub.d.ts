interface PlainObject {
    [k: string]: unknown;
}
declare type ListenerFunc = (data: PlainObject) => void;
interface Listeners {
    [k: string]: ListenerFunc;
}
export declare const pub: (key: string, data: unknown) => Promise<void>;
export declare const sub: (listeners: Listeners) => Promise<() => void>;
export {};
