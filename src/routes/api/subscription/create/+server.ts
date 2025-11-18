import { db } from '$lib/server/db';
import { subscriptionPayment, subscriptionPlan } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { PAKASIR_API_KEY_SUBSCRIPTION, PAKASIR_PROJECT_SUBSCRIPTION } from '$env/static/private';

export const POST = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
		}

		const { planId } = await request.json();

		// Get plan details
		const plan = await db.query.subscriptionPlan.findFirst({
			where: eq(subscriptionPlan.id, planId)
		});

		if (!plan) {
			return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
		}

		// Free plan doesn't need payment
		if (plan.price === 0) {
			return new Response(
				JSON.stringify({
					success: true,
					message: 'Free plan activated',
					requiresPayment: false
				}),
				{ status: 200 }
			);
		}

		// Generate unique order ID
		const orderId = `SUB-${user.id}-${Date.now()}`;

		// Create payment via Pakasir
		const pakasirResponse = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				project: PAKASIR_PROJECT_SUBSCRIPTION || 'Tukoo',
				order_id: orderId,
				amount: plan.price,
				api_key: PAKASIR_API_KEY_SUBSCRIPTION
			})
		});

		const pakasirData = await pakasirResponse.json();

		// Check if response has payment object
		if (!pakasirResponse.ok || !pakasirData.payment || !pakasirData.payment.payment_number) {
			console.error('Pakasir API error:', pakasirData);
			return new Response(
				JSON.stringify({ error: 'Failed to create payment', details: pakasirData }),
				{ status: 400 }
			);
		}

		const paymentData = pakasirData.payment;

		// Use expired_at from Pakasir or calculate 24 hours from now
		const expiresAt = paymentData.expired_at 
			? new Date(paymentData.expired_at)
			: new Date(Date.now() + 24 * 60 * 60 * 1000);

		// Save payment record
		const [paymentRecord] = await db
			.insert(subscriptionPayment)
			.values({
				userId: user.id,
				planId: plan.id,
				amount: plan.price,
				status: 'pending',
				paymentMethod: 'qris',
				paymentRequestId: orderId,
				paymentNumber: paymentData.payment_number,
				qrString: paymentData.payment_number,
				expiresAt: expiresAt,
				rawResponse: JSON.stringify(pakasirData)
			})
			.$returningId();

		console.log(`Created subscription payment: ${orderId}`);

		return new Response(
			JSON.stringify({
				success: true,
				data: {
					paymentId: orderId,
					qrString: paymentData.payment_number,
					amount: paymentData.received,
					totalPayment: paymentData.total_payment,
					fee: paymentData.fee,
					expiresAt: expiresAt.toISOString(),
					plan: {
						name: plan.name,
						duration: plan.duration,
						maxStores: plan.maxStores
					}
				}
			}),
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error creating subscription:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to create subscription', message: String(error) }),
			{ status: 500 }
		);
	}
};
