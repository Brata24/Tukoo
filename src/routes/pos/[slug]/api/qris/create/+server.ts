import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { payment, order } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { PAKASIR_API_KEY, PAKASIR_PROJECT } from '$env/static/private';

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const body = await request.json();
    const { orderId, orderNumber } = body;

    if (!orderId && !orderNumber) {
      return new Response(JSON.stringify({ error: 'Missing orderId or orderNumber' }), { status: 400 });
    }

    // Get order from database to fetch amount
    const orderData = await db
      .select()
      .from(order)
      .where(orderNumber ? eq(order.orderNumber, orderNumber) : eq(order.id, orderId))
      .limit(1);

    if (!orderData.length) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    const orderRecord = orderData[0];
    const amount = orderRecord.total; // Get amount from database
    const finalOrderId = orderRecord.id;
    const finalOrderNumber = orderRecord.orderNumber;

    if (!PAKASIR_API_KEY || !PAKASIR_PROJECT) {
      console.error('PAKASIR_API_KEY or PAKASIR_PROJECT not configured');
      return new Response(JSON.stringify({ error: 'Pak Kasir not configured' }), { status: 500 });
    }

    // Create payment with Pak Kasir using POST method
    const res = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project: PAKASIR_PROJECT,
        order_id: finalOrderNumber,
        amount: amount,
        api_key: PAKASIR_API_KEY
      })
    });

    const data = await res.json();

    if (!res.ok || !data.payment) {
      console.error('Pak Kasir API error:', data);
      return new Response(JSON.stringify({ error: 'Pak Kasir API error', details: data }), { status: 400 });
    }

    // Extract payment data from Pak Kasir response
    const paymentData = data.payment;
    const paymentNumber = paymentData.payment_number; // This is the QRIS string
    const expiresAt = paymentData.expired_at ? new Date(paymentData.expired_at) : null;

    // Store payment with Pak Kasir fields
    await db.insert(payment).values({
      orderId: finalOrderId,
      paymentMethod: 'qris',
      amount: paymentData.received || amount,
      status: 'pending', // Pak Kasir uses 'pending' or 'completed'
      paymentRequestId: finalOrderNumber, // Use order_id as payment identifier
      referenceId: finalOrderNumber,
      channelCode: paymentData.payment_method || 'QRIS',
      paymentNumber: paymentNumber, // Store payment_number field (QR string)
      qrString: paymentNumber, // Also keep qrString for backward compatibility
      expiresAt: expiresAt,
      rawResponse: JSON.stringify(data)
    });

    // Get the created payment record with uuid
    const createdPayment = await db.query.payment.findFirst({
      where: eq(payment.paymentRequestId, finalOrderNumber),
      orderBy: (payment, { desc }) => [desc(payment.id)]
    });

    if (!createdPayment) {
      console.error('Failed to retrieve created payment record');
      return new Response(JSON.stringify({ error: 'Failed to create payment record' }), { status: 500 });
    }

    console.log('Created payment with UUID:', createdPayment.uuid);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          payment: {
            id: createdPayment.id,
            uuid: createdPayment.uuid,
            paymentRequestId: finalOrderNumber,
            status: 'pending',
            expiresAt: expiresAt?.toISOString() || null,
            paymentNumber: paymentNumber, // QR string for rendering
            qrString: paymentNumber // Keep for backward compatibility
          },
          payment_request_id: finalOrderNumber,
          status: 'pending',
          expires_at: expiresAt?.toISOString() || null,
          paymentNumber: paymentNumber, // QR string for rendering
          qrString: paymentNumber // Include QR string in response for client
        }
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error('QRIS create error', e);
    return new Response(JSON.stringify({ error: 'Internal error', message: String(e) }), { status: 500 });
  }
};
