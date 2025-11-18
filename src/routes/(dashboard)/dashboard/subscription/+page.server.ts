import { redirect } from '@sveltejs/kit';
import { getUserActiveSubscription, countUserStores } from '$lib/server/subscription.js';
import { db } from '$lib/server/db';
import { subscriptionPayment } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function load(event) {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, '/auth/login');
	}

	const subscription = await getUserActiveSubscription(event.locals.user.id);
	const storeCount = await countUserStores(event.locals.user.id);

	// Check for pending subscription payments
	const pendingPayment = await db.query.subscriptionPayment.findFirst({
		where: and(
			eq(subscriptionPayment.userId, event.locals.user.id),
			eq(subscriptionPayment.status, 'pending')
		),
		orderBy: (subscriptionPayment, { desc }) => [desc(subscriptionPayment.createdAt)],
		with: {
			plan: true
		}
	});

	return {
		currentSubscription: {
			planName: subscription.plan.name,
			planSlug: subscription.plan.slug,
			maxStores: subscription.plan.maxStores,
			currentStores: storeCount,
			status: subscription.status,
			endDate: ('endDate' in subscription && subscription.endDate) ? subscription.endDate.toISOString() : null
		},
		pendingPayment: pendingPayment ? {
			paymentRequestId: pendingPayment.paymentRequestId,
			amount: pendingPayment.amount,
			planName: pendingPayment.plan.name,
			expiresAt: pendingPayment.expiresAt?.toISOString() || null,
			createdAt: pendingPayment.createdAt.toISOString()
		} : null
	};
}
