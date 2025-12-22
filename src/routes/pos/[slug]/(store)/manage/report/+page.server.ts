import { error } from "@sveltejs/kit";
import { db } from '$lib/server/db';
import { merchant, product, order, orderItem, category } from '$lib/server/db/schema';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.sessionPos || !locals.userPos) {
		throw error(401, 'Unauthorized');
	}

	const merchantData = await db.query.merchant.findFirst({
		where: eq(merchant.slug, params.slug)
	});

	if (!merchantData) {
		throw error(404, 'Merchant not found');
	}

	// Check if user has access to this merchant
	if (locals.userPos.merchantId !== merchantData.id) {
		throw error(403, 'Forbidden');
	}

	// Get month and year from URL params, default to current month
	const now = new Date();
	const selectedMonth = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1));
	const selectedYear = parseInt(url.searchParams.get('year') || String(now.getFullYear()));

	// Calculate date range for selected month
	const startDate = new Date(selectedYear, selectedMonth - 1, 1);
	startDate.setHours(0, 0, 0, 0);
	
	const endDate = new Date(selectedYear, selectedMonth, 0);
	endDate.setHours(23, 59, 59, 999);

	// Get sales report data - grouped by product
	const salesReport = await db
		.select({
			productId: product.id,
			productName: product.name,
			productBarcode: product.barcode,
			productPrice: product.price,
			categoryName: sql<string>`COALESCE(${category.name}, 'Uncategorized')`,
			totalQuantity: sql<number>`SUM(${orderItem.quantity})`,
			totalRevenue: sql<number>`SUM(${orderItem.subtotal})`,
			orderCount: sql<number>`COUNT(DISTINCT ${order.id})`
		})
		.from(orderItem)
		.innerJoin(product, eq(orderItem.productId, product.id))
		.innerJoin(order, eq(orderItem.orderId, order.id))
		.leftJoin(category, eq(product.categoryId, category.id))
		.where(
			and(
				eq(product.merchantId, merchantData.id),
				eq(order.status, 'paid'),
				gte(order.createdAt, startDate),
				lte(order.createdAt, endDate)
			)
		)
		.groupBy(
			product.id,
			product.name,
			product.barcode,
			product.price,
			category.name
		)
		.orderBy(desc(sql<number>`SUM(${orderItem.subtotal})`));

	// Get summary statistics
	const summary = await db
		.select({
			totalRevenue: sql<number>`COALESCE(SUM(${orderItem.subtotal}), 0)`,
			totalOrders: sql<number>`COUNT(DISTINCT ${order.id})`,
			totalItems: sql<number>`COALESCE(SUM(${orderItem.quantity}), 0)`
		})
		.from(orderItem)
		.innerJoin(order, eq(orderItem.orderId, order.id))
		.where(
			and(
				eq(order.merchantId, merchantData.id),
				eq(order.status, 'paid'),
				gte(order.createdAt, startDate),
				lte(order.createdAt, endDate)
			)
		);

	return {
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
		salesReport: salesReport.map(item => ({
			productId: item.productId,
			productName: item.productName,
			productBarcode: item.productBarcode,
			productPrice: item.productPrice,
			categoryName: item.categoryName,
			totalQuantity: Number(item.totalQuantity),
			totalRevenue: Number(item.totalRevenue),
			orderCount: Number(item.orderCount)
		})),
		summary: {
			totalRevenue: Number(summary[0]?.totalRevenue || 0),
			totalOrders: Number(summary[0]?.totalOrders || 0),
			totalItems: Number(summary[0]?.totalItems || 0)
		},
		selectedMonth,
		selectedYear,
		user: {
			name: locals.userPos.name
		}
	};
};
