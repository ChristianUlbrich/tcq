import type { AgendaItem, MandateProps, Meeting, Topic, User } from '@tc39/typings';
import type { UserInternal } from '.';
import { erase, read, upsert } from './managerDb';
import { generateId, merge } from './utils';

export const upsertUser = (user: UserInternal) => {
	upsert('users', user);
};

export const readUserInternalWithId = (tcqUserId: string) => {
	const user = read('users', ['id'], [tcqUserId]).at(0);
	if (!user) throw new Error('User not found');
	return user;
};

export const readUserWithId = (tcqUserId: string): User => {
	const { id, name, email, ghId, organization, isChair } = readUserInternalWithId(tcqUserId);
	// Omit the internal fields
	return { id, name, email, ghId, organization, isChair };
};

export const deleteUserWithId = (tcqUserId: string) => {
	erase('users', ['id'], [tcqUserId]);
};

export const readChairsWithMeetingId = (meetingId: string) => {
	const meeting = read('meetings', ['id'], [meetingId]).at(0);
	if (!meeting) throw new Error('Meeting not found');
	return meeting.chairs;
};

export const readMeetingWithId = (meetingId: string) => {
	const meeting = read('meetings', ['id'], [meetingId]).at(0);
	if (!meeting) throw new Error('Meeting not found');
	return meeting as MandateProps<Meeting, 'id'>;
};

export const readMeeting = (meeting: { id: string; } | { id: string; }[] | { status: string; } | { status: string; }[]) => {
	const M = Array.isArray(meeting) ? meeting[0] : meeting;
	const m = 'id' in M
		? read('meetings', ['id'], [M.id]).at(0)
		: read('meetings', ['status'], [M.status]);
	if (!m) throw new Error('Meeting not found');
	return m;
};

export const upsertMeeting = (meeting: Meeting) => {
	if (meeting.id === null) {
		do { meeting.id = generateId(); }
		while (read('meetings', ['id'], [meeting.id]).length > 0);
	}

	// Ensure the chairs from the environment are included
	meeting.chairs = merge(meeting.chairs ?? [], CHAIRS);

	upsert('meetings', meeting);

	return readMeetingWithId(meeting.id);
};

export const readAgenda = (agenda: { meetingId: string; } | { meetingId: string; }[]) => {
	const mId = Array.isArray(agenda) ? agenda.at(0)?.meetingId : agenda.meetingId;
	return read('agendaItems', ['meetingId'], [mId]);
};

export const readAgendaItemWithId = (agendaItemId: string) => {
	const agendaItem = read('agendaItems', ['id'], [agendaItemId]).at(0);
	if (!agendaItem) throw new Error('Agenda Item not found');
	return agendaItem as MandateProps<AgendaItem, 'id'>;
};

export const upsertAgendaItem = (agendaItem: AgendaItem) => {
	const meeting = readMeetingWithId(agendaItem.meetingId);

	if (agendaItem.id === null) {
		do { agendaItem.id = generateId(); }
		while (read('agendaItems', ['id'], [agendaItem.id]).length > 0);

		// biome-ignore lint/suspicious/noAssignInExpressions: if push fails, shove it into a new array
		meeting.agenda?.push(agendaItem.id) ?? (meeting.agenda = [agendaItem.id]);
		upsert('meetings', meeting);
	}

	upsert('agendaItems', agendaItem);

	return readAgendaItemWithId(agendaItem.id);
};

export const readQueue = (topic: { agendaItemId: string; } | { agendaItemId: string; }[]) => {
	const aId = Array.isArray(topic) ? topic.at(0)?.agendaItemId : topic.agendaItemId;
	return read('topics', ['agendaItemId'], [aId]);
};

export const readTopicWithId = (topicId: string) => {
	const topic = read('topics', ['id'], [topicId]).at(0);
	if (!topic) throw new Error('Topic not found');
	return topic as MandateProps<Topic, 'id'>;
};

export const upsertTopic = (topic: Topic) => {
	const agendaItem = readAgendaItemWithId(topic.agendaItemId);

	if (topic.id === null) {
		do { topic.id = generateId(); }
		while (read('topics', ['id'], [topic.id]).length > 0);

		// biome-ignore lint/suspicious/noAssignInExpressions: if push fails, shove it into a new array
		agendaItem.queue?.push(topic.id) ?? (agendaItem.queue = [topic.id]);
		upsert('agendaItems', agendaItem);
	}

	upsert('topics', topic);

	return readTopicWithId(topic.id);
};
