import { verifyEmailInput } from "$lib/server/auth-handler/base/email";
import { getUserFromEmail } from "$lib/server/auth-handler/user";
import {
	createPasswordResetSession,
	invalidateUserPasswordResetSessions,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie,
	deletePasswordResetSessionTokenCookie
} from "$lib/server/auth-handler/password-reset";
import { RefillingTokenBucket } from "$lib/server/auth-handler/rate-limit";
import { generateSessionToken } from "$lib/server/auth-handler/session";
import { fail, redirect } from "@sveltejs/kit";

import type { Actions, RequestEvent, PageServerLoadEvent } from "./$types";

const ipBucket = new RefillingTokenBucket<string>(3, 60);
const userBucket = new RefillingTokenBucket<number>(3, 60);

export async function load(event: PageServerLoadEvent) {
	// Clear any existing password reset session
	deletePasswordResetSessionTokenCookie(event);
	return {};
}

export const actions: Actions = {
	"forgot-psw": action
};

async function action(event: RequestEvent) {
	// TODO: Assumes X-Forwarded-For is always included.
	const clientIP = event.request.headers.get("X-Forwarded-For");
	if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
		return fail(429, {
			message: "Too many requests",
			email: ""
		});
		
	}

	const formData = await event.request.formData();
	const email = formData.get("email");
	if (typeof email !== "string") {
		return fail(400, {
			message: "Invalid or missing fields",
			email: ""
		});
	}
	if (!verifyEmailInput(email)) {
		return fail(400, {
			message: "Invalid email",
			email
		});
	}
	const user = await getUserFromEmail(email);
	if (user === null) {
		return fail(400, {
			message: "Account does not exist",
			email,
			verify: {
				message: "Enter your code"
			}
		});
		
	}
	if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
		return fail(400, {
			message: "Too many requests",
			email
		});
	}
	if (!userBucket.consume(user.id, 1)) {
		return fail(400, {
			message: "Too many requests",
			email
		});
	}
	invalidateUserPasswordResetSessions(user.id);
	const sessionToken = generateSessionToken();
	const session = await createPasswordResetSession(sessionToken, user.id, user.email);
	sendPasswordResetEmail(session.email, session.code, session.expiresAt, user.username);
	setPasswordResetSessionTokenCookie(event, sessionToken, session.expiresAt);
	return redirect(302, "/auth/reset-password/verify-email");
}
