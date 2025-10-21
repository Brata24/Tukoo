import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { order, orderItem, restaurantTable, merchant } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * GET /api/self-order/track?orderUuid=uuid
 * Get order tracking information
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const orderUuid = url.searchParams.get("orderUuid");

		if (!orderUuid) {
			return json(
				{
					success: false,
					error: "Missing required parameter: orderUuid",
				},
				{ status: 400 }
			);
		}

		// Get order by UUID
		const orderData = await db
			.select()
			.from(order)
			.where(eq(order.uuid, orderUuid))
			.limit(1);

		if (!orderData || orderData.length === 0) {
			return json(
				{
					success: false,
					error: "Order not found",
				},
				{ status: 404 }
			);
		}

		const orderInfo = orderData[0];

		// Get order items
		const items = await db
			.select()
			.from(orderItem)
			.where(eq(orderItem.orderId, orderInfo.id));

		// Get table information
		let table = null;
		if (orderInfo.tableId) {
			const tableData = await db
				.select()
				.from(restaurantTable)
				.where(eq(restaurantTable.id, orderInfo.tableId))
				.limit(1);

			if (tableData && tableData.length > 0) {
				table = tableData[0];
			}
		}

		// Get merchant information
		const merchantData = await db
			.select()
			.from(merchant)
			.where(eq(merchant.id, orderInfo.merchantId))
			.limit(1);

		if (!merchantData || merchantData.length === 0) {
			return json(
				{
					success: false,
					error: "Merchant not found",
				},
				{ status: 404 }
			);
		}

		const merchantInfo = merchantData[0];

		return json({
			success: true,
			data: {
				order: orderInfo,
				items,
				table,
				merchant: merchantInfo,
			},
		});
	} catch (error) {
		console.error("Error tracking order:", error);
		return json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
};
