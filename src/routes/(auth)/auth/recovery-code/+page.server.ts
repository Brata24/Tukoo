import { getUserRecoverCode } from "$lib/server/auth-handler/user";
import { redirect } from "@sveltejs/kit";

import type { RequestEvent } from "./$types";

export async function load(event: RequestEvent) {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, "/auth/login");
	}
	if (!event.locals.user.emailVerified) {
		return redirect(302, "/auth/verify-email");
	}
	if (event.locals.user.enabled2FA) {
		if (!event.locals.user.registered2FA) {
			return redirect(302, "/auth/2fa/setup");
		}
		if (!event.locals.session.twoFactorVerified) {
			return redirect(302, "/auth/2fa");
		}
	} else {
		return redirect(302, "/settings/");
	}
	const recoveryCode = await getUserRecoverCode(event.locals.user.id);
	console.log({ recoveryCode });
	return {
		recoveryCode
	};
}
