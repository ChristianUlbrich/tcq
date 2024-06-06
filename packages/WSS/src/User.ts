import type User from '../../shared/dist/User.js';
import type GitHubAuthenticatedUser from '../../shared/dist/GitHubAuthenticatedUser.js';
import type Meeting from '../../shared/dist/Meeting.js';
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';

type ghAuthUser = {
	login: string;
	id: number;
	name: string;
	company: string;
	location: string | null;
	email: string;
};

const knownUsers = new Map<string, User>();
export const ghAuthUsers = new Map<string, GitHubAuthenticatedUser & { id: string; }>();

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

const develAuth = () => new Promise((resolve, reject) => {
	const verification = {
		device_code: '3584d83530557fdd1f46af8289938c8ef79f9dc5',
		user_code: 'WDJB-MJHT',
		verification_uri: 'https://you-are-already-logged-in/login/device',
		expires_in: 900,
		interval: 5,
	};
	const tokenAuthentication = {
		type: 'token',
		tokenType: 'oauth',
		clientType: 'oauth-app',
		clientId: '5854a146b6ed03847390',
		token: 'gho_vsuCx***KQ18RArz',
		scopes: ['read:user,user:email'],
	};
	const user = {
		id: verification.device_code,
		login: 'TimTester',
		name: 'Tim Tester',
		email: 'tim.tester@zalari.de',
		ghId: 1337,
		organization: 'Zalari',
		isChair: true,
		lastLogin: new Date().toISOString(),
		token: tokenAuthentication.token,
	};
	try {
		console.debug('Open %s and enter code: %s', verification.verification_uri, verification.user_code);
		resolve(JSON.stringify({ verification_uri: verification.verification_uri, user_code: verification.user_code, tcqUserId: verification.device_code }));
		const ghUser = {
			id: verification.device_code,
			ghUsername: user.login,
			ghid: user.ghId,
			name: user.name,
			organization: user.organization,
			accessToken: tokenAuthentication.token,
			refreshToken: tokenAuthentication.token
		};
		ghAuthUsers.set(verification.device_code, ghUser);
		knownUsers.set(ghUser.ghUsername, fromGHAU(ghUser));
	} catch (err) {
		console.error(err, verification);
		ghAuthUsers.delete(verification.device_code);
		reject('Authentication failed');
	}
});

const githubAuth = () => new Promise((resolve, reject) => {
	// `V` is typed as this because `Verification` is not exported from the module
	let V: { device_code: string; user_code: string; verification_uri: string; expires_in: number; interval: number; };

	const auth = createOAuthDeviceAuth({
		clientType: 'oauth-app',
		clientId: process.env.OAUTH_CLIENT_ID ?? 'missing_client_id',
		scopes: process.env.OAUTH_SCOPES?.split(',') ?? ['read:user', 'user:email'],
		onVerification(verification) {
			V = verification;

			// console.debug(verification);
			// console.debug('Open %s and enter code: %s', verification.verification_uri, verification.user_code);

			resolve(JSON.stringify({ verification_uri: verification.verification_uri, user_code: verification.user_code, tcqUserId: verification.device_code }));
		},
	});

	auth({ type: 'oauth' })
		.then(tokenAuthentication => {
			// @see https://docs.github.com/en/rest/users/users
			return (
				fetch('https://api.github.com/user', {
					headers: {
						Accept: 'application/vnd.github+json',
						Authorization: `Bearer ${tokenAuthentication.token}`,
						'X-GitHub-Api-Version': '2022-11-28',
					},
				})
					.then(response => response.json() as Promise<ghAuthUser>)
					.then(user => ({ user, tokenAuthentication }))
			);
		})
		.then(({ user, tokenAuthentication }) => {
			// This effectively creates a new user as no valid user was found previously
			ghAuthUsers.set(V.device_code, {
				id: V.device_code,
				ghUsername: user.login,
				ghid: user.id,
				name: user.name,
				organization: user.company,
				accessToken: tokenAuthentication.token,
				refreshToken: tokenAuthentication.token
			});
		})
		.catch(err => {
			ghAuthUsers.delete(V.device_code);
			console.error(err, V);
			reject('Authentication failed');
		});
});

export const authenticateGitHub = process.env.NODE_ENV === 'development' ? develAuth : githubAuth;

export const checkTokenValidity = async (token: string): Promise<boolean> => {
	if (process.env.NODE_ENV === 'development') return true;
	const response = await fetch('https://api.github.com/user', {
		method: 'HEAD',
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
		},
	});

	return response.ok;
};
