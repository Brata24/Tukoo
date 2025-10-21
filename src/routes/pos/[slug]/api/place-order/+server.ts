import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { merchant, restaurantTable, order, orderItem } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request, url }) => {
	try {
		const { slug } = params;
		const body = await request.json();
		const { qrToken, customerName, customerPhone, items, paymentMethod = 'qris' } = body;

		if (!qrToken) {
			return json({ success: false, error: 'QR Token is required' }, { status: 400 });
		}

		if (!customerName) {
			return json({ success: false, error: 'Customer name is required' }, { status: 400 });
		}

		if (!items || items.length === 0) {
			return json({ success: false, error: 'Order items are required' }, { status: 400 });
		}

		if (!['qris', 'cash'].includes(paymentMethod)) {
			return json({ success: false, error: 'Invalid payment method' }, { status: 400 });
		}

		// Get merchant
		const merchantData = await db.query.merchant.findFirst({
			where: eq(merchant.slug, slug)
		});

		if (!merchantData) {
			return json({ success: false, error: 'Merchant not found' }, { status: 404 });
		}

		// Get table
		const tableData = await db.query.restaurantTable.findFirst({
			where: and(
				eq(restaurantTable.qrToken, qrToken),
				eq(restaurantTable.merchantId, merchantData.id)
			)
		});

		if (!tableData) {
			return json({ success: false, error: 'Table not found' }, { status: 404 });
		}

		// Validate payment method based on table settings
		if (paymentMethod === 'cash' && tableData.allowPayAtCashier === 0) {
			return json({ 
				success: false, 
				error: 'Cash payment is not allowed for this table. Please use QRIS.' 
			}, { status: 400 });
		}

		// Calculate total
		let subtotal = 0;
		for (const item of items) {
			subtotal += item.unitPrice * item.quantity;
		}

		// Generate order number for Self Order
		// Format: SO-{merchantId}-{tableId}-{sequence} (SO = Self Order)
		const timestamp = Date.now();
		const sequence = String(timestamp).slice(-8); // Last 8 digits
		const orderNumber = `SO-${merchantData.id}-${tableData.id}-${sequence}`;
		const orderUuid = crypto.randomUUID();

		// Create order
		await db.insert(order).values({
			merchantId: merchantData.id,
			tableId: tableData.id,
			orderNumber,
			uuid: orderUuid,
			diningOption: 'dinein',
			customerName,
			customerPhone: customerPhone || null,
			subtotal,
			tax: 0,
			tip: 0,
			total: subtotal,
			status: 'pending',
			processingStatus: 'new',
			paymentStatus: paymentMethod === 'cash' ? 'unpaid' : 'unpaid',
			paymentMethod
		});

		// Get the created order
		const newOrder = await db.query.order.findFirst({
			where: eq(order.uuid, orderUuid)
		});

		if (!newOrder) {
			return json({ success: false, error: 'Failed to create order' }, { status: 500 });
		}

		// Create order items
		for (const item of items) {
			await db.insert(orderItem).values({
				orderId: newOrder.id,
				productId: item.productId,
				productName: item.productName,
				variantId: item.variantId || null,
				variantName: item.variantName || null,
				variantValue: item.variantValue || null,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				subtotal: item.unitPrice * item.quantity
			});
		}

		// Generate tracking URL - routing will be handled automatically
		const trackingUrl = `${url.origin}/order/${qrToken}/track/${orderUuid}`;

		// Prepare response data
		const responseData: any = {
			orderUuid,
			orderNumber,
			trackingUrl,
			paymentMethod
		};

		// If QRIS payment, create payment record
		if (paymentMethod === 'qris') {
			try {
				// Call QRIS create API - no need to include /pos/${slug} as we're already in that route
				const qrisResponse = await fetch(`${url.origin}/api/qris/create`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						orderId: newOrder.id,
						amount: subtotal,
						orderNumber: orderNumber,
						merchantId: merchantData.id
					})
				});

				const qrisResult = await qrisResponse.json();

				if (qrisResult.success) {
					const paymentRequestId = qrisResult.data.payment.paymentRequestId;
					responseData.paymentUrl = `${url.origin}/order/${qrToken}/payment/${paymentRequestId}`;
					responseData.paymentId = paymentRequestId;
					responseData.paymentRequired = true;
				} else {
					throw new Error(qrisResult.error || 'Failed to create QRIS payment');
				}
			} catch (error) {
				console.error('Error creating QRIS payment:', error);
				// Fallback to tracking if payment creation fails
				responseData.paymentUrl = trackingUrl;
				responseData.paymentRequired = false;
				responseData.paymentError = 'Failed to generate QR code. You can pay at cashier.';
			}
		}

		// Send WhatsApp notification if phone provided
		if (customerPhone) {
			try {
				await fetch(`${url.origin}/api/whatsapp`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						phoneNumber: customerPhone,
						orderNumber,
						merchantName: merchantData.name,
						trackingUrl,
						orderStatus: 'new',
						paymentMethod
					})
				});
			} catch (error) {
				console.error('Failed to send WhatsApp notification:', error);
			}
		}

		return json({
			success: true,
			data: responseData
		});
	} catch (error) {
		console.error('Error placing order:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
