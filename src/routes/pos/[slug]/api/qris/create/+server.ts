import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { payment, order } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { XENDIT_PRIVATE_KEY } from '$env/static/private';

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

    if (!XENDIT_PRIVATE_KEY) {
      console.error('XENDIT_PRIVATE_KEY not configured');
      return new Response(JSON.stringify({ error: 'Xendit key not configured' }), { status: 500 });
    }

    const payload = {
      reference_id: finalOrderNumber,
      type: 'PAY',
      country: 'ID',
      currency: 'IDR',
      request_amount: amount, // Use amount directly
      channel_code: 'QRIS'
    };

    const res = await fetch('https://api.xendit.co/v3/payment_requests', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(XENDIT_PRIVATE_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'api-version': '2024-11-11'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Xendit API error:', data);
      return new Response(JSON.stringify({ error: 'Xendit API error', details: data }), { status: 400 });
    }

    // Extract QR string from actions array
    let qrString = null;
    if (data.actions && Array.isArray(data.actions)) {
      const qrAction = data.actions.find((a: any) => 
        a.descriptor === 'QR_STRING' && a.value
      );
      qrString = qrAction?.value || null;
      console.log('QR Action found:', qrAction);
      console.log('QR String extracted:', qrString);
    }
    
    // Fallback to direct qrString property if exists
    if (!qrString && data.qrString) {
      qrString = data.qrString;
      console.log('Using fallback qrString:', qrString);
    }

    if (!qrString) {
      console.error('No QR string found in response. Actions:', JSON.stringify(data.actions));
    }

    // Store payment with new Xendit v3 fields
    await db.insert(payment).values({
      orderId: finalOrderId,
      paymentMethod: 'qris',
      amount: amount,
      status: data.status || 'PENDING',
      paymentRequestId: data.payment_request_id,
      referenceId: data.reference_id,
      channelCode: data.channel_code,
      qrString: qrString,
      expiresAt: data.channel_properties?.expires_at 
        ? new Date(data.channel_properties.expires_at) 
        : (data.expires_at ? new Date(data.expires_at) : null),
      rawResponse: JSON.stringify(data)
    });

    // Get the created payment record with uuid using unique paymentRequestId
    const createdPayment = await db.query.payment.findFirst({
      where: eq(payment.paymentRequestId, data.payment_request_id),
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
            paymentRequestId: data.payment_request_id,
            status: data.status,
            expiresAt: data.channel_properties?.expires_at || data.expires_at || null,
            qrString: qrString
          },
          payment_request_id: data.payment_request_id,
          status: data.status,
          expires_at: data.channel_properties?.expires_at || data.expires_at || null,
          actions: data.actions,
          qrString: qrString // Include QR string in response for client
        }
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error('QRIS create error', e);
    return new Response(JSON.stringify({ error: 'Internal error', message: String(e) }), { status: 500 });
  }
};
