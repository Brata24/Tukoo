import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { order } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH({ params, request, locals }: any) {
	const orderId = parseInt(params.id);
	const { field, value } = await request.json();

	// Validate field name
	const allowedFields = ['status', 'paymentStatus', 'processingStatus'];
	if (!allowedFields.includes(field)) {
		return json({ error: 'Invalid field' }, { status: 400 });
	}

	// Validate merchant access
	const merchantId = locals.userPos?.merchantId;
	if (!merchantId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Check if order belongs to this merchant
		const existingOrder = await db
			.select()
			.from(order)
			.where(eq(order.id, orderId))
			.limit(1);

		if (!existingOrder.length || existingOrder[0].merchantId !== merchantId) {
			return json({ error: 'Order not found' }, { status: 404 });
		}

		// Update the order
		await db
			.update(order)
			.set({ [field]: value })
			.where(eq(order.id, orderId));

		return json({ success: true });
	} catch (error) {
		console.error('Update order status error:', error);
		return json({ error: 'Failed to update order status' }, { status: 500 });
	}
}
