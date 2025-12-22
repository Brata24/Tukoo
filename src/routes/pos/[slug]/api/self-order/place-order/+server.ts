import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { restaurantTable, merchant, order, orderItem } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * POST /api/self-order/place-order
 * Place a new self-order
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { slug, qrToken, customerName, customerPhone, items } = body;

		// Validate required fields
		if (!slug || !qrToken) {
			return json(
				{
					success: false,
					error: "Missing required parameters: slug and qrToken",
				},
				{ status: 400 }
			);
		}

		if (!items || !Array.isArray(items) || items.length === 0) {
			return json(
				{
					success: false,
					error: "Cart is empty",
				},
				{ status: 400 }
			);
		}

		// Find merchant by slug
		const merchantData = await db
			.select()
			.from(merchant)
			.where(eq(merchant.slug, slug))
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

		// Find table by QR token
		const tableData = await db
			.select()
			.from(restaurantTable)
			.where(
				and(
					eq(restaurantTable.qrToken, qrToken),
					eq(restaurantTable.merchantId, merchantInfo.id),
					eq(restaurantTable.isActive, 1)
				)
			)
			.limit(1);

		if (!tableData || tableData.length === 0) {
			return json(
				{
					success: false,
					error: "Table not found or inactive",
				},
				{ status: 404 }
			);
		}

		const table = tableData[0];

		// Calculate totals
		let subtotal = 0;
		for (const item of items) {
			subtotal += item.price * item.quantity;
		}

		const tax = 0;
		const tip = 0;
		const total = subtotal + tax + tip;

		// Generate order number
		const now = new Date();
		const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
		const randomNum = Math.floor(Math.random() * 1000)
			.toString()
			.padStart(3, "0");
		const orderNumber = `ORD-${table.id}-${dateStr}-${randomNum}`;

		// Create order
		const [newOrder] = await db
			.insert(order)
			.values({
				orderNumber,
				merchantId: merchantInfo.id,
				tableId: table.id,
				diningOption: "dinein",
				customerName: customerName || null,
				customerPhone: customerPhone || null,
				subtotal,
				tax,
				tip,
				total,
				status: "pending",
				processingStatus: "new",
				paymentStatus: "unpaid",
			})
			.$returningId();

		// Create order items
		for (const item of items) {
			await db.insert(orderItem).values({
				orderId: newOrder.id,
				productId: item.productId,
				productName: item.name,
				variantId: item.variantId || null,
				variantName: item.variantName || null,
				variantValue: item.variantValue || null,
				quantity: item.quantity,
				unitPrice: item.price,
				subtotal: item.price * item.quantity,
			});
		}

		// Get the created order with UUID
		const createdOrder = await db
			.select()
			.from(order)
			.where(eq(order.id, newOrder.id))
			.limit(1);

		if (!createdOrder || createdOrder.length === 0) {
			return json(
				{
					success: false,
					error: "Failed to create order",
				},
				{ status: 500 }
			);
		}

		const orderUuid = createdOrder[0].uuid;

		// Send WhatsApp notification if phone number is provided
		if (customerPhone && customerPhone.trim() !== "") {
			const trackingUrl = `${process.env.PUBLIC_BASE_URL || "http://localhost:5173"}/pos/${slug}/order/${qrToken}/track/${orderUuid}`;

			try {
				const response = await fetch(
					`${process.env.PUBLIC_BASE_URL || "http://localhost:5173"}/api/notifications/whatsapp`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							phoneNumber: customerPhone,
							orderNumber: orderNumber,
							merchantName: merchantInfo.name,
							trackingUrl: trackingUrl,
							orderStatus: "new",
						}),
					}
				);

				const result = await response.json();
				console.log("WhatsApp notification result:", result);
			} catch (error) {
				console.error("Failed to send WhatsApp notification:", error);
				// Don't fail the order if notification fails
			}
		}

		return json({
			success: true,
			data: {
				orderId: newOrder.id,
				orderUuid,
				orderNumber,
				trackingUrl: `/pos/${slug}/order/${qrToken}/track/${orderUuid}`,
			},
		});
	} catch (error) {
		console.error("Error placing order:", error);
		return json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
};
