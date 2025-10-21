import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { order, payment } from '$lib/server/db/schema';
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
		// First verify order belongs to merchant
		const orderData = await db
			.select()
			.from(order)
			.where(and(eq(order.id, orderId), eq(order.merchantId, merchantId)))
			.limit(1);

		if (!orderData || orderData.length === 0) {
			return json({ success: false, error: 'Order not found' }, { status: 404 });
		}

		// Get payment info for this order
		const paymentData = await db
			.select()
			.from(payment)
			.where(eq(payment.orderId, orderId))
			.limit(1);

		if (!paymentData || paymentData.length === 0) {
			return json({ success: false, error: 'Payment not found' }, { status: 404 });
		}

		console.log('Payment data fetched:', {
			id: paymentData[0].id,
			orderId: paymentData[0].orderId,
			qrString: paymentData[0].qrString ? 'EXISTS' : 'NULL',
			qrStringLength: paymentData[0].qrString?.length || 0,
			status: paymentData[0].status
		});

		return json({
			success: true,
			payment: paymentData[0]
		});
	} catch (error) {
		console.error('Fetch payment error:', error);
		return json({ success: false, error: 'Failed to fetch payment' }, { status: 500 });
	}
};
