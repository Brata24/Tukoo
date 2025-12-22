import { json } from '@sveltejs/kit';
import { getCategoriesByMerchantPaginated } from '$lib/server/category.js';

export async function GET({ url, locals }) {
    // Check authentication
    if (!locals.sessionPos || !locals.userPos) {
        return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = locals.userPos.merchantId;
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');

    try {
        const result = await getCategoriesByMerchantPaginated(merchantId, page, limit);
        
        return json({
            success: true,
            categories: result.items,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
    }
}
