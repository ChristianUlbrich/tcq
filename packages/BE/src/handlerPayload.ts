import type { AgendaItem, Meeting, Payload, Topic } from '@tc39/typings';
import type { ServerWebSocket } from 'bun';
import type { UserInternal, WebSocketData } from '.';
import { readAgendaItemWithId, readChairsWithMeetingId, readMeetingWithId, readTopicWithId, readUserWithId, upsertAgendaItem, upsertMeeting, upsertTopic } from './handlerStorage';
import { isPayloadError, makePayloadError } from './utils';

const getUser = (id: string): Payload.getUser | Payload.error => {
	try {
		return { event: 'getUser', data: readUserWithId(id) };
	} catch (e) {
		console.error(e);
		return makePayloadError('User not found');
	}
};

const getMeeting = (id: string): Payload.getMeeting | Payload.error => {
	try {
		return { event: 'getMeeting', data: readMeetingWithId(id) };
	} catch (e) {
		console.error(e);
		return makePayloadError('Meeting not found');
	}
};

const setMeeting = (userInternal: UserInternal, meeting: Meeting): Payload.setMeeting | Payload.error => {
	try {
		const meetingId = meeting.id;

		let chairs = CHAIRS;
		if (meetingId) chairs = readChairsWithMeetingId(meetingId);
		if (!userInternal.ghId || !chairs.includes(userInternal.ghId)) throw new Error('User is not chair');

		const newMeeting = upsertMeeting(meeting);
		return { event: 'setMeeting', data: newMeeting };
	} catch (e) {
		console.error(e);
		return makePayloadError('Meeting upsert failed');
	}
};

const getAgendaItem = (id: string): Payload.getAgendaItem | Payload.error => {
	try {
		return { event: 'getAgendaItem', data: readAgendaItemWithId(id) };
	} catch (e) {
		console.error(e);
		return makePayloadError('Agenda Item not found');
	}
};

const setAgendaItem = (userInternal: UserInternal, agendaItem: AgendaItem): Payload.setAgendaItem | Payload.error => {
	try {
		const meetingId = agendaItem.meetingId;

		let chairs = CHAIRS;
		if (meetingId) chairs = readChairsWithMeetingId(meetingId);
		if (!userInternal.ghId || !chairs.includes(userInternal.ghId)) throw new Error('User is not chair');

		const newAgendaItem = upsertAgendaItem(agendaItem);
		return { event: 'setAgendaItem', data: newAgendaItem };
	} catch (e) {
		console.error(e);
		return makePayloadError('Agenda Item upsert failed');
	}
};

const getTopic = (id: string): Payload.getTopic | Payload.error => {
	try {
		return { event: 'getTopic', data: readTopicWithId(id) };
	} catch (e) {
		console.error(e);
		return makePayloadError('Topic not found');
	}
};

const setTopic = (userInternal: UserInternal, topic: Topic): Payload.setTopic | Payload.error => {
	try {
		let newTopic: Topic & { id: string; };
		if (topic.id) {
			const topicData = readTopicWithId(topic.id);
			if (userInternal.ghId === topicData.userGhId || (userInternal.ghId && CHAIRS.includes(userInternal.ghId))) {
				newTopic = upsertTopic(topic);
			} else {
				throw new Error('User is not allowed to edit this topic');
			}
		} else {
			newTopic = upsertTopic(topic);
		}

		return { event: 'setTopic', data: newTopic };
	} catch (e) {
		console.error(e);
		return makePayloadError('Topic upsert failed');
	}
};

export const handlePayload = (ws: ServerWebSocket<WebSocketData>, message: Payload): void => {
	switch (message.event) {
		case 'getAgendaItem':
			ws.send(JSON.stringify(Object.assign({ jobId: message.jobId }, getAgendaItem(message.data.id))));
			break;
		case 'getMeeting':
			ws.send(JSON.stringify(Object.assign({ jobId: message.jobId }, getMeeting(message.data.id))));
			break;
		case 'getTopic':
			ws.send(JSON.stringify(Object.assign({ jobId: message.jobId }, getTopic(message.data.id))));
			break;
		case 'getUser':
			ws.send(JSON.stringify(Object.assign({ jobId: message.jobId }, getUser(message.data.id))));
			break;
		case 'setAgendaItem': {
			const notifyMeeting = !message.data.id;
			const agendaItemResp = setAgendaItem(ws.data.user, message.data);

			ws.send(JSON.stringify(Object.assign({ jobId: message.jobId }, agendaItemResp)));
			if (!isPayloadError(agendaItemResp)) {
				ws.publish('agenda', JSON.stringify(agendaItemResp));
				notifyMeeting && ws.publish('meeting', JSON.stringify({ event: 'setMeeting', data: readMeetingWithId(message.data.meetingId) }));
			}
			break;
		}
		case 'setMeeting': {
			const meetingResp = setMeeting(ws.data.user, message.data);

			ws.send(JSON.stringify(Object.assign({ jobId: message.jobId }, meetingResp)));
			if (!isPayloadError(meetingResp)) {
				ws.publish('meeting', JSON.stringify(meetingResp));
			}
			break;
		}
		case 'setTopic': {
			const notifyAgenda = !message.data.id;
			const topicResp = setTopic(ws.data.user, message.data);

			ws.send(JSON.stringify(Object.assign({ jobId: message.jobId }, topicResp)));
			if (!isPayloadError(topicResp)) {
				ws.publish('topics', JSON.stringify(topicResp));
				notifyAgenda && ws.publish('agenda', JSON.stringify({ event: 'setAgendaItem', data: readAgendaItemWithId(message.data.agendaItemId) }));
			}
			break;
		}
		default:
			//* Unreachable, unless the validator is broken or the handler is incomplete
			ws.send(JSON.stringify(Object.assign({ jobId: message.jobId }, makePayloadError('Unknown event'))));
	}
};
