import type { Socket } from 'socket.io';
import type { Socket as SocketClient } from 'socket.io-client';
import type { StrictBroadcast, StrictEventEmitter } from 'strict-event-emitter-types';
import type AgendaItem from './AgendaItem.js';
import type Meeting from './Meeting.js';
import type Reaction from './Reaction.js';
import type { ReactionTypes } from './Reaction.js';
import type Speaker from './Speaker.js';
import type { TopicTypes } from './Speaker.js';
import type User from './User.js';

interface ServerEvents {
	newQueuedSpeakerRequest: NewQueuedSpeakerRequest;
	deleteQueuedSpeakerRequest: DeleteQueuedSpeakerRequest;
	nextSpeaker: NextSpeakerRequest;
	nextAgendaItemRequest: NextAgendaItemRequest;
	newAgendaItemRequest: NewAgendaItemRequest;
	newMeetingRequest: newMeetingRequest;
	reorderAgendaItemRequest: ReorderAgendaItemRequest;
	reorderQueueRequest: ReorderQueueRequest;
	deleteAgendaItemRequest: DeleteAgendaItemRequest;
	newReactionRequest: NewReactionRequest;
	trackTemperatureRequest: TrackTemperatureRequest;
	userInfo: User;
	disconnect: undefined;
}

interface ClientEvents {
	nextAgendaItem: NextAgendaItem;
	newCurrentSpeaker: NewCurrentSpeaker;
	newQueuedSpeaker: NewQueuedSpeaker;
	deleteQueuedSpeaker: DeleteQueuedSpeaker;
	newAgendaItem: AgendaItem;
	newMeeting: Meeting;
	newCurrentTopic: NewCurrentTopic;
	reorderAgendaItem: ReorderAgendaItem;
	reorderQueue: ReorderQueue;
	deleteAgendaItem: DeleteAgendaItem;
	newReaction: NewReaction;
	deleteReaction: DeleteReaction;
	trackTemperature: TrackTemperature;
	disconnect: undefined;
	state: State;
	response: Response;
	updateQueuedSpeaker: UpdateQueuedSpeaker;
}

export interface Response {
	status: number;
	message?: string;
}
export interface NewQueuedSpeakerRequest {
	type: TopicTypes;
	topic: string;
	id: string;
}

export interface NewQueuedSpeaker {
	position: number;
	speaker: Speaker;
}

export interface DeleteQueuedSpeaker {
	id: string;
}
export interface DeleteQueuedSpeakerRequest {
	id: string;
}

export interface NewAgendaItemRequest {
	name: string;
	timebox?: string;
	ghUsername: string;
}

export interface newMeetingRequest {
	name: string;
	chairs: string[];
}

export interface DeleteAgendaItem {
	index: number;
}

export interface DeleteAgendaItemRequest {
	index: number;
}

export interface ReorderAgendaItem {
	oldIndex: number;
	newIndex: number;
}

export interface ReorderQueue {
	oldIndex: number;
	newIndex: number;
}

export interface ReorderQueueRequest {
	id: string;
	oldIndex: number;
	newIndex: number;
}

export interface ReorderAgendaItemRequest {
	oldIndex: number;
	newIndex: number;
}

export interface UpdateQueuedSpeaker extends Speaker { }
export interface State extends Meeting {
	user: User;
}

export interface NextAgendaItemRequest {
	currentItemId?: string;
}

export interface NextSpeakerRequest {
	currentSpeakerId: string;
}

export interface NewReactionRequest {
	reactionType: ReactionTypes;
}

export interface TrackTemperatureRequest {
	track: boolean;
}

export interface NextAgendaItem extends AgendaItem { }
export type NewCurrentSpeaker = Speaker | undefined;
export type NewCurrentTopic = Speaker | undefined;
export type NewReaction = Reaction;
export type DeleteReaction = Reaction;
export type TrackTemperature = boolean;

export type ServerSocket = StrictEventEmitter<Socket, ServerEvents, ClientEvents>;
export type ClientSocket = StrictEventEmitter<SocketClient, ClientEvents, ServerEvents>;
export type ClientBroadcast = StrictBroadcast<ClientSocket>;
