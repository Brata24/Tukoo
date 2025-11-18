import { db } from '$lib/server/db';
import { subscriptionPayment } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { activateSubscription } from '$lib/server/subscription';
import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
	try {
		const webhookData = await request.json();
		
		console.log('[Subscription Webhook] Received:', JSON.stringify(webhookData));

		const { order_id, amount, status, project, payment_method, completed_at } = webhookData;

		// Validate webhook data
		if (!order_id || !amount || !status || project !== 'Tukoo') {
			console.error('[Subscription Webhook] Invalid data:', webhookData);
			return json({ error: 'Invalid webhook data' }, { status: 400 });
		}

		// Find payment record
		const payment = await db.query.subscriptionPayment.findFirst({
			where: eq(subscriptionPayment.paymentRequestId, order_id)
		});

		if (!payment) {
			console.error('[Subscription Webhook] Payment not found:', order_id);
			return json({ error: 'Payment not found' }, { status: 404 });
		}

		// Verify amount matches
		if (payment.amount !== amount) {
			console.error('[Subscription Webhook] Amount mismatch:', {
				expected: payment.amount,
				received: amount
			});
			return json({ error: 'Amount mismatch' }, { status: 400 });
		}

		// Map status
		const statusMapping: Record<string, string> = {
			'pending': 'pending',
			'completed': 'paid',
			'failed': 'failed',
			'expired': 'expired',
			'cancelled': 'cancelled'
		};

		const normalizedStatus = statusMapping[status?.toLowerCase()] || status || 'pending';
		console.log('[Subscription Webhook] Status mapping:', status, '->', normalizedStatus);

		// Update payment status
		const updateData: any = {
			status: normalizedStatus,
			rawResponse: JSON.stringify(webhookData),
			updatedAt: new Date()
		};

		if (normalizedStatus === 'paid') {
			updateData.paidAt = new Date();
		}

		await db
			.update(subscriptionPayment)
			.set(updateData)
			.where(eq(subscriptionPayment.paymentRequestId, order_id));

		console.log('[Subscription Webhook] Payment updated:', order_id, normalizedStatus);

		// Activate subscription if payment is completed
		if (normalizedStatus === 'paid') {
			try {
				await activateSubscription(payment.userId, payment.planId);
				console.log('[Subscription Webhook] Subscription activated for user:', payment.userId);
			} catch (error) {
				console.error('[Subscription Webhook] Failed to activate subscription:', error);
				// Don't return error, webhook was processed successfully
			}
		}

		return json({ success: true, message: 'Webhook processed' });
	} catch (error) {
		console.error('[Subscription Webhook] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
