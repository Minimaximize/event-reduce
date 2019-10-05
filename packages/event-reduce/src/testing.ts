import { getObservableProperty } from "./decorators";
import { event } from "./events";

export function mutable<T>(model: T): Mutable<T> {
    if (model && typeof model == 'object' && !Array.isArray(model)) {
        for (let [key, base] of allProperties(model)) {
            let observableValue = getObservableProperty(model, key)!;

            if (observableValue) {
                Object.defineProperty(model, key, {
                    get() { return observableValue.value; },
                    set(value) {
                        observableValue.unsubscribeFromSources();
                        observableValue.setValue(value);
                    },
                    enumerable: base.enumerable,
                    configurable: true
                });
            }
        }

        Object.defineProperty(model, 'readonly', { get: () => model, configurable: true });
    }
    return model as Mutable<T>;
}

function allProperties(obj: unknown) {
    let props = new Map<string, PropertyDescriptor>();
    while (obj != Object.prototype) {
        Object.entries(Object.getOwnPropertyDescriptors(obj))
            .filter(([key]) => !props.has(key))
            .forEach(([key, property]) => props.set(key, property));
        obj = Object.getPrototypeOf(obj);
    }
    return props;
}

export type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
} & {
    /** The model as the original type */
    readonly readonly: T;
}

export function eventProxy<T = any>(): T;
export function eventProxy<TEvent extends (...args: any[]) => void>(createEvent: () => TEvent): { [key: string]: TEvent };
export function eventProxy<TEvent extends (...args: any[]) => void, T = any>(createEvent: () => TEvent): T & { [P in keyof T]: TEvent };
export function eventProxy(createEvent: () => any = event) {
    let event = createEvent();
    return new Proxy(event, {
        get(target: any, key: PropertyKey) {
            if (typeof key == 'string')
                return target[key] || (target[key] = eventProxy(createEvent));
        },

        apply(target: any, thisArg: any, argArray?: any) {
            event(...argArray);
        }
    });
}