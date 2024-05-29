import { serve } from 'bun';
import type { WebSocketData } from '.';
import { authenticate } from './authenticator';
import { authenticateGitHub } from './authenticatorGitHub';
import { createCookie, findCookie } from './handlerCookie';
import { handlePayload } from './handlerPayload';
import { ValidationErrorPayloadInvalid, ValidationErrorPayloadMalformed, validate } from './validator';

const server = serve<WebSocketData>({
	development: process.env.DEVELOPMENT === 'true',
	port: process.env.WSS_PORT ?? 3001,
	fetch(req, server) {
		return (
			authenticate(findCookie('tcqUserId', req.headers.get('Cookie')))
				.then(user =>
					server.upgrade(req, {
						// Update Cookie (expire time, etc.)
						headers: { 'Set-Cookie': createCookie({ name: 'tcqUserId', value: user.id }), },
						// This data is made available on the ws.data property inside the WebSocket handlers.
						data: { user },
					}),
				)
				// return nothing, when the upgrade is successful
				.then(success => (success ? undefined : new Response('Upgrade failed', { status: 500 })))
				.catch(error => {
					console.error(error);
					if (new URL(req.url).pathname === '/login') return authenticateGitHub();
					return new Response(null, { status: 401 });
				})
		);
	},
	websocket: {
		message(ws, message) {
			try {
				const data = JSON.parse(message instanceof Buffer ? message.toString('utf8') : message);
				if (validate(data)) handlePayload(ws, data);
				else ws.send(JSON.stringify(ValidationErrorPayloadInvalid(validate.errors ?? [])));
				validate.errors?.forEach(e => console.error(e));
			} catch (e) {
				console.error(e);
				const error = e instanceof SyntaxError
					? ValidationErrorPayloadMalformed
					: { event: 'error', data: { message: 'Unknown error' } };
				ws.send(JSON.stringify(error));
			}
		},
		open(ws) {
			// @see type Subscription
			ws.subscribe('meeting');
			ws.subscribe('agenda');
			ws.subscribe('topics');
			ws.subscribe('polls');
		},
		close(ws, code, message) {
			// @see type Subscription
			ws.unsubscribe('meeting');
			ws.unsubscribe('agenda');
			ws.unsubscribe('topics');
			ws.unsubscribe('polls');
		},
		drain(ws) { }, // the socket is ready to receive more data
	},
});

console.debug('Development:', process.env.DEVELOPMENT);
console.log(`Listening on http://localhost:${server.port}`);
