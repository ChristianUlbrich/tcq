import { Server } from 'socket.io';
import type Meeting from '../../shared/dist/Meeting';
import type Message from '../../shared/dist/Messages';
import { authenticateGitHub, checkTokenValidity, fromGHAU, ghAuthUsers } from './User';
import { getMeeting } from './db';
import { deleteAgendaItem, newAgendaItem, nextAgendaItem, reorderAgendaItem } from './handlerAgendaItem';
import { newMeeting } from './handlerMeeting';
import { newReaction, trackTemperature } from './handlerReaction';
import { deleteQueuedSpeaker, newTopic, nextSpeaker, reorderQueue } from './handlerTopic';

const filterPseudoPrivateProperties = (dat: object) => Object.fromEntries(Object.entries(dat).filter(([key]) => !key.startsWith('_')));

const io = new Server(Number(process.env.WSS_PORT ?? 3001));
// , {
// 	allowRequest: async (req: EnhancedIncomingMessage, callback) => {
// 		console.log('allowRequest', req.url, req.headers.cookie);
// 		// const cookie = findCookie('tcqUserId', req.headers.cookie);
// 		// if (!cookie) {
// 		// 	// 	ghAuth();
// 		// 	req.session = { tcqUserId: 'some-random-device-id' };
// 		// 	req.headers['Set-Cookie'] = createCookie({ name: 'tcqUserId', value: req.session.tcqUserId, maxAge: 900 });
// 		// }
// 		const isOriginValid = true;
// 		callback(null, isOriginValid);
// 	}
// }

io.engine.on('connection_error', (err) => {
	console.error(
		//err.req, // the request object
		err.code, // the error code, for example 1
		err.message, // the error message, for example "Session ID unknown"
		err.context // some additional error context
	);
});

// called during the handshake
// io.engine.on('initial_headers', (headers, req: EnhancedIncomingMessage) => {
// 	console.log('initial_headers', req.url, req.headers.cookie, req.session);
// 	headers['Set-Cookie'] = createCookie({ name: 'tcqUserId', value: 'some-random-device-id', maxAge: 900 });
// 	// if (req.session?.tcqUserId) headers['Set-Cookie'] = createCookie({ name: 'tcqUserId', value: req.session.tcqUserId, maxAge: 900 });
// });

// called for each HTTP request (including the WebSocket upgrade)
// io.engine.on('headers', (headers, req: EnhancedIncomingMessage) => {
// 	console.log('headers', req.url, req.headers.cookie);
// 	if (!findCookie('tcqUserId', req.headers.cookie))
// 		return;
// 	console.log('headers', headers);
// });

// io.use(async (socket, next) => {
// 	console.log('use', socket.handshake.auth);
// 	const tcqUserId = socket.handshake.auth.tcqUserId;
// 	const token = ghUsers.get(tcqUserId)?.accessToken;
// 	console.log('use', tcqUserId, token);
// 	socket.emit('use', tcqUserId, token);
// 	if (token && await checkTokenValidity(token))
// 		next();
// 	else
// 		next(new Error("not authorized"));
// });

io.on('connection', async (socket) => {
	// Check auth
	const tcqUserId = socket.handshake.auth.tcqUserId ?? socket.handshake.headers.tcquserid;
	const githubUser = ghAuthUsers.get(tcqUserId);
	if (!githubUser || !await checkTokenValidity(githubUser.accessToken)) {
		const githubVerification = await authenticateGitHub();
		socket.emit('auth', githubVerification);
		socket.disconnect(true);
		return;
	}

	const meetingId = Array.isArray(socket.handshake.query.id) ? socket.handshake.query.id.at(0) : socket.handshake.query.id;
	socket.data = {
		meetingId,
		meeting: meetingId ? await getMeeting(meetingId) : null,
		githubUser,
		user: fromGHAU(githubUser),
	};

	const state: Message.State = {
		...filterPseudoPrivateProperties(socket.data.meeting ?? {}) as Meeting,
		user: socket.data.user
	};
	socket.emit('state', state);


	if (socket.data.meetingId) socket.join(socket.data.meetingId);
	const respond = (status: number, data: object = {}) => socket.emit('response', { ...data, status });

	socket.on('deleteAgendaItemRequest', (data) => deleteAgendaItem(socket, respond, data));
	socket.on('deleteQueuedSpeakerRequest', (data) => deleteQueuedSpeaker(socket, respond, data));
	socket.on('newAgendaItemRequest', (data) => newAgendaItem(socket, respond, data));
	socket.on('newMeetingRequest', (data) => newMeeting(socket, respond, data));
	socket.on('newQueuedSpeakerRequest', (data) => newTopic(socket, respond, data));
	socket.on('newReactionRequest', (data) => newReaction(socket, respond, data));
	socket.on('nextAgendaItemRequest', (data) => nextAgendaItem(socket, respond, data));
	socket.on('nextSpeaker', (data) => nextSpeaker(socket, respond, data));
	socket.on('reorderAgendaItemRequest', (data) => reorderAgendaItem(socket, respond, data));
	socket.on('reorderQueueRequest', (data) => reorderQueue(socket, respond, data));
	socket.on('trackTemperatureRequest', (data) => trackTemperature(socket, respond, data));
});
