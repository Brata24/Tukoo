import { user } from '$lib/server/db/schema.js';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	console.log(url.pathname);
	if (
		(locals.sessionPos === null || locals.userPos === null) &&
		(url.pathname !== '/auth/login' && !url.pathname.startsWith('/order'))
	) {
		return redirect(302, "/auth/login");
	}


	if (locals.userPos?.role == "manager" && url.pathname === '/') {
		return redirect(302, "/manage");
	}

	if (locals.userPos?.role == "staff" && url.pathname === '/') {
		return redirect(302, "/sales");
	}
	return {
		merchant: locals.merchant,
		isPOSRequest: locals.isPOSRequest || false,
		user: locals.userPos,
		session: locals.sessionPos
	};
};