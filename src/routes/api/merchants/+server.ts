import { json } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth-handler/session.js';
import { getMerchantsPaginated } from '$lib/server/merchant.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ cookies, url }) => {
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

		// Get pagination parameters from URL
		const page = parseInt(url.searchParams.get('page') ?? '1');
		const limit = parseInt(url.searchParams.get('limit') ?? '10');
		const search = url.searchParams.get('search') ?? '';

		// Validate pagination parameters
		const validPage = Math.max(1, page);
		const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

		// Get merchants data
		const result = await getMerchantsPaginated(user.id, validPage, validLimit, search);

		return json({
			merchants: result.merchants,
			pagination: result.pagination,
			success: true
		});

	} catch (error) {
		console.error('Error fetching merchants:', error);
		return json(
			{ error: 'Failed to fetch merchants', success: false }, 
			{ status: 500 }
		);
	}
};