import { db } from '$lib/server/db';
import { subscriptionPlan } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const SUPERADMIN_EMAILS = ['admin@tukoo.web.id', 'dcat@tukoo.web.id'];

export const PUT = async ({ request, locals, params }) => {
	try {
		if (!locals.user || !SUPERADMIN_EMAILS.includes(locals.user.email)) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
		}

		const planId = parseInt(params.id);
		const data = await request.json();

		await db
			.update(subscriptionPlan)
			.set({
				name: data.name,
				slug: data.slug,
				price: data.price,
				duration: data.duration,
				maxStores: data.maxStores,
				description: data.description,
				isActive: data.isActive,
				updatedAt: new Date()
			})
			.where(eq(subscriptionPlan.id, planId));

		return new Response(
			JSON.stringify({ success: true }),
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error updating plan:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to update plan', message: String(error) }),
			{ status: 500 }
		);
	}
};
