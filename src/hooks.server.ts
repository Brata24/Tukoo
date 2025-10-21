
import { RefillingTokenBucket } from "$lib/server/auth-handler/rate-limit";
import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie } from "$lib/server/auth-handler/session";
import { initializeApp } from "$lib/server/utils/init";
import { getMerchantBySlug } from "$lib/server/merchant";
import { validatePosSessionToken } from "$lib/server/pos";
import { sequence } from "@sveltejs/kit/hooks";

import type { Handle, Reroute } from "@sveltejs/kit";


initializeApp();

const bucket = new RefillingTokenBucket<string>(100, 1);


const rateLimitHandle: Handle = async ({ event, resolve }) => {

	const clientIP = event.request.headers.get("X-Forwarded-For");
	if (clientIP === null) {
		return resolve(event);
	}
	let cost: number;
	if (event.request.method === "GET" || event.request.method === "OPTIONS") {
		cost = 1;
	} else {
		cost = 3;
	}
	if (!bucket.consume(clientIP, cost)) {
		return new Response("Too many requests", {
			status: 429
		});
	}
	return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {


	if (event.locals.isPOSRequest) {
		console.log('POS request, using POS auth');
		const token = event.cookies.get("session") ?? null;
		if (token === null) {
			event.locals.sessionPos = null;
			event.locals.userPos = null;
			return resolve(event);
		}

		const result = await validatePosSessionToken(token);
		
		if (result !== null) {
			// expiresAt is already a Date object from validatePosSessionToken
			setSessionTokenCookie(event, token, result.session.expiresAt);
			event.locals.sessionPos = result.session;
			event.locals.userPos = result.user;
		} else {
			deleteSessionTokenCookie(event);
			event.locals.sessionPos = null;
			event.locals.userPos = null;
		}
		return resolve(event);
	} else {
		const token = event.cookies.get("session") ?? null;
		if (token === null) {
			event.locals.user = null;
			event.locals.session = null;
			return resolve(event);
		}

		const { session, user } = await validateSessionToken(token);
		if (session !== null) {
			setSessionTokenCookie(event, token, session.expiresAt);
		} else {
			deleteSessionTokenCookie(event);
		}

		event.locals.session = session;
		event.locals.user = user;
		return resolve(event);
	}

	


};

const posHandle: Handle = async ({ event, resolve }) => {
	const hostname = event.url.host;
	if (hostname !== 'beta.tukoo.test' && hostname !== 'beta.tukoo.web.id' && hostname !== 'localhost' && hostname !== '127.0.0.1') {

		let subdomain = '';
		if (hostname.endsWith('.beta.tukoo.test')) {
			subdomain = hostname.replace('.beta.tukoo.test', '');
		} else if (hostname.endsWith('.beta.tukoo.web.id')) {
			subdomain = hostname.replace('.beta.tukoo.web.id', '');
		} else if (hostname.includes('.') && !hostname.startsWith('www.')) {
			subdomain = hostname.split('.')[0];
		}

		if (subdomain) {
			const merchant = await getMerchantBySlug(subdomain);
			if (merchant && merchant.isActive) {
				event.locals.merchant = merchant;
				event.locals.isPOSRequest = true;
			} else {
				return new Response('Store not found or inactive', { status: 404 });
			}
		}
	}

	return resolve(event);
};

export const handle = sequence(rateLimitHandle, posHandle, authHandle);

