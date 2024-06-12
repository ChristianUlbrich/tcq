import * as docdb from 'documentdb-typescript';
import Meeting from '../../../shared/Meeting';
import { DocumentResource } from 'documentdb-typescript/typings/_DocumentDB';

// TODO: use nullish coalescing if available
const HOST = process.env['TCQ_DB_CDB_HOST'] || 'https://tcq.documents.azure.com:443/';
const DATABASE_ID = process.env['TCQ_DB_CDB_DATABASE_ID'] || 'tcq';
const COLLECTION_ID = process.env['TCQ_DB_CDB_COLLECTION_ID'] || 'items';
// for historically reasons use old env, if new one does not exist
const CDB_SECRET = process.env['TCQ_DB_CDB_SECRET'] || process.env['TCQ_CDB_SECRET'];

const meetingsCollection = getMeetingsCollection();

export async function updateMeeting(meeting: Meeting) {
    let collection = await meetingsCollection;
    await collection.storeDocumentAsync(meeting, docdb.StoreMode.UpdateOnly);
}

export async function getMeeting(meetingId: string) {
    let collection = await meetingsCollection;

    return (await collection.findDocumentAsync(meetingId)) as Meeting & DocumentResource;
}

export async function createMeeting(meeting: Meeting) {
    let collection = await meetingsCollection;

    return collection.storeDocumentAsync(meeting);
}

export async function getMeetingsCollection() {
    return new docdb.Collection(COLLECTION_ID, DATABASE_ID, HOST, CDB_SECRET).openAsync();
}
