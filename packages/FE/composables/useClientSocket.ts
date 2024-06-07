import io from 'socket.io-client';
import type AgendaItem from '../../shared/dist/AgendaItem';
import type Message from '../../shared/dist/Messages';
import type Reaction from '../../shared/dist/Reaction';
import type Speaker from '../../shared/dist/Speaker';
import type User from '../../shared/dist/User';

type QueuedSpeaker = Message.NewQueuedSpeaker;

//! get the meeting id from somewhere else
const match = document.location.href.match(/meeting\/(.*)$/);

const id = ref<string | undefined>(match?.at(1));
const queuedSpeakers = ref<QueuedSpeaker[]>([]);
const currentSpeaker = ref<Speaker | undefined>();
const reactions = ref<Reaction[]>([]);
const trackTemperature = ref(false);
const agenda = ref<AgendaItem[]>([]);
const currentAgendaItem = ref<AgendaItem | undefined>();
const currentTopic = ref<Speaker | undefined>();

const user = ref<User | undefined>();
const isChair = ref(false);
const chairs = ref<User[]>([]);
const partitionKey = ref<string>(''); // useless?
const timeboxEnd = ref<Date | string | undefined>();
const timeboxSecondsLeft = ref<number | undefined>();

const socket = io('localhost:3001', { auth: { tcqUserId: '' }, query: { id } });

socket.io.on("error", console.error);

socket.on('response', response => {
	if (response.status === 200) {
		notifyRequestSuccess(response);
	} else {
		notifyRequestFailure(response);
	}
});

let notifyRequestSuccess = (result: any) => { };
let notifyRequestFailure = (result: any) => { };



function request(type: string, message: any) {
	const p = new Promise((resolve, reject) => {
		notifyRequestSuccess = resolve;
		notifyRequestFailure = reject;
	});

	if (socket) {
		socket.emit(type, message);
	} else {
		// probably wait on socket.
		return Promise.reject('No connection to server.');
	}

	return p;
}


socket.on('auth', (data: Message.TCQVerification) => {
	//! Must reset the socket with the new auth info after successful login
	console.log('auth', data);
});

socket.on('state', (data: Message.State) => {
	user.value = data.user;
	isChair.value = data.chairs.some(chair => chair.ghid === data.user.ghid);
	chairs.value = data.chairs;
	partitionKey.value = data.partitionKey; // useless?
	timeboxEnd.value = data.timeboxEnd;
	timeboxSecondsLeft.value = data.timeboxSecondsLeft;

	queuedSpeakers.value = data.queuedSpeakers.map((speaker, i) => ({ position: i, speaker }));
	currentSpeaker.value = data.currentSpeaker;
	reactions.value = data.reactions;
	trackTemperature.value = data.trackTemperature;
	agenda.value = data.agenda;
	currentAgendaItem.value = data.currentAgendaItem;
	currentTopic.value = data.currentTopic;
});

socket.on('newQueuedSpeaker', (data: QueuedSpeaker) => {
	queuedSpeakers.value.push(data);
});

socket.on('deleteQueuedSpeaker', (data: QueuedSpeaker) => {
	const index = queuedSpeakers.value.findIndex(speaker => speaker.speaker.id === data.speaker.id);
	if (index !== -1) {
		queuedSpeakers.value.splice(index, 1);
	}
});

// fired simultaneously with nextAgendaItem
socket.on('newCurrentSpeaker', (data: Speaker) => {
	currentSpeaker.value = data;
	queuedSpeakers.value.shift();
});

socket.on('newReaction', (data: any) => {
	reactions.value.push(data);
});

socket.on('deleteReaction', (data: any) => {
	const index = reactions.value.findIndex((r: Reaction) => r.reaction === data.reaction && r.user.ghid === data.user.ghid);
	if (index !== -1) {
		reactions.value.splice(index, 1);
	}
});

socket.on('trackTemperature', (isTracking: boolean) => {
	if (!isTracking) {
		reactions.value = [];
	}
	trackTemperature.value = isTracking;
});

socket.on('newAgendaItem', (data: AgendaItem) => {
	agenda.value.push(data);
});

socket.on('reorderAgendaItem', (data: Message.ReorderAgendaItemRequest) => {
	agenda.value.splice(data.newIndex, 0, agenda.value.splice(data.oldIndex, 1)[0]);
});

socket.on('deleteAgendaItem', (data: Message.DeleteAgendaItem) => {
	agenda.value.splice(data.index, 1);
});

socket.on('nextAgendaItem', (data: AgendaItem) => {
	currentAgendaItem.value = data;
});

// fired simultaneously with newCurrentSpeaker
socket.on('newCurrentTopic', (data: Speaker | undefined) => {
	currentTopic.value = data;
});

socket.on('reorderQueue', (data: Message.ReorderQueueRequest) => {
	const item = queuedSpeakers.value[data.oldIndex];
	if (item?.speaker.id === data.id) {
		queuedSpeakers.value.splice(data.newIndex, 0, queuedSpeakers.value.splice(data.oldIndex, 1)[0]);
	}
});

socket.on('updateQueuedSpeaker', (data: Speaker) => {
	const index = queuedSpeakers.value.findIndex(speaker => speaker.speaker.id === data.id);
	if (index !== -1) {
		queuedSpeakers.value[index].speaker = data;
	}
});

export const useClientSocket = () => ({
	request,
	queuedSpeakers,
	currentSpeaker,
	reactions,
	trackTemperature,
	agenda,
	currentAgendaItem,
	currentTopic,
	user,
	isChair,
	chairs,
	partitionKey,
	timeboxEnd,
	timeboxSecondsLeft
});
