import { json } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth-handler/session.js';
import { deleteMerchant, permanentlyDeleteMerchant, getMerchantById } from '$lib/server/merchant.js';
import type { RequestHandler } from './$types.js';

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	try {
		// Check authentication
		const sessionToken = cookies.get('session');
		if (!sessionToken) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { session, user } = await validateSessionToken(sessionToken);
		if (!session || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get merchant ID from URL parameters
		const merchantId = params.id;
		if (!merchantId) {
			return json({ error: 'Merchant ID is required' }, { status: 400 });
		}

		const merchantIdNum = parseInt(merchantId);
		if (isNaN(merchantIdNum)) {
			return json({ error: 'Invalid merchant ID' }, { status: 400 });
		}

		// Check if merchant exists and belongs to user
		const merchant = await getMerchantById(merchantIdNum);
		if (!merchant) {
			return json({ error: 'Merchant not found' }, { status: 404 });
		}

		if (merchant.userId !== user.id) {
			return json({ error: 'Unauthorized to delete this merchant' }, { status: 403 });
		}

		// Check merchant status and apply appropriate deletion
		const isActive = Boolean(merchant.isActive);
		let deleteType: string;
		let message: string;

		if (isActive) {
			// Active merchant - soft delete (deactivate)
			await deleteMerchant(merchantIdNum);
			deleteType = 'deactivated';
			message = 'Merchant has been deactivated successfully';
		} else {
			// Inactive merchant - permanent delete
			await permanentlyDeleteMerchant(merchantIdNum);
			deleteType = 'permanently_deleted';
			message = 'Merchant has been permanently deleted';
		}

		return json({
			message,
			deleteType,
			success: true
		});

	} catch (error) {
		console.error('Error deleting merchant:', error);
		return json(
			{ error: 'Failed to delete merchant', success: false }, 
			{ status: 500 }
		);
	}
};