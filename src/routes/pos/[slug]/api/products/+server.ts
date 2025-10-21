import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductsWithDetailsPaginated } from '$lib/server/product';

export const GET: RequestHandler = async (event) => {
	try {
		// Check authentication
		if (!event.locals.sessionPos || !event.locals.userPos) {
			return json({ success: false, message: 'Unauthorized' }, { status: 401 });
		}

		const merchantId = event.locals.userPos.merchantId;
		
		// Get pagination and filter parameters
		const url = new URL(event.request.url);
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const categoryId = url.searchParams.get('categoryId') ? parseInt(url.searchParams.get('categoryId')!) : undefined;
		const searchQuery = url.searchParams.get('search') || undefined;

		// Fetch products with category and variants
		const result = await getProductsWithDetailsPaginated(merchantId, page, limit, categoryId, searchQuery);

		return json({
			success: true,
			products: result.items,
			pagination: {
				total: result.total,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages
			}
		});
	} catch (error) {
		console.error('Error fetching products:', error);
		return json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
	}
};
