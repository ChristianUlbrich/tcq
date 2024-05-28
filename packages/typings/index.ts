//* Utils
export type Jsonify<T> = T extends { toJSON: (...args: any) => infer R; }
	? Jsonify<R>
	: T extends Array<infer I>
	? Array<Jsonify<I>>
	: T extends (...args: any) => any
	? never
	: T extends object
	? { [K in keyof T]: K extends string | number ? Jsonify<T[K]> : never }
	: T;

export type GetElementType<T extends any[]> = T extends (infer U)[] ? U : never;

//* Data storage
export type Collection = 'users' | 'meetings' | 'agendaItems' | 'topics';
export interface IDBManager {
	upsert(collection: Collection, data: Record<string, any>): void;
	read(collection: Collection, conditions?: string[], params?: any[]): any[];
	delete(collection: Collection, conditions: string[], params: any[]): void;
}


//* Data types
export type User = {
	id: string;
	name: string;
	email: string;
	ghId: number | null;
	organization: string | null;
	isChair: boolean;
};

export type Meeting = {
	id: string | null;
	title: string;
	startDate: string;
	endDate: string;
	location: string;
	status: 'planned' | 'active' | 'finished';
	agenda: string[] | null; // AgendaItem.id[]
	chairs: number[]; // User.ghId[]
};

export type AgendaItem = {
	id: string | null;
	name: string;
	userName: string;
	meetingId: string; // Meeting.id
	description?: string;
	timebox?: number; // minutes
	weight: number;
	status: 'frozen' | 'locked' | 'late' | 'continued';
	queue: string[] | null; // Topic.id[]
};

export type Topic = {
	id: string | null;
	type: 'general' | 'reply' | 'question' | 'poo';
	userName: string;
	userGhId: number;
	agendaItemId: string;
	content: string;
	weight: number;
};

//* Web
export type tcqCookie = 'tcqUserId';

//* Messages and Transport
export type Subscription = 'meeting' | 'agenda' | 'topics' | 'polls';

type event = 'error'
	| 'readAgendaItem'
	| 'readMeeting'
	| 'readTopic'
	| 'readUser'
	| 'upsertAgendaItem'
	| 'upsertMeeting'
	| 'upsertTopic';
type withId = { id: string; };

export declare namespace Payload {
	type error = {
		// jobId?: string; // message identifier for the client to correlate with its request
		event: Extract<event, 'error'>;
		data: { message: string; };
	};

	type readAgendaItem = {
		// jobId?: string; // message identifier for the client to correlate with its request
		event: Extract<event, 'readAgendaItem'>;
		data: Partial<AgendaItem> & withId;
	};
	type readMeeting = {
		// jobId?: string; // message identifier for the client to correlate with its request
		event: Extract<event, 'readMeeting'>;
		data: Partial<Meeting> & withId;
	};
	type readTopic = {
		// jobId?: string; // message identifier for the client to correlate with its request
		event: Extract<event, 'readTopic'>;
		data: Partial<Topic> & withId;
	};
	type readUser = {
		// jobId?: string; // message identifier for the client to correlate with its request
		event: Extract<event, 'readUser'>;
		data: Partial<User> & withId;
	};

	type upsertAgendaItem = {
		// jobId?: string; // message identifier for the client to correlate with its request
		event: Extract<event, 'upsertAgendaItem'>;
		data: AgendaItem;
	};
	type upsertMeeting = {
		// jobId?: string; // message identifier for the client to correlate with its request
		event: Extract<event, 'upsertMeeting'>;
		data: Meeting;
	};
	type upsertTopic = {
		// jobId?: string; // message identifier for the client to correlate with its request
		event: Extract<event, 'upsertTopic'>;
		data: Topic;
	};
}

export type Payload = Payload.error
	| Payload.readAgendaItem
	| Payload.readMeeting
	| Payload.readTopic
	| Payload.readUser
	| Payload.upsertAgendaItem
	| Payload.upsertMeeting
	| Payload.upsertTopic;

