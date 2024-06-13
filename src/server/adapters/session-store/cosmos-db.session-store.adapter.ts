import DocumentDBSession = require('documentdb-session');

// TODO: use nullish coalescing if available
const HOST = process.env['TCQ_SESSION_STORE_CDB_HOST'] || 'https://tcq.documents.azure.com:443/';
const DATABASE_ID = process.env['TCQ_SESSION_STORE_CDB_DATABASE_ID'] || 'tcq';
const SESSION_COLLECTION_ID = process.env['TCQ_SESSION_STORE_CDB_COLLECTION_ID'] || 'sessions';
// for historically reasons use old env, if new one does not exist
const CDB_SECRET = process.env['TCQ_SESSION_STORE_CDB_SECRET'] || process.env['TCQ_CDB_SECRET'];

export function createSessionStoreForSession(session: any) {
    const DocumentDBStore = DocumentDBSession(session);
    const sessionStore = new DocumentDBStore({
      host: HOST,
      database: DATABASE_ID,
      collection: SESSION_COLLECTION_ID,
      key: CDB_SECRET!
    });
    return sessionStore;
}
