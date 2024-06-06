import type { Socket } from 'socket.io';
import type { Responder } from '.';
import type Message from '../../shared/dist/Messages';
import type Reaction from '../../shared/dist/Reaction';
import { getMeeting, updateMeeting } from './db';

export async function newReaction(socket: Socket, respond: Responder, message: Message.NewReactionRequest) {
	const meeting = socket.data.meetingId ? await getMeeting(socket.data.meetingId) : null;
	if (!meeting) {
		respond(500, { message: 'Problem(s) finding meeting' });
		return;
	}

	const reaction: Reaction = {
		user: socket.data.user,
		reaction: message.reactionType
	};

	if (!meeting.reactions) {
		meeting.reactions = [];
	}

	const { reactions } = meeting;

	const index = reactions.findIndex((r) => r.reaction === reaction.reaction && r.user.ghid === reaction.user.ghid
	);

	if (index === -1) {
		reactions.push(reaction);
		await updateMeeting(meeting);
		socket.to(socket.data.meetingId).emit('newReaction', reaction);
	} else {
		reactions.splice(index, 1);
		await updateMeeting(meeting);
		socket.to(socket.data.meetingId).emit('deleteReaction', reaction);
	}
	respond(200);
}

export async function trackTemperature(socket: Socket, respond: Responder, message: Message.TrackTemperatureRequest) {
	const meeting = socket.data.meetingId ? await getMeeting(socket.data.meetingId) : null;
	if (!meeting) {
		respond(500, { message: 'Problem(s) finding meeting' });
		return;
	}

	if (!message.track) {
		meeting.reactions = [];
		await updateMeeting(meeting);
	}
	meeting.trackTemperature = message.track;
	socket.to(socket.data.meetingId).emit('trackTemperature', message.track);
}
