import io from 'socket.io-client';


const match = document.location.href.match(/meeting\/(.*)$/);

// if (!match) throw new Error('Failed to find meeting id');
const id = match?.at(1);

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
		socket.emit(type as any, message);
	} else {
		// probably wait on socket.
		return Promise.reject('No connection to server.');
	}

	return p;
}

// const state = ref({});
// const queuedSpeakers = ref([]);
// const currentSpeaker = ref(null);
// const reactions = ref([]);
// const isTrackingTemperature = ref(false);
// const agenda = ref([]);
// const currentTopic = ref(null);
// const queue = ref([]);

//     this.socket.on('state', data => {
//     });

//     this.socket.on('newQueuedSpeaker', data => {
//     });

//     this.socket.on('deleteQueuedSpeaker', data => {
//     });

//     this.socket.on('newCurrentSpeaker', data => {
//     });

//     this.socket.on('newReaction', data => {
//     });

//     this.socket.on('deleteReaction', data => {
//     });

//     this.socket.on('trackTemperature', isTracking => {
//     });

//     this.socket.on('newAgendaItem', data => {
//     });

//     this.socket.on('newCurrentTopic', data => {
//     });

//     this.socket.on('reorderAgendaItem', data => {
//     });

//     this.socket.on('deleteAgendaItem', data => {
//     });

//     this.socket.on('nextAgendaItem', data => {
//     });

//     this.socket.on('reorderQueue', data => {
//     });

//     this.socket.on('updateQueuedSpeaker', data => {
//     });

export const useClientSocket = () => ({
	request,
	// state,
	// queuedSpeakers,
	// currentSpeaker,
	// reactions,
	// isTrackingTemperature,
	// agenda,
	// currentTopic,
	// queue,
});
