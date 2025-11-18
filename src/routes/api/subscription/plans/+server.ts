import { db } from '$lib/server/db';
import { subscriptionPlan } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async () => {
	try {
		const plans = await db.query.subscriptionPlan.findMany({
			where: eq(subscriptionPlan.isActive, 1)
		});

		return new Response(
			JSON.stringify({
				success: true,
				data: plans
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('Error fetching subscription plans:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Failed to fetch subscription plans'
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
