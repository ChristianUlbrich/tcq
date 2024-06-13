const { MongoClient, ServerApiVersion } = require('mongodb');

const URI = process.env['TCQ_DB_MONGODB_URI'];
// TODO: use nullish coalescing if available
const DB = process.env['TCQ_DB_MONGODB_DB'] || 'tcq-reloaded';

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const clientIsConnected = client.connect();

async function _getMeetingsCollection() {
    await clientIsConnected;
    const database = client.db(DB);
    return database.collection('meetings');
}

async function getMeeting(id) {
    const query = { id };
    const meetings = await _getMeetingsCollection();
    // map null, i.e. potential not found to undefined to comply with "API"
    return (await meetings.findOne(query) || undefined);
}

async function createMeeting(meeting) {
    const meetings = await _getMeetingsCollection();
    await meetings.insertOne(meeting);
    return meeting;
}

async function updateMeeting(meeting) {
    const meetings = await _getMeetingsCollection();
    const filter = {id: meeting.id};
    const updateDoc = {
        $set: {
            ...meeting
        }
    }
    await meetings.updateOne(filter, updateDoc);
    return meeting;
}

module.exports = {
    getMeeting,
    updateMeeting,
    createMeeting
}
