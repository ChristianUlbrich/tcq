const MongoDBStoreSession = require('connect-mongodb-session');

// TODO: use nullish coalescing if available
const URI = process.env['TCQ_SESSION_STORE_MONGODB_URI'];
const DATABASE = process.env['TCQ_SESSION_STORE_MONGODB_DATABASE'] || 'tcq-reloaded';
const SESSION_COLLECTION = process.env['TCQ_SESSION_STORE_MONGODB_COLLECTION'] || 'sessions';

function createSessionStoreForSession(session) {
    const MongoDBStore = MongoDBStoreSession(session);
    const sessionStore = new MongoDBStore({
        uri: URI,
        databaseName: DATABASE,
        collection: SESSION_COLLECTION
    });
    return sessionStore;
}

module.exports = {
    createSessionStoreForSession
}
