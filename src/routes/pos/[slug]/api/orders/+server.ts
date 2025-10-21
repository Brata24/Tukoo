import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { order, orderItem, restaurantTable } from '$lib/server/db/schema';
import { eq, desc, sql, and, like, or } from 'drizzle-orm';

export const GET = async ({ locals, url }: any) => {
	const merchantId = locals.userPos?.merchantId;

	if (!merchantId) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	// Get filter parameters from query
	const status = url.searchParams.get('status');
	const paymentStatus = url.searchParams.get('paymentStatus');
	const diningOption = url.searchParams.get('diningOption');
	const search = url.searchParams.get('search');
	
	// Get pagination parameters
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const offset = (page - 1) * limit;

	// Build where conditions
	const conditions: any[] = [eq(order.merchantId, merchantId)];

	if (status && status !== 'all') {
		conditions.push(eq(order.status, status));
	}

	if (paymentStatus && paymentStatus !== 'all') {
		conditions.push(eq(order.paymentStatus, paymentStatus));
	}

	if (diningOption && diningOption !== 'all') {
		conditions.push(eq(order.diningOption, diningOption));
	}

	if (search) {
		conditions.push(
			or(
				like(order.orderNumber, `%${search}%`),
				like(order.customerName, `%${search}%`)
			)
		);
	}

	// Get total count for pagination
	const totalCountResult = await db
		.select({ count: sql<number>`COUNT(DISTINCT ${order.id})` })
		.from(order)
		.where(and(...conditions));

	const totalOrders = totalCountResult[0]?.count || 0;
	const totalPages = Math.ceil(totalOrders / limit);

	// Get orders with filters and pagination
	const orders = await db
		.select({
			order: order,
			table: restaurantTable,
			itemCount: sql<number>`COUNT(DISTINCT ${orderItem.id})`.as('itemCount')
		})
		.from(order)
		.leftJoin(restaurantTable, eq(order.tableId, restaurantTable.id))
		.leftJoin(orderItem, eq(orderItem.orderId, order.id))
		.where(and(...conditions))
		.groupBy(order.id, restaurantTable.id)
		.orderBy(desc(order.createdAt))
		.limit(limit)
		.offset(offset);

	return json({ 
		success: true, 
		orders,
		pagination: {
			page,
			limit,
			totalOrders,
			totalPages
		}
	});
};
