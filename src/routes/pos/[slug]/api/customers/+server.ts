import { db } from '$lib/server/db';
import { order, merchant } from '$lib/server/db/schema';
import { eq, and, like, or, isNotNull, sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	// Check authentication
	if (!locals.sessionPos || !locals.userPos) {
		return json({ success: false, error: 'Not authenticated' }, { status: 401 });
	}

	const slug = params.slug;
	const query = url.searchParams.get('q') || '';

	try {
		// Get merchant
		const merchantData = await db.select().from(merchant).where(eq(merchant.slug, slug)).limit(1);
		if (!merchantData.length) {
			return json({ success: false, error: 'Merchant not found' }, { status: 404 });
		}
		const merchantId = merchantData[0].id;

		// Get unique customers with their most recent order
		const customers = await db
			.select({
				customerName: order.customerName,
				customerPhone: order.customerPhone,
				lastOrderDate: sql<Date>`MAX(${order.createdAt})`.as('lastOrderDate')
			})
			.from(order)
			.where(
				and(
					eq(order.merchantId, merchantId),
					isNotNull(order.customerPhone),
					or(
						like(order.customerName, `%${query}%`),
						like(order.customerPhone, `%${query}%`)
					)
				)
			)
			.groupBy(order.customerPhone, order.customerName)
			.orderBy(sql`MAX(${order.createdAt}) DESC`)
			.limit(10);

		return json({ success: true, customers });
	} catch (error) {
		console.error('Error fetching customers:', error);
		return json({ success: false, error: 'Failed to fetch customers' }, { status: 500 });
	}
};
