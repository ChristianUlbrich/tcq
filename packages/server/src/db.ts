import { JSONFilePreset } from 'lowdb/node';
import { resolve } from 'node:path';
import type Meeting from '../../shared/dist/Meeting.d.ts';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

type Data = { meetings: Meeting[]; };

const defaultData = {
  meetings: []
};
const db = await JSONFilePreset<Data>(resolve(__dirname, './', 'db.json'), defaultData);

const upsertMeeting = async (meeting: Meeting) => {
  const dat = db.data.meetings.filter((element: any) => element.id === meeting.id).at(0);

  if (dat) Object.assign(dat, meeting);
  else db.data.meetings.push(meeting);

  return db.write();
};

export const getMeeting = async (meetingId: string) => db.data.meetings.find((m: any) => m.id === meetingId);
export const createMeeting = upsertMeeting;
export const updateMeeting = upsertMeeting;
