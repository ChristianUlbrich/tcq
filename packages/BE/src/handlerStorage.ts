import type { AgendaItem, Jsonify, Meeting, User } from '@tc39/typings';
import type { UserInternal } from '.';
import { DB } from './managerDb';
import { merge } from './utils';

export const upsertUser = (user: UserInternal) => {
	DB.upsert('users', user);
};

export const readUserInternalWithId = (tcqUserId: string) => {
	const user = DB.read('users', ['id'], [tcqUserId]).at(0);
	if (!user) throw new Error('User not found');
	return user as Jsonify<UserInternal>;
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

export const upsertMeeting = (meeting: Meeting) => {
	if (meeting.id === null) {
		do { meeting.id = Math.random().toString(36).slice(2); }
		while (DB.read('meetings', ['id'], [meeting.id]).length > 0);
	}

	// Ensure the chairs from the environment are included
	meeting.chairs = merge(meeting.chairs, CHAIRS);

	DB.upsert('meetings', meeting);
};
