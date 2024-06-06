import type { Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import type { Responder } from '.';
import type Message from '../../shared/dist/Messages';
import type Speaker from '../../shared/dist/Speaker';
import { isChair } from './User';
import { getMeeting, updateMeeting } from './db';

const PRIORITIES: Speaker['type'][] = ['poo', 'question', 'reply', 'topic'];

export async function deleteQueuedSpeaker(socket: Socket, respond: Responder, message: Message.DeleteQueuedSpeakerRequest) {
	const meeting = socket.data.meetingId ? await getMeeting(socket.data.meetingId) : null;
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

	if (!isChair(socket.data.user, meeting) && queuedSpeakers[index].user.ghid !== socket.data.user.ghid) {
		// unauthorized
		respond(403, { message: 'not authorized' });
		return;
	}

	queuedSpeakers.splice(index, 1);

	await updateMeeting(meeting);
	socket.to(socket.data.meetingId).emit('deleteQueuedSpeaker', message);
	respond(200);
}

export async function newTopic(socket: Socket, respond: Responder, message: Message.NewQueuedSpeakerRequest) {
	const meeting = socket.data.meetingId ? await getMeeting(socket.data.meetingId) : null;
	if (!meeting) {
		respond(500, { message: 'Problem(s) finding meeting' });
		return;
	}

	const speaker: Speaker = {
		user: socket.data.user,
		...message
	};

	const { queuedSpeakers } = meeting;

	let index = queuedSpeakers.findIndex((queuedSpeaker) => PRIORITIES.indexOf(queuedSpeaker.type) > PRIORITIES.indexOf(speaker.type));

	if (index === -1) {
		index = queuedSpeakers.length;
	}

	queuedSpeakers.splice(index, 0, speaker);

	await updateMeeting(meeting);
	socket.to(socket.data.meetingId).emit('newQueuedSpeaker', {
		position: index,
		speaker: speaker
	});
	respond(200);
}

export async function nextSpeaker(socket: Socket, respond: Responder, message: Message.NextSpeakerRequest) {
	const meeting = socket.data.meetingId ? await getMeeting(socket.data.meetingId) : null;
	if (!meeting) {
		respond(500, { message: 'Problem(s) finding meeting' });
		return;
	}

	if (
		socket.data.user.ghid &&
		meeting.currentSpeaker &&
		meeting.currentSpeaker.user.ghid !== socket.data.user.ghid &&
		!isChair(socket.data.user, meeting)
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
	socket.to(socket.data.meetingId).emit('nextSpeaker', meeting.currentSpeaker);
	if (oldTopic !== meeting.currentTopic) {
		socket.to(socket.data.meetingId).emit('newCurrentTopic', meeting.currentTopic);
	}
}

export async function reorderQueue(socket: Socket, respond: Responder, message: Message.ReorderQueueRequest) {
	const meeting = socket.data.meetingId ? await getMeeting(socket.data.meetingId) : null;
	if (!meeting) {
		respond(500, { message: 'Problem(s) finding meeting' });
		return;
	}

	if (!isChair(socket.data.user, meeting)) {
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
		socket.to(socket.data.meetingId).emit('updateQueuedSpeaker', meeting.queuedSpeakers[message.oldIndex]);
	} else {
		// actually move the speaker
		meeting.queuedSpeakers.splice(
			message.newIndex,
			0,
			meeting.queuedSpeakers.splice(message.oldIndex, 1)[0]
		);
		await updateMeeting(meeting);
		respond(200);
		socket.to(socket.data.meetingId).emit('reorderQueue', message);
	}
}
