import { db } from '$lib/server/db';
import { category, restaurantTable, merchant, order, orderItem, payment, cartItem } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, params, fetch }) => {
	try {
		const slug = params.slug;
		const body = await request.json();
		
		const { cart: cartData, diningOption, tableId, paymentMethod, notes, tax, tip, customerName, customerPhone } = body;

		// Validation
		if (!cartData || !diningOption || !paymentMethod) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (!customerName || !customerName.trim()) {
			return json({ error: 'Customer name is required' }, { status: 400 });
		}

		if (!cartData || cartData.length === 0) {
			return json({ error: 'Cart is empty' }, { status: 400 });
		}

		// Get merchant
		const merchantData = await db.select().from(merchant).where(eq(merchant.slug, slug)).limit(1);
		if (!merchantData.length) {
			return json({ error: 'Merchant not found' }, { status: 404 });
		}
		const merchantId = merchantData[0].id;

		const subtotal = cartData.reduce((sum: number, item: any) => sum + item.subtotal, 0);
		const taxAmount = tax || 0;
		const tipAmount = tip || 0;
		const total = subtotal + taxAmount + tipAmount;

		// Generate order number for POS/Kasir
		// Format: POS-{merchantId}-{sequence} (POS = Point of Sale/Kasir)
		const timestamp = Date.now();
		const sequence = String(timestamp).slice(-8); // Last 8 digits
		const orderNumber = `POS-${merchantId}-${sequence}`;

		const [newOrder] = await db.insert(order).values({
			orderNumber,
			merchantId,
			userPosId: locals.userPos?.id || null,
			tableId: tableId && diningOption === 'dinein' ? parseInt(tableId) : null,
			diningOption,
			customerName: customerName.trim(),
			customerPhone: customerPhone?.trim() || null,
			subtotal,
			tax: taxAmount,
			tip: tipAmount,
			total,
			paymentMethod,
			paymentStatus: paymentMethod === 'cash' ? 'paid' : 'unpaid',
			status: paymentMethod === 'cash' ? 'paid' : 'pending',
			notes: notes || null,
		}).$returningId();

		// Create order items
		for (const item of cartData) {
			await db.insert(orderItem).values({
				orderId: newOrder.id,
				productId: item.productId,
				productName: item.productName,
				variantId: item.variantId || null,
				variantName: item.variantName || null,
				variantValue: item.variantValue || null,
				quantity: item.qty,
				unitPrice: item.unitPrice,
				subtotal: item.subtotal,
			});
		}

		// Handle payment methods
		if (paymentMethod === 'cash') {
			await db.insert(payment).values({
				orderId: newOrder.id,
				paymentMethod: 'cash',
				amount: total,
				status: 'SUCCEEDED',
				paidAt: new Date(),
			});

			await db.update(order).set({ status: 'paid', paymentStatus: 'paid' }).where(eq(order.id, newOrder.id));

			return json({
				orderId: newOrder.id,
				orderNumber,
				paymentMethod: 'cash'
			});
		} else if (paymentMethod === 'qris') {
			try {
				const res = await fetch(`/api/qris/create`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						orderId: newOrder.id,
						orderNumber: orderNumber
					})
				});
				
				const createQrisResponse = await res.json();

				if (!res.ok) {
					throw new Error(createQrisResponse.error || `API error: ${res.status}`);
				}

				const qrisData = createQrisResponse.data || createQrisResponse;

				if (!qrisData?.payment_request_id) {
					throw new Error('No payment_request_id in response');
				}
				
				
				const qrValue = qrisData.qrString || null;
				
				return json({
					orderId: newOrder.id,
					orderNumber: orderNumber,
					paymentMethod: 'qris',
					payment_request_id: qrisData.payment_request_id,
					qrString: qrValue,
					expires_at: qrisData.expires_at || null,
					status: qrisData.status || 'REQUIRES_ACTION'
				});
			} catch (e) {
				console.error('QRIS payment creation failed:', e);
				return json({ error: 'Failed to create QRIS payment', details: String(e) }, { status: 500 });
			}
		}

		return json({ error: 'Invalid payment method' }, { status: 400 });
	} catch (e) {
		console.error('Order creation error:', e);
		return json({ error: 'Failed to create order', details: String(e) }, { status: 500 });
	}
};
