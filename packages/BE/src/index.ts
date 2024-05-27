import './managerDb';
import './server';
import type { User } from '@tc39/typings';

export type UserInternal = User & {
	lastLogin: string;
	token: string;
};

export type WebSocketData = {
	user: UserInternal;
};

globalThis.CHAIRS = process.env.CHAIRS?.split(',').map(Number) ?? [];
