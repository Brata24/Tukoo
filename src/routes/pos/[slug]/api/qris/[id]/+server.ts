import { db } from '$lib/server/db';
import { payment, order, merchant } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { PAKASIR_API_KEY, PAKASIR_PROJECT } from '$env/static/private';
import { dev } from '$app/environment';

const FINAL_STATUSES = ['completed', 'failed', 'expired', 'cancelled'];

export const GET = async ({ params, url }) => {
  try {
    const id = params.id; // order_id (payment_request_id)
    const forceCheck = url.searchParams.get('forceCheck') === 'true'; // Manual button click forces API call

    // Get payment record from database by paymentRequestId
    const paymentRecord = await db.query.payment.findFirst({
      where: eq(payment.paymentRequestId, id)
    });

    if (!paymentRecord) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), { status: 404 });
    }

    let orderData = paymentRecord.orderId
      ? await db.query.order.findFirst({
          where: eq(order.id, paymentRecord.orderId)
        })
      : null;

    let merchantData = orderData
      ? await db.query.merchant.findFirst({
          where: eq(merchant.id, orderData.merchantId)
        })
      : null;

    const isFinalStatus = paymentRecord.status
      ? FINAL_STATUSES.includes(paymentRecord.status.toLowerCase())
      : false;

    console.log(`[QRIS Status Check] ID: ${id}, forceCheck: ${forceCheck}, status: ${paymentRecord.status}`);

    // Only call Pakasir API when button is clicked (forceCheck=true)
    // Otherwise, use database data (updated by webhook)
    if (!forceCheck) {
      console.log(`[QRIS] Using database/webhook data for ${id}`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            // Backwards compatibility with sales system (old format)
            payment_request_id: paymentRecord.paymentRequestId,
            status: paymentRecord.status,
            expires_at: paymentRecord.expiresAt?.toISOString() || null,
            paymentNumber: paymentRecord.paymentNumber || paymentRecord.qrString, // Use saved payment_number from DB
            qrString: paymentRecord.paymentNumber || paymentRecord.qrString,
            // New format for self-order
            payment: {
              paymentRequestId: paymentRecord.paymentRequestId,
              status: paymentRecord.status,
              expiresAt: paymentRecord.expiresAt?.toISOString() || null,
              paymentNumber: paymentRecord.paymentNumber || paymentRecord.qrString, // Use saved payment_number from DB
              qrString: paymentRecord.paymentNumber || paymentRecord.qrString,
              amount: paymentRecord.amount
            },
            order: orderData
              ? {
                  id: orderData.id,
                  uuid: orderData.uuid,
                  orderNumber: orderData.orderNumber,
                  total: orderData.total
                }
              : null,
            merchant: merchantData
              ? {
                  name: merchantData.name,
                  logo: merchantData.logo,
                  primaryColor: merchantData.primaryColor,
                  primaryTextColor: merchantData.primaryTextColor,
                  secondaryColor: merchantData.secondaryColor,
                  secondaryTextColor: merchantData.secondaryTextColor
                }
              : null
          }
        }),
        { status: 200 }
      );
    }

    // Otherwise, poll Pak Kasir to ensure we have the latest status (dev mode or still pending)
    console.log(`[QRIS] Calling Pakasir API for ${id} (forceCheck: ${forceCheck})`);
    
    if (!PAKASIR_API_KEY || !PAKASIR_PROJECT)
      return new Response(JSON.stringify({ error: 'Pak Kasir not configured' }), { status: 500 });

    // Check status using Pak Kasir status endpoint
    console.log("cellaed")
    const res = await fetch(`https://app.pakasir.com/api/transactiondetail?project=${PAKASIR_PROJECT}&amount=${paymentRecord.amount}&order_id=${id}&api_key=${PAKASIR_API_KEY}`);

    const data = await res.json();
    console.log(`[QRIS] Pakasir API response:`, JSON.stringify(data));

    if (!res.ok) {
      console.error('Pak Kasir API error:', data);
      return new Response(JSON.stringify({ error: 'Pak Kasir API error', details: data }), { status: 400 });
    }

    // Pak Kasir returns status inside transaction object
    const transactionStatus = data.transaction?.status;
    
    // Pak Kasir returns status as 'pending' or 'completed'
    const statusMapping: Record<string, string> = {
      'pending': 'pending',
      'completed': 'completed',
      'failed': 'failed',
      'expired': 'expired',
      'cancelled': 'cancelled'
    };

    const normalizedStatus = statusMapping[transactionStatus?.toLowerCase()] || transactionStatus || 'pending';
    console.log(`[QRIS] API returned status: ${transactionStatus} -> normalized: ${normalizedStatus}`);

    // Update payment record with new status from Pak Kasir
    const updateData: any = {
      status: normalizedStatus,
      rawResponse: JSON.stringify(data),
      updatedAt: new Date()
    };

    if (normalizedStatus === 'completed') {
      updateData.paidAt = new Date();
    }

    await db
      .update(payment)
      .set(updateData)
      .where(eq(payment.paymentRequestId, id))
      .catch((err) => {
        console.error('DB update error:', err);
      });

    // Update order status when payment succeeds (for development mode or stale prod data)
    if (normalizedStatus === 'completed' && paymentRecord.orderId) {
      if (orderData) {
        const shouldUpdatePaymentStatus =
          orderData.status !== 'paid' || orderData.paymentStatus !== 'paid';
        const shouldBumpProcessing = orderData.processingStatus === 'new';

        if (shouldUpdatePaymentStatus || shouldBumpProcessing) {
          const nextProcessingStatus = shouldBumpProcessing
            ? 'preparing'
            : orderData.processingStatus;

          await db
            .update(order)
            .set({
              status: 'paid',
              paymentStatus: 'paid',
              processingStatus: nextProcessingStatus,
              updatedAt: new Date()
            })
            .where(eq(order.id, paymentRecord.orderId))
            .catch((err) => {
              console.error('Order update error:', err);
            });

          // reflect the latest values in memory for response payload
          orderData = {
            ...orderData,
            status: 'paid',
            paymentStatus: 'paid',
            processingStatus: nextProcessingStatus
          };
        }
      } else {
        await db
          .update(order)
          .set({
            status: 'paid',
            paymentStatus: 'paid',
            updatedAt: new Date()
          })
          .where(eq(order.id, paymentRecord.orderId))
          .catch((err) => {
            console.error('Order update error:', err);
          });
      }
    } else if (FINAL_STATUSES.includes(normalizedStatus) && normalizedStatus !== 'completed' && paymentRecord.orderId) {
      await db
        .update(order)
        .set({
          status: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date()
        })
        .where(eq(order.id, paymentRecord.orderId))
        .catch((err) => {
          console.error('Order update error:', err);
        });

      if (orderData) {
        orderData = {
          ...orderData,
          status: 'cancelled',
          paymentStatus: 'failed'
        };
      }
    }

    console.log(`[QRIS] Returning response with status: ${normalizedStatus}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          // Backwards compatibility with sales system (old format)
          payment_request_id: id,
          status: normalizedStatus,
          expires_at: paymentRecord.expiresAt?.toISOString() || null,
          paymentNumber: paymentRecord.paymentNumber || paymentRecord.qrString, // Use saved payment_number from DB
          qrString: paymentRecord.paymentNumber || paymentRecord.qrString, // Use saved payment_number from DB
          // New format for self-order
          payment: {
            paymentRequestId: id,
            status: normalizedStatus,
            expiresAt: paymentRecord.expiresAt?.toISOString() || null,
            paymentNumber: paymentRecord.paymentNumber || paymentRecord.qrString, // Use saved payment_number from DB
            qrString: paymentRecord.paymentNumber || paymentRecord.qrString, // Use saved payment_number from DB
            amount: paymentRecord.amount
          },
          order: orderData
            ? {
                id: orderData.id,
                uuid: orderData.uuid,
                orderNumber: orderData.orderNumber,
                total: orderData.total
              }
            : null,
          merchant: merchantData
            ? {
                name: merchantData.name,
                logo: merchantData.logo,
                primaryColor: merchantData.primaryColor,
                primaryTextColor: merchantData.primaryTextColor,
                secondaryColor: merchantData.secondaryColor,
                secondaryTextColor: merchantData.secondaryTextColor
              }
            : null
        }
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error('QRIS fetch error', e);
    return new Response(JSON.stringify({ error: 'Internal error', message: String(e) }), {
      status: 500
    });
  }
};
