import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { subscriptionPlan } from '$lib/server/db/schema';

// Simple superadmin check - you can enhance this
const SUPERADMIN_EMAILS = ['admin@tukoo.web.id', 'dcat@tukoo.web.id'];

export async function load(event) {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, '/auth/login');
	}

	// Check if user is superadmin
	if (!SUPERADMIN_EMAILS.includes(event.locals.user.email)) {
		return redirect(302, '/dashboard');
	}

	const plans = await db.query.subscriptionPlan.findMany({
		orderBy: (plans, { asc }) => [asc(plans.price)]
	});

	return {
		plans
	};
}
