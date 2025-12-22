import { db } from '$lib/server/db';
import { cartItem, merchant } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET: Retrieve saved cart
export const GET: RequestHandler = async ({ params, locals }) => {
	// Check authentication
	if (!locals.sessionPos || !locals.userPos) {
		return json({ success: false, error: 'Not authenticated' }, { status: 401 });
	}

	const slug = params.slug;

	try {
		// Get merchant
		const merchantData = await db.select().from(merchant).where(eq(merchant.slug, slug)).limit(1);
		if (!merchantData.length) {
			return json({ success: false, error: 'Merchant not found' }, { status: 404 });
		}
		const merchantId = merchantData[0].id;

		// Get saved cart items
		const savedCart = await db
			.select()
			.from(cartItem)
			.where(and(
				eq(cartItem.userPosId, locals.userPos.id),
				eq(cartItem.merchantId, merchantId)
			));

		return json({ success: true, cart: savedCart });
	} catch (error) {
		console.error('Error fetching cart:', error);
		return json({ success: false, error: 'Failed to fetch cart' }, { status: 500 });
	}
};

// POST: Save cart
export const POST: RequestHandler = async ({ request, params, locals }) => {
	// Check authentication
	if (!locals.sessionPos || !locals.userPos) {
		return json({ success: false, error: 'Not authenticated' }, { status: 401 });
	}

	const slug = params.slug;

	try {
		const body = await request.json();
		const { cart } = body;

		if (!cart || !Array.isArray(cart)) {
			return json({ success: false, error: 'Invalid cart data' }, { status: 400 });
		}

		// Get merchant
		const merchantData = await db.select().from(merchant).where(eq(merchant.slug, slug)).limit(1);
		if (!merchantData.length) {
			return json({ success: false, error: 'Merchant not found' }, { status: 404 });
		}
		const merchantId = merchantData[0].id;

		// Clear existing cart
		await db.delete(cartItem).where(and(
			eq(cartItem.userPosId, locals.userPos.id),
			eq(cartItem.merchantId, merchantId)
		));

		// Save new cart items
		if (cart.length > 0) {
			for (const item of cart) {
				await db.insert(cartItem).values({
					userPosId: locals.userPos.id,
					merchantId,
					productId: item.productId,
					productName: item.productName,
					variantId: item.variantId || null,
					variantName: item.variantName || null,
					variantValue: item.variantValue || null,
					unitPrice: item.unitPrice,
					quantity: item.qty,
					subtotal: item.subtotal,
				});
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error saving cart:', error);
		return json({ success: false, error: 'Failed to save cart' }, { status: 500 });
	}
};

// DELETE: Clear cart
export const DELETE: RequestHandler = async ({ params, locals }) => {
	// Check authentication
	if (!locals.sessionPos || !locals.userPos) {
		return json({ success: false, error: 'Not authenticated' }, { status: 401 });
	}

	const slug = params.slug;

	try {
		// Get merchant
		const merchantData = await db.select().from(merchant).where(eq(merchant.slug, slug)).limit(1);
		if (!merchantData.length) {
			return json({ success: false, error: 'Merchant not found' }, { status: 404 });
		}

		// Delete cart items
		await db.delete(cartItem).where(and(
			eq(cartItem.userPosId, locals.userPos.id),
			eq(cartItem.merchantId, merchantData[0].id)
		));

		return json({ success: true });
	} catch (error) {
		console.error('Error clearing cart:', error);
		return json({ success: false, error: 'Failed to clear cart' }, { status: 500 });
	}
};
