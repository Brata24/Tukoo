import { db } from '$lib/server/db';
import { userSubscription, subscriptionPlan, merchant } from '$lib/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';

/**
 * Get user's active subscription with plan details
 */
export async function getUserActiveSubscription(userId: number) {
	const now = new Date();
	
	const activeSub = await db.query.userSubscription.findFirst({
		where: and(
			eq(userSubscription.userId, userId),
			eq(userSubscription.status, 'active'),
			gte(userSubscription.endDate, now)
		),
		with: {
			plan: true
		}
	});

	// If no active subscription, return free plan
	if (!activeSub) {
		const freePlan = await db.query.subscriptionPlan.findFirst({
			where: eq(subscriptionPlan.slug, 'free')
		});
		
		return {
			id: 0,
			userId,
			planId: freePlan?.id || 0,
			status: 'free' as const,
			plan: freePlan || {
				id: 0,
				name: 'Free',
				slug: 'free',
				price: 0,
				duration: 30,
				maxStores: 1,
				description: 'Free plan',
				isActive: 1
			}
		};
	}

	return activeSub;
}

/**
 * Count user's existing stores
 */
export async function countUserStores(userId: number): Promise<number> {
	const stores = await db.query.merchant.findMany({
		where: eq(merchant.userId, userId)
	});
	return stores.length;
}

/**
 * Check if user can create a new store
 */
export async function canCreateStore(userId: number): Promise<{ allowed: boolean; reason?: string; currentCount?: number; maxStores?: number }> {
	const subscription = await getUserActiveSubscription(userId);
	const currentCount = await countUserStores(userId);
	
	if (currentCount >= subscription.plan.maxStores) {
		return {
			allowed: false,
			reason: `You have reached your store limit (${subscription.plan.maxStores} stores). Please upgrade your plan to create more stores.`,
			currentCount,
			maxStores: subscription.plan.maxStores
		};
	}

	return {
		allowed: true,
		currentCount,
		maxStores: subscription.plan.maxStores
	};
}

/**
 * Activate subscription after successful payment
 */
export async function activateSubscription(userId: number, planId: number) {
	const plan = await db.query.subscriptionPlan.findFirst({
		where: eq(subscriptionPlan.id, planId)
	});

	if (!plan) {
		throw new Error('Plan not found');
	}

	const startDate = new Date();
	const endDate = new Date();
	endDate.setDate(endDate.getDate() + plan.duration);

	// Create or update subscription
	const existingSub = await db.query.userSubscription.findFirst({
		where: eq(userSubscription.userId, userId)
	});

	if (existingSub) {
		// Update existing subscription
		await db
			.update(userSubscription)
			.set({
				planId: plan.id,
				status: 'active',
				startDate,
				endDate,
				updatedAt: new Date()
			})
			.where(eq(userSubscription.userId, userId));
	} else {
		// Create new subscription
		await db.insert(userSubscription).values({
			userId,
			planId: plan.id,
			status: 'active',
			startDate,
			endDate
		});
	}

	console.log(`[Subscription] Activated subscription for user ${userId}, plan ${plan.name}, expires at ${endDate}`);
}
