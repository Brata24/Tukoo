import { json } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { restaurantTable, product, category, merchant } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * GET /api/self-order/menu?slug=merchant-slug&qrToken=uuid
 * Load menu data for self-order
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const slug = url.searchParams.get("slug");
		const qrToken = url.searchParams.get("qrToken");

		if (!slug || !qrToken) {
			return json(
				{ 
					success: false, 
					error: "Missing required parameters: slug and qrToken" 
				},
				{ status: 400 }
			);
		}

		// Find merchant by slug
		const merchantData = await db
			.select()
			.from(merchant)
			.where(eq(merchant.slug, slug))
			.limit(1);

		if (!merchantData || merchantData.length === 0) {
			return json(
				{ 
					success: false, 
					error: "Merchant not found" 
				},
				{ status: 404 }
			);
		}

		const merchantInfo = merchantData[0];

		// Find table by QR token and merchant
		const tableData = await db
			.select()
			.from(restaurantTable)
			.where(
				and(
					eq(restaurantTable.qrToken, qrToken),
					eq(restaurantTable.merchantId, merchantInfo.id),
					eq(restaurantTable.isActive, 1)
				)
			)
			.limit(1);

		if (!tableData || tableData.length === 0) {
			return json(
				{ 
					success: false, 
					error: "Table not found or inactive" 
				},
				{ status: 404 }
			);
		}

		const table = tableData[0];

		// Get all categories for this merchant
		const categories = await db
			.select()
			.from(category)
			.where(eq(category.merchantId, merchantInfo.id))
			.orderBy(category.name);

		// Get all active products
		const products = await db
			.select()
			.from(product)
			.where(
				and(
					eq(product.merchantId, merchantInfo.id), 
					eq(product.isActive, 1)
				)
			)
			.orderBy(product.name);

		return json({
			success: true,
			data: {
				table,
				merchant: merchantInfo,
				categories,
				products,
			},
		});
	} catch (error) {
		console.error("Error loading menu:", error);
		return json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
};
