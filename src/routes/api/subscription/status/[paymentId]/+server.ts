import { db } from '$lib/server/db';
import { subscriptionPayment } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { PAKASIR_API_KEY_SUBSCRIPTION } from '$env/static/private';

export const GET = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
		}

		const { paymentId } = params;

		// Get payment from database
		const payment = await db.query.subscriptionPayment.findFirst({
			where: eq(subscriptionPayment.paymentRequestId, paymentId)
		});

		if (!payment) {
			return new Response(JSON.stringify({ error: 'Payment not found' }), { status: 404 });
		}

		// Check if payment belongs to user
		if (payment.userId !== user.id) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
		}

		// If already paid, return current status
		if (payment.status === 'paid') {
			return new Response(
				JSON.stringify({
					success: true,
					data: {
						status: payment.status,
						paymentRequestId: payment.paymentRequestId,
						amount: payment.amount
					}
				}),
				{ status: 200 }
			);
		}

		// Check with Pakasir API
		try {
			const pakasirResponse = await fetch(
				`https://app.pakasir.com/api/transactionstatus/${paymentId}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						api_key: PAKASIR_API_KEY_SUBSCRIPTION
					})
				}
			);

			const pakasirData = await pakasirResponse.json();

			if (pakasirResponse.ok && pakasirData.payment) {
				const status = pakasirData.payment.status?.toLowerCase() || 'pending';

				// Update payment status in database if changed
				if (status !== payment.status) {
					await db
						.update(subscriptionPayment)
						.set({
							status: status,
							rawResponse: JSON.stringify(pakasirData)
						})
						.where(eq(subscriptionPayment.paymentRequestId, paymentId));
				}

				return new Response(
					JSON.stringify({
						success: true,
						data: {
							status: status,
							paymentRequestId: paymentId,
							amount: pakasirData.payment.amount || payment.amount
						}
					}),
					{ status: 200 }
				);
			}
		} catch (pakasirError) {
			console.error('Error checking Pakasir status:', pakasirError);
		}

		// Return current database status if Pakasir check fails
		return new Response(
			JSON.stringify({
				success: true,
				data: {
					status: payment.status,
					paymentRequestId: payment.paymentRequestId,
					amount: payment.amount
				}
			}),
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error checking payment status:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to check payment status', message: String(error) }),
			{ status: 500 }
		);
	}
};
