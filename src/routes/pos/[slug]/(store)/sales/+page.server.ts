import { error } from "@sveltejs/kit";
import { db } from '$lib/server/db';
import { merchant, product, order, orderItem, category } from '$lib/server/db/schema';
import { eq, and, sql, gte, desc } from 'drizzle-orm';
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params, cookies }) => {
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

	const lockCookieValue = cookies.get(`dashboard_locked_${merchantData.id}`);
	console.log('Load - Lock cookie value:', lockCookieValue, 'for merchant:', merchantData.id);

	// Calculate date ranges
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const weekAgo = new Date();
	weekAgo.setDate(weekAgo.getDate() - 7);
	weekAgo.setHours(0, 0, 0, 0);

	const monthAgo = new Date();
	monthAgo.setDate(monthAgo.getDate() - 30);
	monthAgo.setHours(0, 0, 0, 0);

	// Get all-time stats
	const allTimeStats = await db
		.select({
			totalRevenue: sql<number>`COALESCE(SUM(${order.total}), 0)`,
			totalOrders: sql<number>`COUNT(*)`
		})
		.from(order)
		.where(
			and(
				eq(order.merchantId, merchantData.id),
				eq(order.status, 'paid')
			)
		);

	// Get today's stats
	const todayStats = await db
		.select({
			revenue: sql<number>`COALESCE(SUM(${order.total}), 0)`,
			orders: sql<number>`COUNT(*)`
		})
		.from(order)
		.where(
			and(
				eq(order.merchantId, merchantData.id),
				eq(order.status, 'paid'),
				gte(order.createdAt, today)
			)
		);

	// Get week stats
	const weekStats = await db
		.select({
			revenue: sql<number>`COALESCE(SUM(${order.total}), 0)`,
			orders: sql<number>`COUNT(*)`
		})
		.from(order)
		.where(
			and(
				eq(order.merchantId, merchantData.id),
				eq(order.status, 'paid'),
				gte(order.createdAt, weekAgo)
			)
		);

	// Get month stats
	const monthStats = await db
		.select({
			revenue: sql<number>`COALESCE(SUM(${order.total}), 0)`,
			orders: sql<number>`COUNT(*)`
		})
		.from(order)
		.where(
			and(
				eq(order.merchantId, merchantData.id),
				eq(order.status, 'paid'),
				gte(order.createdAt, monthAgo)
			)
		);

	// Get top selling products
	const topProducts = await db
		.select({
			productId: product.id,
			productName: product.name,
			productPhoto: product.photo,
			productPrice: product.price,
			totalQuantity: sql<number>`SUM(${orderItem.quantity})`,
			totalRevenue: sql<number>`SUM(${orderItem.subtotal})`
		})
		.from(orderItem)
		.innerJoin(product, eq(orderItem.productId, product.id))
		.innerJoin(order, eq(orderItem.orderId, order.id))
		.where(
			and(
				eq(product.merchantId, merchantData.id),
				eq(order.status, 'paid')
			)
		)
		.groupBy(product.id, product.name, product.photo, product.price)
		.orderBy(desc(sql<number>`SUM(${orderItem.subtotal})`))
		.limit(10);

	// Get sales by category
	const salesByCategory = await db
		.select({
			categoryId: category.id,
			categoryName: category.name,
			totalRevenue: sql<number>`SUM(${orderItem.subtotal})`,
			totalQuantity: sql<number>`SUM(${orderItem.quantity})`
		})
		.from(orderItem)
		.innerJoin(product, eq(orderItem.productId, product.id))
		.innerJoin(order, eq(orderItem.orderId, order.id))
		.leftJoin(category, eq(product.categoryId, category.id))
		.where(
			and(
				eq(product.merchantId, merchantData.id),
				eq(order.status, 'paid')
			)
		)
		.groupBy(category.id, category.name)
		.orderBy(desc(sql<number>`SUM(${orderItem.subtotal})`));

	// Get recent orders
	const recentOrders = await db
		.select({
			id: order.id,
			uuid: order.uuid,
			orderNumber: order.orderNumber,
			total: order.total,
			status: order.status,
			customerName: order.customerName,
			diningOption: order.diningOption,
			createdAt: order.createdAt
		})
		.from(order)
		.where(
			and(
				eq(order.merchantId, merchantData.id),
				eq(order.status, 'paid')
			)
		)
		.orderBy(desc(order.createdAt))
		.limit(20);

	// Get daily sales for last 10 days
	const tenDaysAgo = new Date();
	tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
	tenDaysAgo.setHours(0, 0, 0, 0);

	const dailySales = await db
		.select({
			date: sql<string>`DATE(${order.createdAt})`,
			revenue: sql<number>`SUM(${order.total})`,
			orders: sql<number>`COUNT(*)`
		})
		.from(order)
		.where(
			and(
				eq(order.merchantId, merchantData.id),
				eq(order.status, 'paid'),
				gte(order.createdAt, tenDaysAgo)
			)
		)
		.groupBy(sql`DATE(${order.createdAt})`)
		.orderBy(desc(sql`DATE(${order.createdAt})`))
		.limit(10);

	const totalRevenue = Number(allTimeStats[0]?.totalRevenue || 0);
	const totalOrders = Number(allTimeStats[0]?.totalOrders || 0);

	return {
		isLocked: cookies.get(`dashboard_locked_${merchantData.id}`) === 'true',
		merchant: {
			id: merchantData.id,
			name: merchantData.name,
			slug: merchantData.slug,
			logo: merchantData.logo,
			primaryColor: merchantData.primaryColor,
			secondaryColor: merchantData.secondaryColor
		},
		stats: {
			totalRevenue,
			totalOrders,
			averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
			todayRevenue: Number(todayStats[0]?.revenue || 0),
			todayOrders: Number(todayStats[0]?.orders || 0),
			weekRevenue: Number(weekStats[0]?.revenue || 0),
			weekOrders: Number(weekStats[0]?.orders || 0),
			monthRevenue: Number(monthStats[0]?.revenue || 0),
			monthOrders: Number(monthStats[0]?.orders || 0)
		},
		topProducts: topProducts.map(p => ({
			productId: p.productId,
			productName: p.productName,
			productPhoto: p.productPhoto,
			productPrice: p.productPrice,
			totalQuantity: Number(p.totalQuantity),
			totalRevenue: Number(p.totalRevenue)
		})),
		salesByCategory: salesByCategory.map(c => ({
			categoryId: c.categoryId,
			categoryName: c.categoryName || 'Uncategorized',
			totalRevenue: Number(c.totalRevenue),
			totalQuantity: Number(c.totalQuantity)
		})),
		recentOrders: recentOrders.map(o => ({
			...o,
			createdAt: o.createdAt.toISOString()
		})),
		dailySales: dailySales.map(d => ({
			date: d.date,
			revenue: Number(d.revenue),
			orders: Number(d.orders)
		})),
		user: {
			name: locals.userPos.name
		}
	};
};
