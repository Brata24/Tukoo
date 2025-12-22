import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { subscriptionPayment } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function load({ params, locals }) {
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	const { paymentId } = params;

	// Get payment details
	const payment = await db.query.subscriptionPayment.findFirst({
		where: eq(subscriptionPayment.paymentRequestId, paymentId),
		with: {
			plan: true
		}
	});

	if (!payment) {
		throw redirect(302, '/dashboard/subscription');
	}

	// Check if payment belongs to user
	if (payment.userId !== locals.user.id) {
		throw redirect(302, '/dashboard/subscription');
	}

	return {
		payment: {
			id: payment.id,
			paymentRequestId: payment.paymentRequestId,
			amount: payment.amount,
			status: payment.status,
			paymentMethod: payment.paymentMethod,
			qrString: payment.qrString,
			expiresAt: payment.expiresAt?.toISOString(),
			createdAt: payment.createdAt.toISOString()
		},
		plan: {
			name: payment.plan.name,
			duration: payment.plan.duration,
			maxStores: payment.plan.maxStores
		}
	};
}
