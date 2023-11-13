import Speaker from './Speaker.js';
import Reaction from './Reaction.js';
import AgendaItem from './AgendaItem.js';
import User from './User.js';
interface Meeting {
  chairs: User[];
  currentAgendaItem: AgendaItem | undefined;
  currentSpeaker: Speaker | undefined;
  queuedSpeakers: Speaker[];
  currentTopic: Speaker | undefined;
  agenda: AgendaItem[];
  id: string;
  timeboxEnd: Date | string | undefined;
  timeboxSecondsLeft: number | undefined;
  reactions: Reaction[];
  trackTemperature: boolean;
}

export default Meeting;
