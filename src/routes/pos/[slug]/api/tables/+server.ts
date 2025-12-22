import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { restaurantTable } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const merchantIdParam = url.searchParams.get('merchantId');
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '9');

		if (!merchantIdParam) {
			return json({ 
				success: false, 
				error: 'Merchant ID is required' 
			}, { status: 400 });
		}

		const merchantId = parseInt(merchantIdParam);
		
		if (isNaN(merchantId)) {
			return json({ 
				success: false, 
				error: 'Invalid Merchant ID format' 
			}, { status: 400 });
		}

		
		const offset = (page - 1) * limit;

		
		const allTables = await db
			.select()
			.from(restaurantTable)
			.where(eq(restaurantTable.merchantId, merchantId));

		const total = allTables.length;

		
		const tables = await db
			.select()
			.from(restaurantTable)
			.where(eq(restaurantTable.merchantId, merchantId))
			.limit(limit)
			.offset(offset)
			.orderBy(restaurantTable.createdAt);

		return json({
			success: true,
			tables,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		console.error('Error fetching tables:', error);
		return json({ 
			success: false, 
			error: 'Failed to fetch tables' 
		}, { status: 500 });
	}
};
