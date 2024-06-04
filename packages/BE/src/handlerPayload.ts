import type { Payload, Topic } from '@tc39/typings';
import type { ServerWebSocket } from 'bun';
import type { WebSocketData } from '.';
import { readAgenda, readAgendaItemWithId, readChairsWithMeetingId, readMeeting, readMeetingWithId, readQueue, readTopicWithId, readUserWithId, upsertAgendaItem, upsertMeeting, upsertTopic } from './handlerStorage';
import { isPayloadError, makePayload, makePayloadError } from './utils';

type WSD = ServerWebSocket<WebSocketData>;
type Sender = <E extends Payload['event'], P extends Extract<Payload, { event: E; }>, D extends P['data']>(event: E, fn: (data: D) => D, errorMsg?: string) => (ws: WSD, msg: P) => void;

const send: Sender = (event, fn, errorMsg) => (ws, msg) => {
	let ret: Payload;
	try {
		ret = makePayload(msg.jobId, event, fn(msg.data as any) as any);
	} catch (e) {
		console.error(e);
		ret = makePayloadError(errorMsg ?? (e as Error).message);
	}

	ws.send(JSON.stringify(ret));
};


const getAgenda = send('getAgenda', readAgenda, 'Agenda not found');
const getQueue = send('getQueue', readQueue, 'Queue not found');
const getAgendaItem = send('getAgendaItem', ({ id }) => readAgendaItemWithId(id));
const getMeeting = send('getMeeting', (data) => readMeeting(data));
const getTopic = send('getTopic', ({ id }) => readTopicWithId(id));
const getUser = send('getUser', ({ id }) => readUserWithId(id));


const setAgendaItem = (ws: WSD, msg: Payload.setAgendaItem) => {
	const notifyMeeting = !msg.data.id;
	let agendaItemResp: Payload.setAgendaItem | Payload.error;
	try {
		const meetingId = msg.data.meetingId;

		let chairs = CHAIRS;
		if (meetingId) chairs = readChairsWithMeetingId(meetingId);
		if (!ws.data.user.ghId || !chairs.includes(ws.data.user.ghId)) throw new Error('User is not chair');

		const newAgendaItem = upsertAgendaItem(msg.data);
		agendaItemResp = { jobId: msg.jobId, event: 'setAgendaItem', data: newAgendaItem };
	} catch (e) {
		console.error(e);
		agendaItemResp = makePayloadError('Agenda Item upsert failed');
	}

	ws.send(JSON.stringify(Object.assign({ jobId: msg.jobId }, agendaItemResp)));

	if (!isPayloadError(agendaItemResp)) {
		const agenda = makePayload(msg.jobId, 'getAgenda', readAgenda(msg.data));
		ws.publish('agenda', JSON.stringify(agenda));

		if (notifyMeeting) {
			const meeting = makePayload(msg.jobId, 'getMeeting', readMeetingWithId(msg.data.meetingId));
			ws.publish('meeting', JSON.stringify(meeting));
		}
	}
};

const setMeeting = (ws: WSD, msg: Payload.setMeeting) => {
	let meetingResp: Payload.setMeeting | Payload.error;
	try {
		const meetingId = msg.data.id;

		let chairs = CHAIRS;
		if (meetingId) chairs = readChairsWithMeetingId(meetingId);
		if (!ws.data.user.ghId || !chairs.includes(ws.data.user.ghId)) throw new Error('User is not chair');

		const newMeeting = upsertMeeting(msg.data);
		meetingResp = { jobId: msg.jobId, event: 'setMeeting', data: newMeeting };
	} catch (e) {
		console.error(e);
		meetingResp = makePayloadError('Meeting upsert failed');
	}

	ws.send(JSON.stringify(meetingResp));
	if (!isPayloadError(meetingResp)) {
		ws.publish('meeting', JSON.stringify(meetingResp));
	}
};

const setTopic = (ws: WSD, msg: Payload.setTopic) => {
	const notifyAgenda = !msg.data.id;
	let topicResp: Payload.setTopic | Payload.error;
	try {
		let newTopic: Topic & { id: string; };
		if (msg.data.id) {
			const topicData = readTopicWithId(msg.data.id);
			if (ws.data.user.ghId === topicData.userGhId || (ws.data.user.ghId && CHAIRS.includes(ws.data.user.ghId))) {
				newTopic = upsertTopic(msg.data);
			} else {
				throw new Error('User is not allowed to edit this topic');
			}
		} else {
			newTopic = upsertTopic(msg.data);
		}

		topicResp = { jobId: msg.jobId, event: 'setTopic', data: newTopic };
	} catch (e) {
		console.error(e);
		topicResp = makePayloadError('Topic upsert failed');
	}

	ws.send(JSON.stringify(topicResp));

	if (!isPayloadError(topicResp)) {
		const queue = makePayload(msg.jobId, 'getQueue', readQueue(msg.data));
		ws.publish('queue', JSON.stringify(queue));

		if (notifyAgenda) {
			const agenda = makePayload(msg.jobId, 'setAgendaItem', readAgendaItemWithId(msg.data.agendaItemId));
			ws.publish('agenda', JSON.stringify(agenda));
		}
	}
};


export const handlePayload = (ws: WSD, message: Payload): void => {
	switch (message.event) {
		case 'getAgenda':
			getAgenda(ws, message);
			return;
		case 'getAgendaItem':
			getAgendaItem(ws, message);
			return;
		case 'getMeeting':
			getMeeting(ws, message);
			return;
		case 'getQueue':
			getQueue(ws, message);
			return;
		case 'getTopic':
			getTopic(ws, message);
			return;
		case 'getUser':
			getUser(ws, message);
			return;
		case 'setAgendaItem':
			setAgendaItem(ws, message);
			return;
		case 'setMeeting':
			setMeeting(ws, message);
			return;
		case 'setTopic':
			setTopic(ws, message);
			return;
		default:
			//* Unreachable, unless the validator is broken or the handler is incomplete
			ws.send(JSON.stringify(makePayload(message.jobId, 'error', { message: 'Unknown event' })));
	}
};
