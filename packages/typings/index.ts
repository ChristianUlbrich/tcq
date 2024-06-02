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
export type MandateProps<T extends {}, K extends keyof T> = Omit<T, K> & { [MK in K]-?: NonNullable<T[MK]> };
export type OptionalProps<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

//* Data storage
export type Collection = 'users' | 'meetings' | 'agendaItems' | 'topics';

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
	status: 'frozen' | 'locked' | 'late' | 'continued' | null;
	queue: string[] | null; // Topic.id[]
};

export type Topic = {
	id: string | null;
	type: 'general' | 'reply' | 'question' | 'poo';
	userName: string;
	userGhId: number;
	agendaItemId: string;
	content: string;
};

//* Web
export type tcqCookie = 'tcqUserId';

//* Messages and Transport
export type Subscription = 'meeting' | 'agenda' | 'topics' | 'polls';

export declare namespace Payload {
	type error = {
		jobId?: string | null; // message identifier for the client to correlate with its request
		event: 'error';
		data: { message: string; };
	};

	type getAgenda = {
		jobId?: string | null;
		event: 'getAgenda';
		data: MandateProps<Partial<AgendaItem>, 'meetingId'>;
	};
	type getAgendaItem = {
		jobId?: string | null;
		event: 'getAgendaItem';
		data: MandateProps<Partial<AgendaItem>, 'id'>;
	};
	type getMeeting = {
		jobId?: string | null;
		event: 'getMeeting';
		data: MandateProps<Partial<Meeting>, 'id'>;
	};
	type getQueue = {
		jobId?: string | null;
		event: 'getQueue';
		data: MandateProps<Partial<Topic>, 'agendaItemId'>;
	};
	type getTopic = {
		jobId?: string | null;
		event: 'getTopic';
		data: MandateProps<Partial<Topic>, 'id'>;
	};
	type getUser = {
		jobId?: string | null;
		event: 'getUser';
		data: MandateProps<Partial<User>, 'id'>;
	};

	type setAgendaItem = {
		jobId?: string | null;
		event: 'setAgendaItem';
		data: AgendaItem;
	};
	type setMeeting = {
		jobId?: string | null;
		event: 'setMeeting';
		data: Meeting;
	};
	type setTopic = {
		jobId?: string | null;
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

