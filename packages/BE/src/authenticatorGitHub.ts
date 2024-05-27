// https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
// https://github.com/octokit/auth-oauth-device.js
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { createCookie } from './handlerCookie';
import { deleteUserWithId, upsertUser } from './handlerStorage';
import type { UserInternal } from '.';

const develAuth = () =>
	new Promise<Response>((resolve, reject) => {
		const verification = {
			device_code: '3584d83530557fdd1f46af8289938c8ef79f9dc5',
			user_code: 'WDJB-MJHT',
			verification_uri: 'https://test.localhost:3000/login/device',
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
			name: 'Tim Tester',
			email: 'tim.tester@zalari.de',
			ghId: 1337,
			organization: 'Zalari',
			isChair: CHAIRS.includes(1337) ?? false,
			lastLogin: new Date().toISOString(),
			token: tokenAuthentication.token,
		} satisfies UserInternal;
		try {
			console.debug('Open %s and enter code: %s', verification.verification_uri, verification.user_code);
			resolve(
				new Response(JSON.stringify({ verification_uri: verification.verification_uri, user_code: verification.user_code }), {
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						'Set-Cookie': createCookie({
							name: 'tcqUserId',
							value: verification.device_code,
							maxAge: verification.expires_in,
						}),
					},
				}),
			);
			console.debug(user);
			upsertUser(user);
		} catch (err) {
			console.error(err, verification);
			deleteUserWithId(verification.device_code);
			reject('Authentication failed');
		}
	});

const githubAuth = () =>
	new Promise<Response>((resolve, reject) => {
		// `V` is typed as this because `Verification` is not exported from the module
		let V: { device_code: string; user_code: string; verification_uri: string; expires_in: number; interval: number; };

		const auth = createOAuthDeviceAuth({
			clientType: 'oauth-app',
			clientId: process.env.OAUTH_CLIENT_ID ?? 'missing_client_id',
			scopes: process.env.OAUTH_SCOPES?.split(',') ?? ['read:user', 'user:email'],
			onVerification(verification) {
				/* @example verification
				{
					device_code: "3584d83530557fdd1f46af8289938c8ef79f9dc5",
					user_code: "WDJB-MJHT",
					verification_uri: "https://github.com/login/device",
					expires_in: 900,
					interval: 5,
				}; */
				V = verification;

				console.debug(verification);
				console.debug('Open %s and enter code: %s', verification.verification_uri, verification.user_code);

				resolve(
					new Response(JSON.stringify({ verification_uri: verification.verification_uri, user_code: verification.user_code }), {
						status: 200,
						headers: {
							'Content-Type': 'application/json',
							'Set-Cookie': createCookie({
								name: 'tcqUserId',
								value: verification.device_code,
								maxAge: verification.expires_in,
							}),
						},
					}),
				);
			},
		});

		auth({ type: 'oauth' })
			.then(tokenAuthentication => {
				/* @example tokenAuthentication
				{
					type: "token",
					tokenType: "oauth",
					clientType: "oauth-app",
					clientId: "5854a146b6ed03847390",
					token: "gho_vsuCx***KQ18RArz",
					scopes: [ "read:user,user:email" ],
				} */
				console.debug(tokenAuthentication, V);
				// @see https://docs.github.com/en/rest/users/users
				return (
					fetch('https://api.github.com/user', {
						headers: {
							Accept: 'application/vnd.github+json',
							Authorization: `Bearer ${tokenAuthentication.token}`,
							'X-GitHub-Api-Version': '2022-11-28',
						},
					})
						.then(response => response.json())
						/* @example user
						{
							"login": "TimTester",
							"id": 1337,
							"avatar_url": "https://avatars.githubusercontent.com/u/1337?v=4",
							"url": "https://api.github.com/users/TimTester",
							"html_url": "https://github.com/TimTester",
							"type": "User",
							"name": "Tim Tester",
							"company": "@zalari ",
							"location": null,
							"email": "tim.tester@zalari.de"
						} */
						.then(user => ({ user, tokenAuthentication }))
				);
			})
			.then(({ user, tokenAuthentication }) => {
				// This effectively creates a new user as no valid user was found previously
				console.debug(user);
				upsertUser({
					id: V.device_code,
					name: user.name,
					email: user.email,
					ghId: user.id,
					organization: user.company,
					isChair: CHAIRS.includes(user.id) ?? false,
					lastLogin: new Date().toISOString(),
					token: tokenAuthentication.token,
				});
			})
			.catch(err => {
				deleteUserWithId(V.device_code);
				console.error(err, V);
				reject('Authentication failed');
			});
	});

export const authenticateGitHub = process.env.DEVELOPMENT === 'true' ? develAuth : githubAuth;

export const checkTokenValidity = async (token: string): Promise<boolean> => {
	const response = await fetch('https://api.github.com/user', {
		method: 'HEAD',
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
		},
	});

	if (!response.ok) throw new Error('Token invalid');
	return response.ok;
};
