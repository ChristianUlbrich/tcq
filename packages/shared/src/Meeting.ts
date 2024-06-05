import type Speaker from './Speaker.js';
import type Reaction from './Reaction.js';
import type AgendaItem from './AgendaItem.js';
import type User from './User.js';
interface Meeting {
	chairs: User[];
	currentAgendaItem: AgendaItem | undefined;
	currentSpeaker: Speaker | undefined;
	queuedSpeakers: Speaker[];
	currentTopic: Speaker | undefined;
	agenda: AgendaItem[];
	id: string;
	partitionKey: string;
	timeboxEnd: Date | string | undefined;
	timeboxSecondsLeft: number | undefined;
	reactions: Reaction[];
	trackTemperature: boolean;
}

export default Meeting;
