import type User from './User.js';

export default interface Reaction {
	reaction: ReactionTypes;
	user: User;
}

export type ReactionTypes = '❤️' | '👍' | '👀' | '🤷' | '😕' | '❓';
