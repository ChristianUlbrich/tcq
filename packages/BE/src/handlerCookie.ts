import type { tcqCookie } from '@tc39/typings';

export function findCookie(name: tcqCookie, cookie: string | null | undefined): string | null | undefined {
	// const match = cookie?.match(`/(^| )${name}=([^;]+)/`);
	// return match?.at(2);
	return cookie
		?.split(';')
		.map(c => c.trimStart())
		.find(c => c.startsWith(name))
		?.split('=')
		.at(1);
}

export function createCookie({
	name,
	value,
	secure = true,
	httpOnly = true,
	sameSite = 'Strict',
	maxAge,
	expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
}: { name: tcqCookie; value: string; secure?: boolean; httpOnly?: boolean; sameSite?: string; maxAge?: number; expires?: Date; }) {
	// const expiryDate = new Date();
	// expiryDate.setFullYear(expiryDate.getFullYear() + 1);// 1 year from now
	// __Secure-: If a cookie name has this prefix, it's accepted in a Set-Cookie header only if it's marked with the Secure attribute and was sent from a secure origin.
	return process.env.DEVELOPMENT === 'true'
		? `${name}=${value}; ${maxAge ? `Max-Age=${maxAge}` : `Expires=${expires.toUTCString()}`}`
		: `${name}=${value}; ${secure ? 'Secure; ' : ''}${httpOnly ? 'HttpOnly; ' : ''}SameSite=${sameSite}; ${maxAge ? `Max-Age=${maxAge}` : `Expires=${expires.toUTCString()}`
		}`;
}
