import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { phoneNumber, orderNumber, merchantName, trackingUrl, orderStatus } = body;

		if (!phoneNumber) {
			return json({ success: false, error: 'Phone number is required' }, { status: 400 });
		}

		if (!orderNumber) {
			return json({ success: false, error: 'Order number is required' }, { status: 400 });
		}

		const normalizedPhone = phoneNumber.replace(/[^\d]/g, '');
		
		let message = '';
		switch (orderStatus) {
			case 'new':
				message = `Hi! Your order ${orderNumber} at ${merchantName} has been received. Track: ${trackingUrl}`;
				break;
			case 'preparing':
				message = `Your order ${orderNumber} is now being prepared. Track: ${trackingUrl}`;
				break;
			case 'ready':
				message = `Good news! Your order ${orderNumber} is ready. Track: ${trackingUrl}`;
				break;
			case 'served':
				message = `Your order ${orderNumber} has been served. Enjoy! Track: ${trackingUrl}`;
				break;
			default:
				message = `Order ${orderNumber} update at ${merchantName}. Track: ${trackingUrl}`;
		}

		console.log('=== WhatsApp Notification ===');
		console.log('To:', normalizedPhone);
		console.log('Message:', message);
		console.log('=============================\n');
		
		await new Promise((resolve) => setTimeout(resolve, 500));
		const success = Math.random() > 0.1;

		if (success) {
			return json({
				success: true,
				message: 'WhatsApp notification sent successfully',
				data: { phoneNumber, orderNumber, trackingUrl }
			});
		} else {
			return json({ success: false, error: 'Failed to send WhatsApp notification' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error sending WhatsApp notification:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
