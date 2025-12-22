import { json } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth-handler/session.js';
import { getMerchantByUUID } from '$lib/server/merchant.js';
import { listPosUsersByMerchantPaginated } from '$lib/server/pos.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ cookies, params, url }) => {
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

		// Get merchant
		const merchant = await getMerchantByUUID(params.uuid);
		if (!merchant) {
			return json({ error: 'Merchant not found' }, { status: 404 });
		}

		// Get pagination parameters from URL
		const page = parseInt(url.searchParams.get('page') ?? '1');
		const limit = parseInt(url.searchParams.get('limit') ?? '10');

		// Validate pagination parameters
		const validPage = Math.max(1, page);
		const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

		// Get users data
		const result = await listPosUsersByMerchantPaginated(merchant.id, validPage, validLimit);

		return json({
			users: result.items,
			pagination: {
				total: result.total,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages
			},
			success: true
		});

	} catch (error) {
		console.error('Error fetching POS users:', error);
		return json(
			{ error: 'Failed to fetch POS users', success: false }, 
			{ status: 500 }
		);
	}
};
