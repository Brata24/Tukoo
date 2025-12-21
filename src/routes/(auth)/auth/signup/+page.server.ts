import { fail, redirect } from "@sveltejs/kit";
import { checkEmailAvailability, verifyEmailInput } from "$lib/server/auth-handler/base/email";
import { createUser, verifyUsernameInput } from "$lib/server/auth-handler/user";
import { RefillingTokenBucket } from "$lib/server/auth-handler/rate-limit";
import { verifyPasswordStrength } from "$lib/server/auth-handler/base/password";
import { createSession, generateSessionToken, setSessionTokenCookie, invalidateSession, deleteSessionTokenCookie } from "$lib/server/auth-handler/session";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie
} from "$lib/server/auth-handler/base/email-verification";

import type { SessionFlags } from "$lib/server/auth-handler/session";
import type { Actions, PageServerLoadEvent, RequestEvent } from "./$types";

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export function load(event: PageServerLoadEvent) {
	if (event.locals.session !== null && event.locals.user !== null) {
		// If user has unverified email (coming back from verify-email page), clear session
		if (!event.locals.user.emailVerified) {
			invalidateSession(event.locals.session.id);
			deleteSessionTokenCookie(event);
			return {};
		}
		if (!event.locals.user.registered2FA) {
			return redirect(302, "/auth/2fa/setup");
		}
		if (!event.locals.session.twoFactorVerified) {
			return redirect(302, "/auth/2fa");
		}
		return redirect(302, "/");
	}
	return {};
}

export const actions: Actions = {
	default: action
};

async function action(event: RequestEvent) {
	// TODO: Assumes X-Forwarded-For is always included.
	const clientIP = event.request.headers.get("X-Forwarded-For");
	if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
		return fail(429, {
			message: "Too many requests",
			email: "",
			username: ""
		});
	}

	const formData = await event.request.formData();
	const email = formData.get("email");

	const fullname = formData.get("fullname");
	const phone = formData.get("phone");
	const username = formData.get("username");
	const password = formData.get("password");
	if (typeof email !== "string" || typeof username !== "string" || typeof password !== "string" || typeof fullname != "string" || typeof phone != "string") {
		return fail(400, {
			message: "Invalid or missing fields",
			email: "",
			username: ""
		});
	}
	if (email === "" || password === "" || username === "" || phone === "" || fullname === "") {
		return fail(400, {
			message: "Please enter your username, email, password, phone number, and full name",
			email: "",
			username: ""
		});
	}
	if (!verifyEmailInput(email)) {
		return fail(400, {
			message: "Invalid email",
			email,
			username
		});
	}
	const emailAvailable = await checkEmailAvailability(email);
	console.log(emailAvailable);
	if (!emailAvailable) {
		return fail(400, {
			message: "Email is already used",
			email,
			username
		});
	}
	if (!verifyUsernameInput(username)) {
		return fail(400, {
			message: "Invalid username",
			email,
			username
		});
	}
	const strongPassword = await verifyPasswordStrength(password);
	if (!strongPassword) {
		return fail(400, {
			message: "Weak password",
			email,
			username
		});
	}
	if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
		return fail(429, {
			message: "Too many requests",
			email,
			username
		});
	}
	
	try {
		const user = await createUser(email, username, password, fullname, phone, true);
		const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
		sendVerificationEmail(emailVerificationRequest.email, fullname, emailVerificationRequest.code, emailVerificationRequest.expiresAt);
		setEmailVerificationRequestCookie(event, emailVerificationRequest);

		const sessionFlags: SessionFlags = {
			twoFactorVerified: false
		};
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id, sessionFlags);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		throw redirect(302, "/auth/2fa/setup");
	} catch (error: any) {
		
		if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
			return fail(400, {
				message: "This email is already registered. Please use a different email or try logging in.",
				email,
				username
			});
		}
		
		throw error;
	}
}
