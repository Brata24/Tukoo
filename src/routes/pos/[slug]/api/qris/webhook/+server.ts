import { db } from '$lib/server/db';
import { payment, order } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();

    // Xendit payment_requests webhook payload
    const event = body.event;
    const paymentData = body.data;

    if (!paymentData || !paymentData.payment_request_id) {
      console.warn('Invalid webhook payload:', body);
      return new Response(null, { status: 200 });
    }

    const paymentRequestId = paymentData.payment_request_id;
    const newStatus = paymentData.status; // REQUIRES_ACTION, SUCCEEDED, FAILED, CANCELED, EXPIRED

    // Update payment record
    const updateData: any = {
      status: newStatus,
      rawResponse: JSON.stringify(body),
      updatedAt: new Date()
    };

   
    if (newStatus === 'SUCCEEDED') {
      updateData.paidAt = new Date();
    }

    await db.update(payment)
      .set(updateData)
      .where(eq(payment.paymentRequestId, paymentRequestId))
      .catch((err) => {
        console.error('DB update error:', err);
      });

   
    const paymentRecord = await db.query.payment.findFirst({
      where: eq(payment.paymentRequestId, paymentRequestId)
    }).catch(() => null);

    if (paymentRecord?.orderId) {
    
      if (newStatus === 'SUCCEEDED') {
       
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
      } else if (['CANCELED', 'EXPIRED', 'FAILED'].includes(newStatus)) {
       
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

    console.log(`[Webhook] Payment ${paymentRequestId} status updated to ${newStatus}`);
    return new Response(null, { status: 200 });
  } catch (e) {
    console.error('QRIS webhook error', e);
    return new Response(null, { status: 500 });
  }
};
