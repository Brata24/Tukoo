import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { promoBanner, merchant } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.session || !locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Get merchant
	const merchantData = await db.query.merchant.findFirst({
		where: eq(merchant.uuid, params.uuid)
	});

	if (!merchantData) {
		throw error(404, 'Merchant not found');
	}

	// Verify ownership
	if (merchantData.userId !== locals.user.id) {
		throw error(403, 'You do not have permission to access this merchant');
	}

	// Get banners
	const banners = await db
		.select()
		.from(promoBanner)
		.where(eq(promoBanner.merchantId, merchantData.id))
		.orderBy(promoBanner.order);

	return {
		merchant: merchantData,
		banners: banners.map(b => ({
			id: b.id,
			title: b.title,
			image: b.image,
			order: b.order,
			isActive: b.isActive === 1
		}))
	};
};
