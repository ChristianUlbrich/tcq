import type { AgendaItem, Jsonify, Meeting, Topic, User } from '@tc39/typings';
import type { UserInternal } from '.';
import { DB } from './managerDb';
import { generateId, merge } from './utils';

export const upsertUser = (user: UserInternal) => {
	DB.upsert('users', user);
};

export const readUserInternalWithId = (tcqUserId: string) => {
	const user = DB.read('users', ['id'], [tcqUserId]).at(0);
	if (!user) throw new Error('User not found');
	return user;
};

export const readUserWithId = (tcqUserId: string): User => {
	const { id, name, email, ghId, organization, isChair } = readUserInternalWithId(tcqUserId);
	// Omit the internal fields
	return { id, name, email, ghId, organization, isChair };
};

export const deleteUserWithId = (tcqUserId: string) => {
	DB.delete('users', ['id'], [tcqUserId]);
};

export const readChairsWithMeetingId = (meetingId: string) => {
	const meeting = DB.read('meetings', ['id'], [meetingId]).at(0);
	if (!meeting) throw new Error('Meeting not found');
	return meeting.chairs;
};

export const readMeetingWithId = (meetingId: string) => {
	const meeting = DB.read('meetings', ['id'], [meetingId]).at(0);
	if (!meeting || !meeting.id) throw new Error('Meeting not found');
	return meeting as Meeting & { id: string; };
};

export const upsertMeeting = (meeting: Meeting) => {
	if (meeting.id === null) {
		do { meeting.id = generateId(); }
		while (DB.read('meetings', ['id'], [meeting.id]).length > 0);
	}

	// Ensure the chairs from the environment are included
	meeting.chairs = merge(meeting.chairs ?? [], CHAIRS);

	DB.upsert('meetings', meeting);

	return meeting as Meeting & { id: string; };
};

export const readAgendaItemWithId = (agendaItemId: string) => {
	const agendaItem = DB.read('agendaItems', ['id'], [agendaItemId]).at(0);
	if (!agendaItem) throw new Error('Agenda Item not found');
	return agendaItem as AgendaItem & { id: string; };
};

export const upsertAgendaItem = (agendaItem: AgendaItem) => {
	const meeting = readMeetingWithId(agendaItem.meetingId);

	if (agendaItem.id === null) {
		do { agendaItem.id = generateId(); }
		while (DB.read('agendaItems', ['id'], [agendaItem.id]).length > 0);

		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		meeting.agenda?.push(agendaItem.id) ?? (meeting.agenda = [agendaItem.id]);
		DB.upsert('meetings', meeting);
	}

	DB.upsert('agendaItems', agendaItem);

	return agendaItem as AgendaItem & { id: string; };
};

export const readTopicWithId = (topicId: string) => {
	const topic = DB.read('topics', ['id'], [topicId]).at(0);
	if (!topic) throw new Error('Topic not found');
	return topic as Topic & { id: string; };
};

export const upsertTopic = (topic: Topic) => {
	const agendaItem = readAgendaItemWithId(topic.agendaItemId);

	if (topic.id === null) {
		do { topic.id = generateId(); }
		while (DB.read('topics', ['id'], [topic.id]).length > 0);

		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		agendaItem.queue?.push(topic.id) ?? (agendaItem.queue = [topic.id]);
		DB.upsert('agendaItems', agendaItem);
	}

	DB.upsert('topics', topic);

	return topic as Topic & { id: string; };
};
