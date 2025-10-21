import { db } from '$lib/server/db';
import { payment, order, merchant } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { XENDIT_PRIVATE_KEY } from '$env/static/private';
import { dev } from '$app/environment';

export const GET = async ({ params }) => {
  try {
    const id = params.id; // payment_request_id from Xendit

    // Get payment record from database by paymentRequestId
    const paymentRecord = await db.query.payment.findFirst({
      where: eq(payment.paymentRequestId, id)
    });

    if (!paymentRecord) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), { status: 404 });
    }

    // PRODUCTION MODE: Use database status (updated by webhook)
    // In production, webhook will update the payment status in real-time
    if (!dev) {
      // Get order and merchant data
      const orderData = await db.query.order.findFirst({
        where: eq(order.id, paymentRecord.orderId)
      });

      const merchantData = orderData ? await db.query.merchant.findFirst({
        where: eq(merchant.id, orderData.merchantId)
      }) : null;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            // Backwards compatibility with sales system (old format)
            payment_request_id: paymentRecord.paymentRequestId,
            status: paymentRecord.status,
            expires_at: paymentRecord.expiresAt?.toISOString() || null,
            qrString: paymentRecord.qrString,
            // New format for self-order
            payment: {
              paymentRequestId: paymentRecord.paymentRequestId,
              status: paymentRecord.status,
              expiresAt: paymentRecord.expiresAt?.toISOString() || null,
              qrString: paymentRecord.qrString,
              amount: paymentRecord.amount
            },
            order: orderData ? {
              id: orderData.id,
              uuid: orderData.uuid,
              orderNumber: orderData.orderNumber,
              total: orderData.total
            } : null,
            merchant: merchantData ? {
              name: merchantData.name,
              logo: merchantData.logo,
              primaryColor: merchantData.primaryColor,
              primaryTextColor: merchantData.primaryTextColor,
              secondaryColor: merchantData.secondaryColor,
              secondaryTextColor: merchantData.secondaryTextColor
            } : null
          }
        }),
        { status: 200 }
      );
    }

    // DEVELOPMENT MODE: Poll Xendit API directly
    const XENDIT_KEY = XENDIT_PRIVATE_KEY;
    if (!XENDIT_KEY) return new Response(JSON.stringify({ error: 'Xendit key missing' }), { status: 500 });

    const res = await fetch(`https://api.xendit.co/v3/payment_requests/${paymentRecord.paymentRequestId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(XENDIT_KEY + ':').toString('base64')}`,
         'api-version': '2024-11-11'
      }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Xendit API error:', data);
      return new Response(JSON.stringify({ error: 'Xendit API error', details: data }), { status: 400 });
    }

    // Extract QR string from actions array (using descriptor field)
    let qrString = null;
    if (data.actions && Array.isArray(data.actions)) {
      const qrAction = data.actions.find((a: any) => 
        a.descriptor === 'QR_STRING' && a.value
      );
      qrString = qrAction?.value || null;
    }

    // Update payment record with new status and data from Xendit
    const updateData: any = {
      status: data.status,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      rawResponse: JSON.stringify(data),
      updatedAt: new Date()
    };

    // Only update qrString if we have a value OR if status is final (SUCCEEDED/CANCELED/EXPIRED/FAILED)
    if (qrString || ['SUCCEEDED', 'CANCELED', 'EXPIRED', 'FAILED'].includes(data.status)) {
      updateData.qrString = qrString;
    }

    if (data.status === 'SUCCEEDED') {
      updateData.paidAt = new Date();
    }

    await db.update(payment)
      .set(updateData)
      .where(eq(payment.paymentRequestId, data.payment_request_id))
      .catch((err) => {
        console.error('DB update error:', err);
      });

    // Update order status when payment succeeds (for development mode)
    if (data.status === 'SUCCEEDED') {
      // Find the payment record to get orderId
      const paymentRecord = await db.query.payment.findFirst({
        where: eq(payment.paymentRequestId, data.payment_request_id)
      }).catch(() => null);

      if (paymentRecord?.orderId) {
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
      }
    } else if (['CANCELED', 'EXPIRED', 'FAILED'].includes(data.status)) {
     
      const paymentRecord = await db.query.payment.findFirst({
        where: eq(payment.paymentRequestId, data.payment_request_id)
      }).catch(() => null);

      if (paymentRecord?.orderId) {
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

    // Get merchant and order data
    const orderData = await db.query.order.findFirst({
      where: eq(order.id, paymentRecord.orderId)
    });

    const merchantData = orderData ? await db.query.merchant.findFirst({
      where: eq(merchant.id, orderData.merchantId)
    }) : null;

    // Get expiration from Xendit response (v3 API uses channel_properties.expires_at)
    const expiresAt = data.channel_properties?.expires_at || data.expires_at || null;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          // Backwards compatibility with sales system (old format)
          payment_request_id: data.payment_request_id,
          status: data.status,
          expires_at: expiresAt,
          actions: data.actions,
          qrString: qrString,
          // New format for self-order
          payment: {
            paymentRequestId: data.payment_request_id,
            status: data.status,
            expiresAt: expiresAt,
            qrString: qrString,
            amount: paymentRecord.amount
          },
          order: orderData ? {
            id: orderData.id,
            uuid: orderData.uuid,
            orderNumber: orderData.orderNumber,
            total: orderData.total
          } : null,
          merchant: merchantData ? {
            name: merchantData.name,
            logo: merchantData.logo,
            primaryColor: merchantData.primaryColor,
            primaryTextColor: merchantData.primaryTextColor,
            secondaryColor: merchantData.secondaryColor,
            secondaryTextColor: merchantData.secondaryTextColor
          } : null
        }
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error('QRIS fetch error', e);
    return new Response(JSON.stringify({ error: 'Internal error', message: String(e) }), { status: 500 });
  }
};
