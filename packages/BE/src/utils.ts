import type { Payload } from '@tc39/typings';

//@ts-expect-error
export const generateId4Ch = () => btoa(String.fromCodePoint.apply(null, new Uint8Array([Math.floor(Math.random() * 2 ** 8), Math.floor(Math.random() * 2 ** 8), Math.floor(Math.random() * 2 ** 8)])));

export const generateId = () => Math.random().toString(36).slice(2);

export const merge = (array1: any[], array2: any[]) => [...new Set([...array1, ...array2])];

export const isPayloadError = (value: unknown): value is Payload.error => (value as Payload).event === 'error';

export const makePayload = <E extends Payload['event'], P extends Extract<Payload, { event: E; }>, D extends P['data']>(jobId: string | null | undefined, event: E, data: D): P => ({ jobId, event, data }) as any;

export const makePayloadError = (message: string) => makePayload(null, 'error', { message });
