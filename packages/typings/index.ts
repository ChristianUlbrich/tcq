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

type withId = { id: string; };

export declare namespace Payload {
	type error = {
		jobId?: string; // message identifier for the client to correlate with its request
		event: 'error';
		data: { message: string; };
	};

	type getAgendaItem = {
		jobId?: string;
		event: 'getAgendaItem';
		data: Partial<AgendaItem> & withId;
	};
	type getMeeting = {
		jobId?: string;
		event: 'getMeeting';
		data: Partial<Meeting> & withId;
	};
	type getTopic = {
		jobId?: string;
		event: 'getTopic';
		data: Partial<Topic> & withId;
	};
	type getUser = {
		jobId?: string;
		event: 'getUser';
		data: Partial<User> & withId;
	};

	type setAgendaItem = {
		jobId?: string;
		event: 'setAgendaItem';
		data: AgendaItem;
	};
	type setMeeting = {
		jobId?: string;
		event: 'setMeeting';
		data: Meeting;
	};
	type setTopic = {
		jobId?: string;
		event: 'setTopic';
		data: Topic;
	};

	type event = Payload['event'];
}

export type Payload = Payload.error
	| Payload.getAgendaItem
	| Payload.getMeeting
	| Payload.getTopic
	| Payload.getUser
	| Payload.setAgendaItem
	| Payload.setMeeting
	| Payload.setTopic;

