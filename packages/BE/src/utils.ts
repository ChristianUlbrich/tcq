import type { Payload } from '@tc39/typings';

//@ts-expect-error
export const generateId4Ch = () => btoa(String.fromCodePoint.apply(null, new Uint8Array([Math.floor(Math.random() * 2 ** 8), Math.floor(Math.random() * 2 ** 8), Math.floor(Math.random() * 2 ** 8)])));

export const generateId = () => Math.random().toString(36).slice(2);

export const merge = (array1: any[], array2: any[]) => [...new Set([...array1, ...array2])];

export const isPayloadError = (value: unknown): value is Payload.error => (value as Payload).event === 'error';
export const makePayloadError = (message: string): Payload.error => ({ event: 'error', data: { message } });
