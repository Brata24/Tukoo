import { db } from '$lib/server/db';
import { payment, order } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();

    // Pak Kasir webhook payload structure
    // Expected: { order_id, status, amount, payment_method, ... }
    const orderId = body.order_id;
    const newStatus = body.status; // 'pending' or 'completed'

    if (!orderId) {
      console.warn('Invalid Pak Kasir webhook payload:', body);
      return new Response(null, { status: 200 });
    }

    // Status mapping from Pak Kasir to our system
    const statusMapping: Record<string, string> = {
      'pending': 'pending',
      'completed': 'completed',
      'failed': 'failed',
      'expired': 'expired',
      'cancelled': 'cancelled'
    };

    const normalizedStatus = statusMapping[newStatus?.toLowerCase()] || newStatus || 'pending';

    // Update payment record
    const updateData: any = {
      status: normalizedStatus,
      rawResponse: JSON.stringify(body),
      updatedAt: new Date()
    };

    if (normalizedStatus === 'completed') {
      updateData.paidAt = new Date();
    }

    await db.update(payment)
      .set(updateData)
      .where(eq(payment.paymentRequestId, orderId))
      .catch((err) => {
        console.error('DB update error:', err);
      });

    // Get payment record to update related order
    const paymentRecord = await db.query.payment.findFirst({
      where: eq(payment.paymentRequestId, orderId)
    }).catch(() => null);

    if (paymentRecord?.orderId) {
      if (normalizedStatus === 'completed') {
        // Payment successful - mark order as paid
        await db.update(order)
          .set({
            status: 'paid',
            paymentStatus: 'paid',
            processingStatus: 'preparing',
            updatedAt: new Date()
          })
          .where(eq(order.id, paymentRecord.orderId))
          .catch((err) => {
            console.error('Order update error:', err);
          });
      } else if (['cancelled', 'expired', 'failed'].includes(normalizedStatus)) {
        // Payment failed - mark order as cancelled
        await db.update(order)
          .set({
            status: 'cancelled',
            paymentStatus: 'failed',
            updatedAt: new Date()
          })
          .where(eq(order.id, paymentRecord.orderId))
          .catch((err) => {
            console.error('Order update error:', err);
          });
      }
    }

    console.log(`[Pak Kasir Webhook] Payment ${orderId} status updated to ${normalizedStatus}`);
    return new Response(null, { status: 200 });
  } catch (e) {
    console.error('Pak Kasir webhook error', e);
    return new Response(null, { status: 500 });
  }
};
