import type { Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import type AgendaItem from '../../shared/dist/AgendaItem';
import type Message from '../../shared/dist/Messages';
import type User from '../../shared/dist/User';
import { getByUsername, isChair } from './User';
import { getMeeting, updateMeeting } from './db';
import type { Responder } from '.';

export async function deleteAgendaItem(socket: Socket, respond: Responder, message: Message.DeleteAgendaItem) {
	const meeting = socket.data.meetingId ? await getMeeting(socket.data.meetingId) : null;
	if (!meeting) {
		respond(500, { message: 'Problem(s) finding meeting' });
		return;
	}

	if (!isChair(socket.data.user, meeting)) {
		respond(403);
		return;
	}
	meeting.agenda.splice(message.index, 1);
	await updateMeeting(meeting);

	respond(200);
	socket.to(socket.data.meetingId).emit('deleteAgendaItem', message);
}

export async function newAgendaItem(socket: Socket, respond: Responder, message: Message.NewAgendaItemRequest) {
	const meeting = socket.data.meetingId ? await getMeeting(socket.data.meetingId) : null;
	if (!meeting) {
		respond(500, { message: 'Problem(s) finding meeting' });
		return;
	}

	if (!isChair(socket.data.user, meeting)) {
		respond(403);
		return;
	}

	// populate the agenda item owner's user data from github if necessary
	let owner: User;

	try {
		owner = await getByUsername(message.ghUsername, socket.data.githubUser.accessToken);
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
	socket.to(socket.data.meetingId).emit('newAgendaItem', agendaItem);
	respond(200);
}

export async function nextAgendaItem(socket: Socket, respond: Responder, message: Message.NextAgendaItemRequest) {
	const meeting = socket.data.meetingId ? await getMeeting(socket.data.meetingId) : null;
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
	socket.to(socket.data.meetingId).emit('nextAgendaItem', meeting.currentAgendaItem);
	socket.to(socket.data.meetingId).emit('newCurrentSpeaker', meeting.currentSpeaker);
}

export async function reorderAgendaItem(socket: Socket, respond: Responder, message: Message.ReorderAgendaItemRequest) {
	const meeting = socket.data.meetingId ? await getMeeting(socket.data.meetingId) : null;
	if (!meeting) {
		respond(500, { message: 'Problem(s) finding meeting' });
		return;
	}

	if (!isChair(socket.data.user, meeting)) {
		respond(403);
		return;
	}

	meeting.agenda.splice(message.newIndex, 0, meeting.agenda.splice(message.oldIndex, 1)[0]);
	await updateMeeting(meeting);
	respond(200);
	socket.to(socket.data.meetingId).emit('reorderAgendaItem', message);
}
