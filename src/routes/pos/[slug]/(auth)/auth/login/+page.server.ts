import { fail, redirect } from "@sveltejs/kit";
import { RefillingTokenBucket, Throttler } from "$lib/server/auth-handler/rate-limit";
import { setSessionTokenCookie } from "$lib/server/auth-handler/session";
import { verifyPosUserPassword, generatePosSessionToken, createPosSession } from "$lib/server/pos";

import type { Actions, PageServerLoadEvent, RequestEvent } from "./$types";

export function load(event: PageServerLoadEvent) {
	
	if (event.locals.sessionPos !== null && event.locals.userPos !== null) {
		return redirect(302, "/");
	}
	return {
		merchant: event.locals.merchant
	};
}

const throttler = new Throttler<number>([0, 1, 2, 4, 8, 16, 30, 60, 180, 300]);
const ipBucket = new RefillingTokenBucket<string>(20, 1);

export const actions: Actions = {
	default: action
};

async function action(event: RequestEvent) {

	const clientIP = event.request.headers.get("X-Forwarded-For");
	if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
		return fail(429, {
			message: "Too many requests",
			username: ""
		});
	}

	const formData = await event.request.formData();
	const username = formData.get("username");
	const password = formData.get("password");
	
	if (typeof username !== "string" || typeof password !== "string") {
		return fail(400, {
			message: "Invalid or missing fields",
			username: ""
		});
	}
	
	if (username === "" || password === "") {
		return fail(400, {
			message: "Please enter your username and password.",
			username
		});
	}

	
	const result = await verifyPosUserPassword(username, password);
	
	if (!result.success || !result.user) {
		return fail(401, {
			message: "Invalid username or password",
			username
		});
	}

	// Verify user belongs to current merchant
	if (event.locals.merchant && result.user.merchantId !== event.locals.merchant.id) {
		return fail(403, {
			message: "Access denied to this store",
			username
		});
	}

	if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
		return fail(429, {
			message: "Too many requests",
			username: ""
		});
	}
	
	if (!throttler.consume(result.user.id)) {
		return fail(429, {
			message: "Too many requests",
			username: ""
		});
	}

	throttler.reset(result.user.id);

	// Create POS session
	const token = generatePosSessionToken();
	const session = await createPosSession(token, result.user.id);

	// Set cookie with session expiresAt
	setSessionTokenCookie(event, token, session.expiresAt);

	return redirect(302, "/");
}
