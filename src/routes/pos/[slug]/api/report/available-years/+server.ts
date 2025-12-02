import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { merchant, order } from '$lib/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.sessionPos || !locals.userPos) {
		throw error(401, 'Unauthorized');
	}

	const merchantData = await db.query.merchant.findFirst({
		where: eq(merchant.slug, params.slug)
	});

	if (!merchantData) {
		throw error(404, 'Merchant not found');
	}

	// Check if user has access to this merchant
	if (locals.userPos.merchantId !== merchantData.id) {
		throw error(403, 'Forbidden');
	}

	// Get distinct years that have paid orders
	const availableYears = await db
		.selectDistinct({
			year: sql<number>`YEAR(${order.createdAt})`
		})
		.from(order)
		.where(
			and(
				eq(order.merchantId, merchantData.id),
				eq(order.status, 'paid')
			)
		)
		.orderBy(sql`YEAR(${order.createdAt}) DESC`);

	return json({
		years: availableYears.map(y => y.year)
	});
};
