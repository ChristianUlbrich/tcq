import type User from './User.js';

interface AgendaItem {
	name: string;
	description?: string;
	timebox?: number;
	user: User;
	id: string;
}

export default AgendaItem;
