const DB_ADAPTER =
    process.env['TCQ_DB_ADAPTER'] ||
    // due to historical reasons we default to cosmos-db on prod
    (process.env['NODE_ENV'] === 'production' ? 'cosmos-db' : 'simple-memory-db');

import Meeting from '../shared/Meeting';

export async function updateMeeting(meeting: Meeting): Promise<Meeting> {
  const { updateMeeting } = await import(`./adapters/db/${DB_ADAPTER}.db.adapter`);
  return updateMeeting(meeting);
}

export async function getMeeting(meetingId: string): Promise<Meeting | undefined> {
  const { getMeeting } = await import(`./adapters/db/${DB_ADAPTER}.db.adapter`);
  return getMeeting(meetingId);
}

export async function createMeeting(meeting: Meeting): Promise<Meeting> {
  const { createMeeting } = await import(`./adapters/db/${DB_ADAPTER}.db.adapter`);
  return createMeeting(meeting);
}
