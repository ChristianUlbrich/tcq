import { JSONFilePreset } from 'lowdb/node';
import { resolve } from 'node:path';
import type Meeting from '../../shared/dist/Meeting';

type Data = { meetings: Meeting[]; };

const defaultData = {
	meetings: []
};
const db = await JSONFilePreset<Data>(resolve(import.meta.dir, './', 'db.json'), defaultData);

const upsertMeeting = async (meeting: Meeting) => {
	const dat = db.data.meetings.filter(element => element.id === meeting.id).at(0);

	if (dat) Object.assign(dat, meeting);
	else db.data.meetings.push(meeting);

	return db.write();
};

export const getMeeting = async (meetingId: string) => db.data.meetings.find(m => m.id === meetingId);
export const createMeeting = upsertMeeting;
export const updateMeeting = upsertMeeting;
