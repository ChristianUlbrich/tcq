import Meeting from '../../../shared/Meeting';

type Data = { meetings: Meeting[]; };

const defaultData: Data = {
    meetings: []
};

const db = defaultData;

const upsertMeeting = async (meeting: Meeting) => {
    let found = await getMeeting(meeting.id);
    if (found) {
        found = {...meeting};
    } else {
       db.meetings.push(meeting);
    }
    return meeting;
};

export async function getMeeting(meetingId: string) {
    return db.meetings.find(meeting => meeting.id === meetingId);
}

export async function createMeeting(meeting: Meeting) {
    return upsertMeeting(meeting);
}

export async function updateMeeting(meeting: Meeting) {
    return upsertMeeting(meeting);
}
