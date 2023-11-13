export const HOST = process.env.DB_URI;
export const DATABASE_ID = process.env.DB_NAME;
export const COLLECTION_ID = process.env.DB_CONTAINER;
export const SESSION_COLLECTION_ID = process.env.DB_CONTAINER_SESSIONS;

import { CDB_SECRET } from './secrets';
import * as docdb from 'documentdb-typescript';
import Speaker from '../shared/Speaker';
import Meeting from '../shared/Meeting';
import { DocumentResource } from 'documentdb-typescript/typings/_DocumentDB';

const meetingsCollection = getMeetingsCollection();

export async function updateMeeting(meeting: Meeting) {
  let collection = await meetingsCollection;
  await collection.storeDocumentAsync(meeting, docdb.StoreMode.UpdateOnly);
}

export async function getMeeting(meetingId: string) {
  let collection = await meetingsCollection;
  console.error('Get Meeting: ', collection);

  return (await collection.findDocumentAsync(meetingId)) as Meeting & DocumentResource;
}

export async function createMeeting(meeting: Meeting) {
  let collection = await meetingsCollection;

  return collection.storeDocumentAsync(meeting);
}

export async function getMeetingsCollection() {
  if (!COLLECTION_ID) throw new Error('Missing COLLECTION_ID');
  if (!DATABASE_ID) throw new Error('Missing DATABASE_ID');
  return new docdb.Collection(COLLECTION_ID, DATABASE_ID, HOST, CDB_SECRET).openAsync();
}

const reUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function validUUID(seen: Set<string>, uuid: string) {
  if (seen.has(uuid)) return false;
  if (!reUUID.exec(uuid)) return false;

  return true;
}
