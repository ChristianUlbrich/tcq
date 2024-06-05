import { Server, type Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import type AgendaItem from '../../shared/dist/AgendaItem.js';
import type * as Message from '../../shared/dist/Messages.js';
import type Reaction from '../../shared/dist/Reaction.js';
import type Speaker from '../../shared/dist/Speaker.js';
import type User from '../../shared/dist/User.js';
import { checkTokenValidity, authenticateGitHub, fromGHAU, getByUsername, ghAuthUsers, isChair } from './User.js';
import { getMeeting, updateMeeting } from './db.js';

type Responder = (code: number, message?: object) => void;

const io = new Server(Number(process.env.WSS_PORT ?? 3001), {
	// allowRequest: async (req: EnhancedIncomingMessage, callback) => {
	// 	console.log('allowRequest', req.url, req.headers.cookie);
	// 	// const cookie = findCookie('tcqUserId', req.headers.cookie);
	// 	// if (!cookie) {
	// 	// 	// 	ghAuth();
	// 	// 	req.session = { tcqUserId: 'some-random-device-id' };
	// 	// 	req.headers['Set-Cookie'] = createCookie({ name: 'tcqUserId', value: req.session.tcqUserId, maxAge: 900 });
	// 	// }
	// 	const isOriginValid = true;
	// 	callback(null, isOriginValid);
	// }
});
const PRIORITIES: Speaker['type'][] = ['poo', 'question', 'reply', 'topic'];
const socks = new Map<string, Set<Socket>>();

const emitAll = (meetingId: string, type: string, arg?: any) => {
	const ss = socks.get(meetingId);
	if (!ss) return;

	ss.forEach(s => s.emit(type as any, arg));
};

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
		socket.emit('state', githubVerification);
		socket.disconnect(true);
		return;
	}


	const meetingId = socket.handshake.query.id?.at(0);
	if (!meetingId) {
		socket.emit('state', { status: 400, message: 'Bad meeting id' });
		socket.disconnect();
		return;
	}

	let meetingSocks = socks.get(meetingId);
	if (!meetingSocks) {
		meetingSocks = new Set();
		socks.set(meetingId, meetingSocks);
	}

	meetingSocks.add(socket);

	const user: User = fromGHAU(githubUser);

	const meeting = await getMeeting(meetingId);

	const state: Message.State = Object.keys(meeting ?? {})
		.filter(k => k[0] !== '_')
		.reduce((s, k) => {
			(s as any)[k] = (meeting as any)[k];
			return s;
		}, {}) as any;

	state.user = user;

	socket.emit('state', state);
	socket.on('newQueuedSpeakerRequest', instrumentSocketFn(newTopic));
	socket.on('deleteQueuedSpeakerRequest', instrumentSocketFn(deleteQueuedSpeaker));
	socket.on('nextSpeaker', instrumentSocketFn(nextSpeaker));
	socket.on('disconnect', disconnect);
	socket.on('newAgendaItemRequest', instrumentSocketFn(newAgendaItem));
	socket.on('reorderAgendaItemRequest', instrumentSocketFn(reorderAgendaItem));
	socket.on('reorderQueueRequest', instrumentSocketFn(reorderQueue));
	socket.on('deleteAgendaItemRequest', instrumentSocketFn(deleteAgendaItem));
	socket.on('nextAgendaItemRequest', instrumentSocketFn(nextAgendaItem));
	socket.on('newReactionRequest', instrumentSocketFn(newReaction));
	socket.on('trackTemperatureRequest', instrumentSocketFn(trackTemperature));
	// ToDo - add newMeetingRequest
	// socket.on('newMeetingRequest', instrumentSocketFn(newMeeting));

	async function nextAgendaItem(respond: Responder, message: Message.NextAgendaItemRequest) {
		const meeting = await getMeeting(meetingId!);
		if (!meeting) {
			respond(500, { message: 'Problem(s) finding meeting' });
			return;
		}

		if (meeting.currentAgendaItem && meeting.currentAgendaItem.id !== message.currentItemId) {
			respond(403, { message: 'Agenda item out of sync' });
			return;
		}

		if (!meeting.currentAgendaItem) {
			// waiting for meeting to start, so kick it off.
			meeting.currentAgendaItem = meeting.agenda[0];
		} else {
			const id = meeting.currentAgendaItem.id;
			const currentIndex = meeting.agenda.findIndex(i => i.id === id);
			meeting.currentAgendaItem = meeting.agenda[currentIndex + 1];
		}

		meeting.currentSpeaker = {
			id: uuid(),
			user: meeting.currentAgendaItem.user,
			topic: `Introducing: ${meeting.currentAgendaItem.name}`,
			type: 'topic'
		};

		await updateMeeting(meeting);
		respond(200);
		emitAll(meetingId!, 'nextAgendaItem', meeting.currentAgendaItem);
		emitAll(meetingId!, 'newCurrentSpeaker', meeting.currentSpeaker);
	}

	async function deleteAgendaItem(respond: Responder, message: Message.DeleteAgendaItem) {
		const meeting = await getMeeting(meetingId!);
		if (!meeting) {
			respond(500, { message: 'Problem(s) finding meeting' });
			return;
		}

		if (!isChair(user, meeting)) {
			respond(403);
			return;
		}
		meeting.agenda.splice(message.index, 1);
		await updateMeeting(meeting);

		respond(200);
		emitAll(meetingId!, 'deleteAgendaItem', message);
	}

	async function reorderAgendaItem(respond: Responder, message: Message.ReorderAgendaItemRequest) {
		const meeting = await getMeeting(meetingId!);
		if (!meeting) {
			respond(500, { message: 'Problem(s) finding meeting' });
			return;
		}

		if (!isChair(user, meeting)) {
			respond(403);
			return;
		}

		meeting.agenda.splice(message.newIndex, 0, meeting.agenda.splice(message.oldIndex, 1)[0]);
		await updateMeeting(meeting);
		respond(200);
		emitAll(meetingId!, 'reorderAgendaItem', message);
	}

	async function reorderQueue(respond: Responder, message: Message.ReorderQueueRequest) {
		const meeting = await getMeeting(meetingId!);
		if (!meeting) {
			respond(500, { message: 'Problem(s) finding meeting' });
			return;
		}

		if (!isChair(user, meeting)) {
			respond(403);
			return;
		}

		const item = meeting.queuedSpeakers[message.oldIndex];

		if (!item) {
			respond(500, { message: 'Could not find queue item' });
			return;
		}

		if (item.id !== message.id) {
			respond(500, { message: 'Stale request, denied' });
			return;
		}

		if (message.newIndex < 0 || message.newIndex >= meeting.queuedSpeakers.length) {
			respond(400, { message: 'Cant move past beginning or end' });
		}

		if (
			Math.abs(message.newIndex - message.oldIndex) === 1 &&
			meeting.queuedSpeakers[message.newIndex].type !==
			meeting.queuedSpeakers[message.oldIndex].type
		) {
			// we're moving across a type boundary, so just update the type.
			meeting.queuedSpeakers[message.oldIndex].type = meeting.queuedSpeakers[message.newIndex].type;
			await updateMeeting(meeting);
			respond(200);
			emitAll(meetingId!, 'updateQueuedSpeaker', meeting.queuedSpeakers[message.oldIndex]);
		} else {
			// actually move the speaker
			meeting.queuedSpeakers.splice(
				message.newIndex,
				0,
				meeting.queuedSpeakers.splice(message.oldIndex, 1)[0]
			);
			await updateMeeting(meeting);
			respond(200);
			emitAll(meetingId!, 'reorderQueue', message);
		}
	}

	async function newAgendaItem(respond: Responder, message: Message.NewAgendaItemRequest) {
		const meeting = await getMeeting(meetingId!);
		if (!meeting) {
			respond(500, { message: 'Problem(s) finding meeting' });
			return;
		}

		if (!isChair(user, meeting)) {
			respond(403);
			return;
		}

		// populate the agenda item owner's user data from github if necessary
		let owner: User;

		try {
			owner = await getByUsername(message.ghUsername, githubUser!.accessToken);
		} catch (e) {
			respond(400, { message: 'Github username not found' });
			return;
		}

		const agendaItem: AgendaItem = {
			id: uuid(),
			name: message.name,
			timebox: Number(message.timebox),
			user: owner
		};

		meeting.agenda.push(agendaItem);
		await updateMeeting(meeting);
		emitAll(meetingId!, 'newAgendaItem', agendaItem);
		respond(200);
	}

	async function newTopic(respond: Responder, message: Message.NewQueuedSpeakerRequest) {
		const speaker: Speaker = {
			user,
			...message
		};

		const meeting = await getMeeting(meetingId!);
		if (!meeting) {
			respond(500, { message: 'Problem(s) finding meeting' });
			return;
		}

		const { currentSpeaker, queuedSpeakers } = meeting;

		let index = queuedSpeakers.findIndex((queuedSpeaker) => PRIORITIES.indexOf(queuedSpeaker.type) > PRIORITIES.indexOf(speaker.type));

		if (index === -1) {
			index = queuedSpeakers.length;
		}

		queuedSpeakers.splice(index, 0, speaker);

		await updateMeeting(meeting);
		emitAll(meetingId!, 'newQueuedSpeaker', {
			position: index,
			speaker: speaker
		});
		respond(200);
	}

	async function newReaction(respond: Responder, message: Message.NewReactionRequest) {
		const reaction: Reaction = {
			user: user,
			reaction: message.reactionType
		};

		const meeting = await getMeeting(meetingId!);
		if (!meeting) {
			respond(500, { message: 'Problem(s) finding meeting' });
			return;
		}

		if (!meeting.reactions) {
			meeting.reactions = [];
		}

		const { reactions } = meeting;

		const index = reactions.findIndex((r) => r.reaction === reaction.reaction && r.user.ghid === reaction.user.ghid
		);

		if (index === -1) {
			reactions.push(reaction);
			await updateMeeting(meeting);
			emitAll(meetingId!, 'newReaction', reaction);
		} else {
			reactions.splice(index, 1);
			await updateMeeting(meeting);
			emitAll(meetingId!, 'deleteReaction', reaction);
		}
		respond(200);
	}

	async function trackTemperature(respond: Responder, message: Message.TrackTemperatureRequest) {
		const meeting = await getMeeting(meetingId!);
		if (!meeting) {
			respond(500, { message: 'Problem(s) finding meeting' });
			return;
		}

		if (!message.track) {
			meeting.reactions = [];
			await updateMeeting(meeting);
		}
		meeting.trackTemperature = message.track;
		emitAll(meetingId!, 'trackTemperature', message.track);
	}

	async function deleteQueuedSpeaker(
		respond: Responder,
		message: Message.DeleteQueuedSpeakerRequest
	) {
		const meeting = await getMeeting(meetingId!);
		if (!meeting) {
			respond(500, { message: 'Problem(s) finding meeting' });
			return;
		}

		const { queuedSpeakers } = meeting;

		const index = queuedSpeakers.findIndex((queuedSpeaker) => queuedSpeaker.id === message.id);

		if (index === -1) {
			respond(404);
			return;
		}

		if (!isChair(user, meeting) && queuedSpeakers[index].user.ghid !== user.ghid) {
			// unauthorized
			respond(403, { message: 'not authorized' });
			return;
		}

		queuedSpeakers.splice(index, 1);

		await updateMeeting(meeting);
		emitAll(meetingId!, 'deleteQueuedSpeaker', message);
		respond(200);
	}

	async function nextSpeaker(respond: Responder, message: Message.NextSpeakerRequest) {
		const meeting = await getMeeting(meetingId!);
		if (!meeting) {
			respond(500, { message: 'Problem(s) finding meeting' });
			return;
		}

		if (
			user.ghid &&
			meeting.currentSpeaker &&
			meeting.currentSpeaker.user.ghid !== user.ghid &&
			!isChair(user, meeting)
		) {
			// unauthorized
			respond(402, { message: 'not authorized' });
			return;
		}

		if (meeting.currentSpeaker && meeting.currentSpeaker.id !== message.currentSpeakerId) {
			respond(400, { message: 'stale state, next speaker ignored' });
			return;
		}
		const oldTopic = meeting.currentTopic;
		if (meeting.queuedSpeakers.length === 0) {
			if (meeting.currentAgendaItem) {
				meeting.currentSpeaker = {
					id: uuid(),
					user: meeting.currentAgendaItem.user,
					topic: `Presenting: ${meeting.currentAgendaItem.name}`,
					type: 'topic'
				};
			} else {
				// not sure if this can happen with current meeting flow
				meeting.currentSpeaker = undefined;
			}
			meeting.currentTopic = undefined;
		} else {
			meeting.currentSpeaker = meeting.queuedSpeakers.shift()!;
			if (meeting.currentSpeaker.type === 'topic') {
				meeting.currentTopic = meeting.currentSpeaker;
			}
		}

		await updateMeeting(meeting);
		respond(200);
		emitAll(meetingId!, 'newCurrentSpeaker', meeting.currentSpeaker);
		if (oldTopic !== meeting.currentTopic) {
			emitAll(meetingId!, 'newCurrentTopic', meeting.currentTopic);
		}
	}

	function instrumentSocketFn(fn: (r: Responder, ...args: any[]) => Promise<any>) {
		let start: number;

		function respond(status: number, message = { status: -1 } as any) {
			message.status = status;
			socket.emit('response', message);
		}

		return (...args: any[]) => {
			start = Date.now();
			fn.call(undefined, respond, ...args);
		};
	}

	function disconnect() {
		if (!meetingSocks) return;
		meetingSocks.delete(socket);

		if (meetingSocks.size === 0) {
			socks.delete(meetingId!);
		}
	}
});
