import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { payment, order } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { orderId, amount } = body;

    if (!orderId || !amount) {
      return new Response(JSON.stringify({ error: 'Missing orderId or amount' }), { status: 400 });
    }

    // Create cash payment record
    const paymentRecord = await db.insert(payment).values({
      orderId,
      paymentMethod: 'cash',
      amount,
      status: 'PENDING', // Will be marked as SUCCEEDED when cashier confirms
      // All Xendit fields remain null for cash
    });

    // Update order payment status
    await db.update(order)
      .set({
        paymentMethod: 'cash',
        paymentStatus: 'unpaid',
        updatedAt: new Date()
      })
      .where(eq(order.id, orderId));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          payment_id: paymentRecord,
          paymentMethod: 'cash',
          status: 'PENDING'
        }
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error('Cash payment create error', e);
    return new Response(JSON.stringify({ error: 'Internal error', message: String(e) }), { status: 500 });
  }
};
