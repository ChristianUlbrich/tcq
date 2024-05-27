import type { UserInternal } from '.';
import { checkTokenValidity } from './authenticatorGitHub';
import { readUserInternalWithId, upsertUser } from './handlerStorage';

export const authenticate = async (tcqUserId: string | null | undefined): Promise<UserInternal> => {
	if (typeof tcqUserId !== 'string') throw new Error('User not found');

	const user = readUserInternalWithId(tcqUserId);
	if (process.env.DEVELOPMENT !== 'true') await checkTokenValidity(user.token);

	user.lastLogin = new Date().toISOString();
	upsertUser(user);

	return user;
};
