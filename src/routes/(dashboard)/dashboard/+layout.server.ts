import { redirect } from "@sveltejs/kit";


export function load(event) {
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
	}
	
	return {
		user: event.locals.user
	};


}



