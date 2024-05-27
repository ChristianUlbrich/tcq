import type { AgendaItem, Jsonify, Meeting, User } from '@tc39/typings';
import type { UserInternal } from '.';
import { DB } from './managerDb';
import { merge } from './utils';

export const upsertUser = (user: UserInternal) => {
	DB.upsert('users', user);
};

export const readUserInternalWithId = (tcqUserId: string) => {
	const user = DB.read('users', 'WHERE id = ?', [tcqUserId]).at(0);
	if (!user) throw new Error('User not found');
	return user as Jsonify<UserInternal>;
};

export const readUserWithId = (tcqUserId: string) => {
	const { id, name, email, ghId, organization, isChair } = readUserInternalWithId(tcqUserId);
	return { id, name, email, ghId, organization, isChair } satisfies Jsonify<User>;
};

export const deleteUserWithId = (tcqUserId: string) => {
	DB.delete('users', 'WHERE id = ?', [tcqUserId]);
};

export const readChairsWithMeetingId = (meetingId: string) => {
	const chairs = DB.read('chairs', 'WHERE meetingId = ?', [meetingId]) as Jsonify<{ meetingId: string, userGhId: number; }>[];
	return chairs.map(({ userGhId }) => userGhId);
};

export const upsertMeeting = (meeting: Meeting) => {
	if (meeting.id === null) {
		do { meeting.id = Math.random().toString(36).slice(2); }
		while (DB.read('meetings', 'WHERE id = ?', [meeting.id]).length > 0);
	}

	// Ensure that the chairs from the environment are included
	meeting.chairs = merge(meeting.chairs, CHAIRS);

	DB.upsert('meetings', { id: meeting.id, title: meeting.title, startDate: meeting.startDate, endDate: meeting.endDate, location: meeting.location, status: meeting.status });
	meeting.chairs.map(userGhId => ({ meetingId: meeting.id, userGhId })).forEach(chair => DB.upsert('chairs', chair));

	if (meeting.agenda) {
		const agenda = DB.read('agendaItems', `WHERE id IN (${meeting.agenda.map(() => '?').join(',')})`, meeting.agenda) as Jsonify<AgendaItem[]>;
		// Drop all old agenda items
		// DB.delete('agendaItems', 'WHERE meetingId = ?', [meeting.id]);
		// Insert new agenda items
		meeting.agenda.forEach(id => {
			const item = agenda.find(({ id: itemId }) => itemId === id);
			if (item) DB.upsert('agendaItems', item);
		});
	}
};
