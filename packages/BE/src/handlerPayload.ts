import type { Meeting, Payload } from '@tc39/typings';
import type { ServerWebSocket } from 'bun';
import type { UserInternal, WebSocketData } from '.';
import { readChairsWithMeetingId, readUserWithId, upsertMeeting } from './handlerStorage';
import { isPayloadError } from './utils';

const readUser = (id: string): Payload.readUser | Payload.error => {
	try {
		return { event: 'readUser', data: readUserWithId(id) };
	} catch (e) {
		console.error(e);
		return { event: 'error', data: { message: 'User not found' } };
	}
};

const setMeeting = (userInternal: UserInternal, meeting: Meeting): Payload.upsertMeeting | Payload.error => {
	try {
		const meetingId = meeting.id;

		let chairs = CHAIRS;
		if (meetingId) chairs = readChairsWithMeetingId(meetingId);
		if (chairs.includes(userInternal.ghId!)) throw new Error('User is not chair');

		upsertMeeting(meeting);
		return { event: 'upsertMeeting', data: meeting };
	} catch (e) {
		console.error(e);
		return { event: 'error', data: { message: 'Meeting upsert failed' } };
	}
};

export const handlePayload = (ws: ServerWebSocket<WebSocketData>, message: Payload): void => {
	switch (message.event) {
		case 'readAgendaItem':
			// ws.send(JSON.stringify({ event: 'readAgendaItem', data: { id: '1', name: 'Agenda Item 1', user: '
			break;
		case 'readMeeting':
			// ws.send(JSON.stringify({ event: 'readMeeting', data: { id: '1', title: 'Meeting 1', startDate: '
			break;
		case 'readTopic':
			// ws.send(JSON.stringify({ event: 'readTopic', data: { id: '1', name: 'Topic 1', user: '
			break;
		case 'readUser':
			ws.send(JSON.stringify(readUser(message.data.id)));
			break;
		case 'upsertAgendaItem':
			//ToDo: Implement upsertAgendaItem properly
			ws.publish('agenda', JSON.stringify({ event: 'upsertAgendaItem', data: message.data }));
			break;
		case 'upsertMeeting': {
			const meetingResp = setMeeting(ws.data.user, message.data);
			if (isPayloadError(meetingResp)) ws.send(JSON.stringify(meetingResp));
			else ws.publish('meeting', JSON.stringify(meetingResp));
			break;
		}
		case 'upsertTopic':
			//ToDo: Implement upsertTopic properly
			ws.publish('topics', JSON.stringify({ event: 'upsertTopic', data: message.data }));
			break;
		default:
			//* Unreachable, unless the validator is broken or the handler is incomplete
			ws.send(JSON.stringify({ event: 'error', data: { message: 'Unknown event' } }));
	}
};
