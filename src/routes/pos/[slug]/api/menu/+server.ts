import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { merchant, restaurantTable, category, product, productVariant } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const { slug } = params;
		const qrToken = url.searchParams.get('qrToken');

		if (!qrToken) {
			return json({ success: false, error: 'QR Token is required' }, { status: 400 });
		}

		// Get merchant
		const merchantData = await db.query.merchant.findFirst({
			where: eq(merchant.slug, slug)
		});

		if (!merchantData) {
			return json({ success: false, error: 'Merchant not found' }, { status: 404 });
		}

		// Get table
		const tableData = await db.query.restaurantTable.findFirst({
			where: and(
				eq(restaurantTable.qrToken, qrToken),
				eq(restaurantTable.merchantId, merchantData.id)
			)
		});

		if (!tableData) {
			return json({ success: false, error: 'Table not found' }, { status: 404 });
		}

		if (!tableData.isActive) {
			return json({ success: false, error: 'Table is not active' }, { status: 403 });
		}

		// Get categories
		const categories = await db.query.category.findMany({
			where: eq(category.merchantId, merchantData.id)
		});

			// Get products
		const products = await db.query.product.findMany({
			where: eq(product.merchantId, merchantData.id)
		});

		// Get all variants for these products in one query
		const productIds = products.map(p => p.id);
		let allVariants: any[] = [];
		
		if (productIds.length > 0) {
			allVariants = await db.select()
				.from(productVariant)
				.where(inArray(productVariant.productId, productIds));
		}

		// Group variants by product ID
		const variantsByProduct: Record<number, any[]> = {};
		for (const variant of allVariants) {
			if (!variantsByProduct[variant.productId]) {
				variantsByProduct[variant.productId] = [];
			}
			variantsByProduct[variant.productId].push(variant);
		}

		return json({
			success: true,
			data: {
				merchant: {
					id: merchantData.id,
					name: merchantData.name,
					slug: merchantData.slug,
					logo: merchantData.logo,
					primaryColor: merchantData.primaryColor,
					secondaryColor: merchantData.secondaryColor,
					primaryTextColor: merchantData.primaryTextColor,
					secondaryTextColor: merchantData.secondaryTextColor
				},
				table: {
					id: tableData.id,
					name: tableData.name,
					qrToken: tableData.qrToken,
					allowPayAtCashier: tableData.allowPayAtCashier
				},
				categories,
				products: products.map(p => ({
					...p,
					variants: variantsByProduct[p.id] || []
				}))
			}
		});
	} catch (error) {
		console.error('Error loading menu:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
