import type User from '../../shared/dist/User.js';
import type GitHubAuthenticatedUser from '../../shared/dist/GitHubAuthenticatedUser.js';
import type Meeting from '../../shared/dist/Meeting.js';

const knownUsers = new Map<string, User>();

export function addKnownUser(user: User) {
	knownUsers.set(user.ghUsername, user);
}

export async function getByUsername(username: string, accessToken: string) {
	const known = knownUsers.get(username);
	if (known) return known;

	const resp = await fetch(`https://api.github.com/users/${username}`, { headers: { Authorization: `token ${accessToken}` } });
	if (!resp.ok) {
		throw new Error(`Couldn't find user '${username}'.`);
	}
	const res = await resp.json();

	const user: User = {
		ghid: res.data.id,
		ghUsername: username,
		name: res.data.name,
		organization: res.data.company,
	};
	addKnownUser(user);
	return user;
}

export async function getByUsernames(usernames: string[], accessToken: string) {
	return Promise.all(
		usernames.map(async (u) => {
			try {
				return await getByUsername(u, accessToken);
			} catch (e) {
				throw new Error(`Couldn't find user '${u}'.`);
			}
		})
	);
}

export function fromGHAU(user: GitHubAuthenticatedUser): User {
	return {
		name: user.name,
		organization: user.organization,
		ghid: user.ghid,
		ghUsername: user.ghUsername,
	};
}

export function isChair(user: GitHubAuthenticatedUser | User, meeting: Meeting) {
	return meeting.chairs.length === 0 || meeting.chairs.some((c) => c.ghid === user.ghid);
}
