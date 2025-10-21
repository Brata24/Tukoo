import {
	validatePasswordResetSessionRequest,
	setPasswordResetSessionAsEmailVerified
} from "$lib/server/auth-handler/password-reset";
import { ExpiringTokenBucket } from "$lib/server/auth-handler/rate-limit";
import { setUserAsEmailVerifiedIfEmailMatches } from "$lib/server/auth-handler/user";
import { fail, redirect } from "@sveltejs/kit";

import type { Actions, RequestEvent } from "./$types";
import { getUserEmailVerificationRequestFromRequest } from "$lib/server/auth-handler/base/email-verification";
import { sendPasswordResetEmail } from "$lib/server/auth-handler/password-reset";

const bucket = new ExpiringTokenBucket<number>(5, 60 * 30);

export async function load(event: RequestEvent) {
	const { session } = await validatePasswordResetSessionRequest(event);
	if (session === null) {
		return redirect(302, "/auth/forgot-password");
	}
	if (session.emailVerified) {
		if (!session.twoFactorVerified) {
			return redirect(302, "/auth/reset-password/2fa");
		}
		return redirect(302, "/auth/reset-password");
	}
	return {
		email: session.email
	};
}

export const actions: Actions = {
	"verify-reset": actionReset,
	"resend-reset": resendReset

};

async function resendReset(event: RequestEvent) {
	const { session, user } = await validatePasswordResetSessionRequest(event);
	if (session === null) {
		return fail(401, {
			message: "Not authenticated"
		});
	}
	console.log(user);
	if (session.emailVerified) {
		return fail(403, {
			message: "Forbidden"
		});
	}
	if (!bucket.check(session.userId, 1)) {
		return fail(429, {
			message: "Too many requests"
		});
	}
	sendPasswordResetEmail(session.email, session.code, session.expiresAt, user.username);
	return {
		resend: {
			message: "A new code was sent to your inbox."
		}
	};
}

async function actionReset(event: RequestEvent) {
	
	const { session } = await validatePasswordResetSessionRequest(event);
	
	if (session === null) {
		return fail(401, {
			message: "Not authenticated"
		});
	}
	if (session.emailVerified) {
		return fail(403, {
			message: "Forbidden"
		});
	}
	if (!bucket.check(session.userId, 1)) {
		return fail(429, {
			message: "Too many requests"
		});
	}

	const formData = await event.request.formData();
	const code = formData.get("code");
	if (typeof code !== "string") {
		return fail(400, {
			message: "Invalid or missing fields"
		});
	}
	if (code === "") {
		return fail(400, {
			message: "Please enter your code"
		});
	}
	if (!bucket.consume(session.userId, 1)) {
		return fail(429, { message: "Too many requests" });
	}
	if (code !== session.code) {
		return fail(400, {
			message: "Incorrect code"
		});
	}
	bucket.reset(session.userId);
	setPasswordResetSessionAsEmailVerified(session.id);
	const emailMatches = setUserAsEmailVerifiedIfEmailMatches(session.userId, session.email);
	if (!emailMatches) {
		return fail(400, {
			message: "Please restart the process"
		});
	}
	return redirect(302, "/auth/reset-password/2fa");
}
