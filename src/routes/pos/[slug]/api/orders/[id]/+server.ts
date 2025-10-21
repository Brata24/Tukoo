import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { order, orderItem, restaurantTable } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET = async ({ locals, params }: any) => {
	const merchantId = locals.userPos?.merchantId;
	const orderId = parseInt(params.id);

	if (!merchantId) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	if (isNaN(orderId)) {
		return json({ success: false, error: 'Invalid order ID' }, { status: 400 });
	}

	try {
		// Get order with table info
		const orderData = await db
			.select({
				order: order,
				table: restaurantTable
			})
			.from(order)
			.leftJoin(restaurantTable, eq(order.tableId, restaurantTable.id))
			.where(and(eq(order.id, orderId), eq(order.merchantId, merchantId)))
			.limit(1);

		if (!orderData || orderData.length === 0) {
			return json({ success: false, error: 'Order not found' }, { status: 404 });
		}

		// Get order items - using only snapshot data from orderItem table
		// This ensures historical data integrity even if products are deleted
		const items = await db
			.select({
				orderItem: orderItem
			})
			.from(orderItem)
			.where(eq(orderItem.orderId, orderId));

		return json({
			success: true,
			order: orderData[0].order,
			table: orderData[0].table,
			items: items
		});
	} catch (error) {
		console.error('Fetch order details error:', error);
		return json({ success: false, error: 'Failed to fetch order details' }, { status: 500 });
	}
};
