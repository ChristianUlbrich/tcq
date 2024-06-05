import { JSONFilePreset } from 'lowdb/node';
import { resolve } from 'node:path';
import type Meeting from '../../shared/dist/Meeting';

type Data = { meetings: Meeting[]; };

const defaultData = {
	meetings: []
};
const db = await JSONFilePreset<Data>(resolve(import.meta.url, 'db.json'), defaultData);

const upsertMeeting = async (meeting: Meeting) => {
	const index = db.data.meetings.findIndex(m => m.id === meeting.id);
	if (index === -1) {
		db.data.meetings.push(meeting);
	} else {
		db.data.meetings[index] = meeting;
	}
	return db.write();
};

export const getMeeting = async (meetingId: string) => db.data.meetings.find(m => m.id === meetingId);
export const createMeeting = upsertMeeting;
export const updateMeeting = upsertMeeting;
