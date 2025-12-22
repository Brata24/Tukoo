import {
	deletePasswordResetSessionTokenCookie,
	invalidateUserPasswordResetSessions,
	validatePasswordResetSessionRequest
} from "$lib/server/auth-handler/password-reset";
import { fail, redirect } from "@sveltejs/kit";
import { verifyPasswordStrength } from "$lib/server/auth-handler/base/password";
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from "$lib/server/auth-handler/session";
import { updateUserPassword } from "$lib/server/auth-handler/user";

import type { Actions, RequestEvent } from "./$types";
import type { SessionFlags } from "$lib/server/auth-handler/session";

export async function load(event: RequestEvent) {
	const { session, user } = await validatePasswordResetSessionRequest(event);
	if (session === null) {
		return redirect(302, "/forgot-password");
	}
	if (!session.emailVerified) {
		return redirect(302, "/auth/reset-password/verify-email");
	}
	if (user.registered2FA && !session.twoFactorVerified) {
		return redirect(302, "/auth/reset-password/2fa");
	}
	return {};
}

export const actions: Actions = {
	"reset-psw": action
};

async function action(event: RequestEvent) {
	const { session: passwordResetSession, user } = await validatePasswordResetSessionRequest(event);
	
	if (passwordResetSession === null) {
		return fail(401, {
			message: "Not authenticated"
		});
	}
	if (!passwordResetSession.emailVerified) {
		return fail(403, {
			message: "Forbidden"
		});
	}
	if (user.registered2FA && !passwordResetSession.twoFactorVerified) {
		return fail(403, {
			message: "Forbidden"
		});
	}
	const formData = await event.request.formData();
	const password = formData.get("password");
	if (typeof password !== "string") {
		return fail(400, {
			message: "Invalid or missing fields"
		});
	}

	const strongPassword = await verifyPasswordStrength(password);
	if (!strongPassword) {
		return fail(400, {
			message: "Weak password"
		});
	}
	invalidateUserPasswordResetSessions(passwordResetSession.userId);
	invalidateUserSessions(passwordResetSession.userId);
	await updateUserPassword(passwordResetSession.userId, password);

	const sessionFlags: SessionFlags = {
		twoFactorVerified: passwordResetSession.twoFactorVerified
	};
	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id, sessionFlags);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);
	deletePasswordResetSessionTokenCookie(event);
	return redirect(302, "/");
}
