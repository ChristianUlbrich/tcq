export const HOST = process.env.DB_URI;
export const DATABASE_ID = process.env.DB_NAME;
export const COLLECTION_ID = process.env.DB_CONTAINER;
export const PARTITION_KEY = process.env.DB_PARTITION_KEY;
export const SESSION_COLLECTION_ID = process.env.DB_CONTAINER_SESSIONS;

import log from './logger.js';
import { CDB_SECRET } from './secrets.js';
import { CosmosClient, Resource } from '@azure/cosmos';
import Meeting from '../shared/Meeting.js';

if (!HOST) {
  log.fatal('ERROR\tNo database endpoint. Set DB_URI.');
  process.exit(1);
}
if (!DATABASE_ID) {
  log.fatal('ERROR\tNo database name. Set DB_NAME.');
  process.exit(1);
}
if (!COLLECTION_ID) {
  log.fatal('ERROR\tNo database container / collection. Set DB_CONTAINER.');
  process.exit(1);
}

const dbClient = new CosmosClient({
  endpoint: HOST,
  key: CDB_SECRET
});

await dbClient
  .databases
  .createIfNotExists({ id: DATABASE_ID, maxThroughput: 1000 });
await dbClient
  .database(DATABASE_ID)
  .containers.createIfNotExists({ id: COLLECTION_ID, partitionKey: PARTITION_KEY });

async function upsertMeeting(meeting: Meeting) {
  const { resource } = await dbClient
    .database(DATABASE_ID!)
    .container(COLLECTION_ID!)
    .items
    .upsert<Meeting>(meeting);
  return resource;
}

async function updateMeeting(meeting: Meeting) {
  await upsertMeeting(meeting);
}

async function getMeeting(meetingId: string): Promise<(Meeting & Resource) | undefined> {
  const { resource } = await dbClient
    .database(DATABASE_ID!)
    .container(COLLECTION_ID!)
    .item(meetingId, PARTITION_KEY)
    .read<Meeting>();
  return resource;
}

async function createMeeting(meeting: Meeting): Promise<(Meeting & Resource) | undefined> {
  return upsertMeeting(meeting);
}

export {
  createMeeting,
  getMeeting,
  updateMeeting
};
