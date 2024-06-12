const DB_ADAPTER = process.env['TCQ_DB_ADAPTER'] || 'cosmos-db';

import Meeting from '../shared/Meeting';

export async function updateMeeting(meeting: Meeting) {
  // any other adapters must come above this, we do this to allow "easy" zero config locally...
  // and because for historic reasons we default to cosmos-db
  if (DB_ADAPTER === 'simple-memory-db' || process.env['NODE_ENV'] !== 'production') {
    const { updateMeeting } = await import('./adapters/db/simple-memory-db.db.adapter');
    return updateMeeting(meeting);
  } else if (DB_ADAPTER === 'cosmos-db') {
    const {updateMeeting} = await import('./adapters/db/cosmos-db.db.adapter');
    return updateMeeting(meeting);
  }
}

export async function getMeeting(meetingId: string) {
  // any other adapters must come above this, we do this to allow "easy" zero config locally...
  // and because for historic reasons we default to cosmos-db
  if (DB_ADAPTER === 'simple-memory-db' || process.env['NODE_ENV'] !== 'production') {
    const { getMeeting } = await import('./adapters/db/simple-memory-db.db.adapter');
    return getMeeting(meetingId);
  } else if (DB_ADAPTER === 'cosmos-db') {
    const {getMeeting} = await import('./adapters/db/cosmos-db.db.adapter');
    return getMeeting(meetingId);
  }
}

export async function createMeeting(meeting: Meeting) {
  // any other adapters must come above this, we do this to allow "easy" zero config locally...
  // and because for historic reasons we default to cosmos-db
  if (DB_ADAPTER === 'simple-memory-db' || process.env['NODE_ENV'] !== 'production') {
    const { createMeeting } = await import('./adapters/db/simple-memory-db.db.adapter');
    return createMeeting(meeting);
  } else if (DB_ADAPTER === 'cosmos-db') {
    const {createMeeting} = await import('./adapters/db/cosmos-db.db.adapter');
    return createMeeting(meeting);
  }
}
