import { db } from '$lib/server/db';
import { category, restaurantTable, merchant, cartItem } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals }: any) => {
	const slug = params.slug;

	// Get merchant
	const merchantData = await db.select().from(merchant).where(eq(merchant.slug, slug)).limit(1);
	if (!merchantData.length) {
		throw error(404, 'Merchant not found');
	}
	const merchantId = merchantData[0].id;

	// Get all active tables
	const tables = await db
		.select()
		.from(restaurantTable)
		.where(and(eq(restaurantTable.merchantId, merchantId), eq(restaurantTable.isActive, 1)));

	// Get all categories for this merchant
	const categories = await db
		.select()
		.from(category)
		.where(eq(category.merchantId, merchantId));

	// Get saved cart items for this user
	let savedCart: any[] = [];
	if (locals.userPos?.id) {
		savedCart = await db
			.select()
			.from(cartItem)
			.where(and(
				eq(cartItem.userPosId, locals.userPos.id),
				eq(cartItem.merchantId, merchantId)
			));
	}

	return {
		tables,
		categories,
		savedCart,
		merchant: merchantData[0],
		userPos: locals.userPos
	};
};
