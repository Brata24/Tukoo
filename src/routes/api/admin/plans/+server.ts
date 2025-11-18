import { db } from '$lib/server/db';
import { subscriptionPlan } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const SUPERADMIN_EMAILS = ['admin@tukoo.web.id', 'dcat@tukoo.web.id'];

export const POST = async ({ request, locals }) => {
	try {
		if (!locals.user || !SUPERADMIN_EMAILS.includes(locals.user.email)) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
		}

		const data = await request.json();

		const [plan] = await db
			.insert(subscriptionPlan)
			.values({
				name: data.name,
				slug: data.slug,
				price: data.price,
				duration: data.duration,
				maxStores: data.maxStores,
				description: data.description,
				isActive: data.isActive
			})
			.$returningId();

		return new Response(
			JSON.stringify({ success: true, data: { id: plan.id } }),
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error creating plan:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to create plan', message: String(error) }),
			{ status: 500 }
		);
	}
};
