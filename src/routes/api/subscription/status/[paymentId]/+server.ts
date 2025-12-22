import { db } from '$lib/server/db';
import { subscriptionPayment } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { PAKASIR_API_KEY_SUBSCRIPTION } from '$env/static/private';
import { activateSubscription } from '$lib/server/subscription';

export const GET = async ({ params, locals, url }) => {
	try {
		const user = locals.user;
		if (!user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
		}

		const { paymentId } = params;
		const forceCheck = url.searchParams.get('forceCheck') === 'true';

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

		// If not forcing check, return database status (updated by webhook)
		if (!forceCheck) {
			console.log(`[Subscription Status] Using database status (webhook): ${payment.status}`);
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

		// Only check with Pakasir API when forceCheck is true (button clicked)
		try {
			console.log(`[Subscription Status] Calling Pakasir API for ${paymentId} (forceCheck: ${forceCheck})`);
			
			const pakasirResponse = await fetch(
				`https://app.pakasir.com/api/transactiondetail?project=Tukoo&amount=${payment.amount}&order_id=${paymentId}&api_key=${PAKASIR_API_KEY_SUBSCRIPTION}`
			);

			const pakasirData = await pakasirResponse.json();
			console.log(`[Subscription Status] Pakasir API response:`, JSON.stringify(pakasirData));

			if (pakasirResponse.ok && pakasirData.transaction) {
				const transactionStatus = pakasirData.transaction?.status;
				
				// Status mapping like QRIS system
				const statusMapping: Record<string, string> = {
					'pending': 'pending',
					'completed': 'paid',
					'failed': 'failed',
					'expired': 'expired',
					'cancelled': 'cancelled'
				};

				const normalizedStatus = statusMapping[transactionStatus?.toLowerCase()] || transactionStatus || 'pending';
				console.log(`[Subscription Status] API returned status: ${transactionStatus} -> normalized: ${normalizedStatus}`);

				// Update payment status in database if changed
				if (normalizedStatus !== payment.status) {
					console.log(`[Subscription Status] Status changed from ${payment.status} to ${normalizedStatus}, updating database`);
					
					const updateData: any = {
						status: normalizedStatus,
						rawResponse: JSON.stringify(pakasirData),
						updatedAt: new Date()
					};

					if (normalizedStatus === 'paid') {
						updateData.paidAt = new Date();
					}

					await db
						.update(subscriptionPayment)
						.set(updateData)
						.where(eq(subscriptionPayment.paymentRequestId, paymentId));
					
					console.log(`[Subscription Status] Database updated successfully`);

					// Activate subscription if payment is completed
					if (normalizedStatus === 'paid') {
						try {
							await activateSubscription(payment.userId, payment.planId);
							console.log(`[Subscription Status] Subscription activated for user ${payment.userId}`);
						} catch (activationError) {
							console.error('[Subscription Status] Failed to activate subscription:', activationError);
						}
					}
				} else {
					console.log(`[Subscription Status] Status unchanged: ${normalizedStatus}`);
				}

				return new Response(
					JSON.stringify({
						success: true,
						data: {
							status: normalizedStatus,
							paymentRequestId: paymentId,
							amount: payment.amount
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
