import type { Socket } from 'socket.io';
import type { Responder } from '.';
import type Meeting from '../../shared/dist/Meeting';
import type Message from '../../shared/dist/Messages';
import type User from '../../shared/dist/User';
import { getByUsernames } from './User';
import { createMeeting } from './db';

export async function newMeeting(socket: Socket, respond: Responder, message: Message.NewMeetingRequest) {
	const chairs = Array.isArray(message.chairs) ? message.chairs : [message.chairs];
	// replace leading @ from usernames
	const usernames = chairs.map(c => c.replace(/^@/, ''));

	let chairUsers: User[] = [];
	try {
		chairUsers = await getByUsernames(usernames);
	} catch (e) {
		respond(400, { message: (e as Error).message });
		return;
	}

	//@ts-expect-error
	const id = btoa(String.fromCodePoint.apply(null, new Uint8Array([Math.floor(Math.random() * 2 ** 8), Math.floor(Math.random() * 2 ** 8), Math.floor(Math.random() * 2 ** 8)])));

	const meeting: Meeting = {
		chairs: chairUsers,
		currentAgendaItem: undefined,
		currentSpeaker: undefined,
		currentTopic: undefined,
		timeboxEnd: undefined,
		timeboxSecondsLeft: undefined,
		agenda: [],
		queuedSpeakers: [],
		reactions: [],
		trackTemperature: false,
		id,
		partitionKey: process.env.DB_PARTITION_VALUE ?? 'tc39'
	};

	createMeeting(meeting);
	socket.data.meetingId = id;
	socket.data.meeting = meeting;
	// leave all rooms except the new meeting room
	socket.rooms.forEach((room) => {
		if (room !== socket.id) socket.leave(room);
	});
	socket.join(id);
	respond(200);
	socket.emit('newMeeting', meeting);
}
