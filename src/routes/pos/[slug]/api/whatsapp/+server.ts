import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * Dummy WhatsApp notification function
 * In production, integrate with WhatsApp Business API or services like:
 * - Twilio WhatsApp API
 * - Meta WhatsApp Business Platform
 * - Fonnte (Indonesia)
 * - Wablas (Indonesia)
 */
async function sendWhatsAppNotification(
	phoneNumber: string,
	message: string,
	trackingUrl?: string
): Promise<{ success: boolean; message: string }> {
	const normalizedPhone = phoneNumber.replace(/[^\d]/g, "");

	console.log("=== WhatsApp Notification ===");
	console.log("To:", normalizedPhone);
	console.log("Message:", message);
	if (trackingUrl) {
		console.log("Tracking URL:", trackingUrl);
	}
	console.log("Timestamp:", new Date().toISOString());
	console.log("=============================\n");

	await new Promise((resolve) => setTimeout(resolve, 500));

	const success = Math.random() > 0.1;

	if (success) {
		return {
			success: true,
			message: "WhatsApp notification sent successfully",
		};
	} else {
		return {
			success: false,
			message: "Failed to send WhatsApp notification",
		};
	}
}

/**
 * POST /api/notifications/whatsapp
 * Send WhatsApp notification for order tracking
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { phoneNumber, orderNumber, merchantName, trackingUrl, orderStatus } = body;

		// Validate required fields
		if (!phoneNumber) {
			return json({ success: false, error: "Phone number is required" }, { status: 400 });
		}

		if (!orderNumber) {
			return json({ success: false, error: "Order number is required" }, { status: 400 });
		}

		// Build message based on order status
		let message = "";

		switch (orderStatus) {
			case "new":
				message = `Hi! Your order ${orderNumber} at ${merchantName} has been received. Track your order: ${trackingUrl}`;
				break;
			case "preparing":
				message = `Your order ${orderNumber} is now being prepared. Track your order: ${trackingUrl}`;
				break;
			case "ready":
				message = `Good news! Your order ${orderNumber} is ready. Track your order: ${trackingUrl}`;
				break;
			case "served":
				message = `Your order ${orderNumber} has been served. Enjoy your meal! Track your order: ${trackingUrl}`;
				break;
			default:
				message = `Order ${orderNumber} update at ${merchantName}. Track your order: ${trackingUrl}`;
		}

		const result = await sendWhatsAppNotification(phoneNumber, message, trackingUrl);

		if (result.success) {
			return json({
				success: true,
				message: result.message,
				data: {
					phoneNumber,
					orderNumber,
					trackingUrl,
				},
			});
		} else {
			return json(
				{
					success: false,
					error: result.message,
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error sending WhatsApp notification:", error);
		return json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
};
