import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { order, orderItem, product, restaurantTable, merchant } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const orderUuid = url.searchParams.get('orderUuid');

		if (!orderUuid) {
			return json({ success: false, error: 'Order UUID is required' }, { status: 400 });
		}

		// Get order
		const orderData = await db.query.order.findFirst({
			where: eq(order.uuid, orderUuid)
		});

		if (!orderData) {
			return json({ success: false, error: 'Order not found' }, { status: 404 });
		}

		// Get order items with product details
		const items = await db
			.select({
				id: orderItem.id,
				productId: orderItem.productId,
				productName: orderItem.productName,
				productImage: product.photo,
				quantity: orderItem.quantity,
				unitPrice: orderItem.unitPrice,
				subtotal: orderItem.subtotal
			})
			.from(orderItem)
			.leftJoin(product, eq(orderItem.productId, product.id))
			.where(eq(orderItem.orderId, orderData.id));

		// Get table (if order has tableId)
		let tableData = null;
		if (orderData.tableId) {
			tableData = await db.query.restaurantTable.findFirst({
				where: eq(restaurantTable.id, orderData.tableId)
			});
		}

		// Get merchant
		const merchantData = await db.query.merchant.findFirst({
			where: eq(merchant.id, orderData.merchantId)
		});

		return json({
			success: true,
			data: {
				order: {
					id: orderData.id,
					uuid: orderData.uuid,
					orderNumber: orderData.orderNumber,
					customerName: orderData.customerName,
					customerPhone: orderData.customerPhone,
					total: orderData.total,
					processingStatus: orderData.processingStatus,
					paymentStatus: orderData.paymentStatus,
					paymentMethod: orderData.paymentMethod,
					createdAt: orderData.createdAt
				},
				items,
				table: tableData ? {
					name: tableData.name
				} : null,
				merchant: merchantData ? {
					name: merchantData.name,
					logo: merchantData.logo,
					primaryColor: merchantData.primaryColor,
					secondaryColor: merchantData.secondaryColor,
					secondaryTextColor: merchantData.secondaryTextColor
				} : null
			}
		});
	} catch (error) {
		console.error('Error tracking order:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
