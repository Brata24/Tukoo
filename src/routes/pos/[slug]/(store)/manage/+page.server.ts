import { fail, redirect, error } from "@sveltejs/kit";
import { deleteSessionTokenCookie, invalidateSession } from "$lib/server/auth-handler/session";
import { db } from '$lib/server/db';
import { merchant, product, category, order, restaurantTable, userPos, payment, orderItem } from '$lib/server/db/schema';
import { eq, and, sql, gte, desc } from 'drizzle-orm';

import type { Actions, RequestEvent } from "./$types";

export const load = async ({ locals, params }) => {
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

	// Get today's date range
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	// Get product count
	const productCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(product)
		.where(eq(product.merchantId, merchantData.id))
		.then(r => r[0]?.count || 0);

	// Get active products count
	const activeProductCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(product)
		.where(and(
			eq(product.merchantId, merchantData.id),
			eq(product.isActive, 1)
		))
		.then(r => r[0]?.count || 0);

	// Get low stock products count (stock < 10 and not infinite)
	const lowStockCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(product)
		.where(and(
			eq(product.merchantId, merchantData.id),
			eq(product.infiniteStock, 0),
			sql`${product.stock} < 10`
		))
		.then(r => r[0]?.count || 0);

	// Get category count
	const categoryCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(category)
		.where(eq(category.merchantId, merchantData.id))
		.then(r => r[0]?.count || 0);

	// Get table count
	const tableCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(restaurantTable)
		.where(eq(restaurantTable.merchantId, merchantData.id))
		.then(r => r[0]?.count || 0);

	// Get staff count
	const staffCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(userPos)
		.where(eq(userPos.merchantId, merchantData.id))
		.then(r => r[0]?.count || 0);

	// Get today's order count
	const todayOrderCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(order)
		.where(and(
			eq(order.merchantId, merchantData.id),
			gte(order.createdAt, today)
		))
		.then(r => r[0]?.count || 0);

	// Get today's revenue
	const todayRevenue = await db
		.select({ total: sql<number>`sum(${order.total})` })
		.from(order)
		.where(and(
			eq(order.merchantId, merchantData.id),
			eq(order.status, 'paid'),
			gte(order.createdAt, today)
		))
		.then(r => r[0]?.total || 0);

	// Get total revenue (all time)
	const totalRevenue = await db
		.select({ total: sql<number>`sum(${order.total})` })
		.from(order)
		.where(and(
			eq(order.merchantId, merchantData.id),
			eq(order.status, 'paid')
		))
		.then(r => r[0]?.total || 0);

	// Get total orders (all time)
	const totalOrders = await db
		.select({ count: sql<number>`count(*)` })
		.from(order)
		.where(eq(order.merchantId, merchantData.id))
		.then(r => r[0]?.count || 0);

	// Get pending orders count
	const pendingOrdersCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(order)
		.where(and(
			eq(order.merchantId, merchantData.id),
			eq(order.status, 'pending')
		))
		.then(r => r[0]?.count || 0);

	// Get orders by processing status
	const ordersByStatus = await db
		.select({
			status: order.processingStatus,
			count: sql<number>`count(*)`
		})
		.from(order)
		.where(and(
			eq(order.merchantId, merchantData.id),
			sql`${order.processingStatus} != 'completed'`
		))
		.groupBy(order.processingStatus);

	// Get recent orders (last 10)
	const recentOrders = await db
		.select({
			id: order.id,
			uuid: order.uuid,
			orderNumber: order.orderNumber,
			total: order.total,
			status: order.status,
			processingStatus: order.processingStatus,
			diningOption: order.diningOption,
			customerName: order.customerName,
			createdAt: order.createdAt,
			tableName: restaurantTable.name,
			userPosName: userPos.name
		})
		.from(order)
		.leftJoin(restaurantTable, eq(order.tableId, restaurantTable.id))
		.leftJoin(userPos, eq(order.userPosId, userPos.id))
		.where(eq(order.merchantId, merchantData.id))
		.orderBy(desc(order.createdAt))
		.limit(10);

	// Get top selling products
	const topProducts = await db
		.select({
			productId: product.id,
			productName: product.name,
			photo: product.photo,
			price: product.price,
			totalQuantity: sql<number>`sum(${orderItem.quantity})`,
			totalRevenue: sql<number>`sum(${orderItem.subtotal})`
		})
		.from(orderItem)
		.innerJoin(product, eq(orderItem.productId, product.id))
		.innerJoin(order, eq(orderItem.orderId, order.id))
		.where(and(
			eq(product.merchantId, merchantData.id),
			eq(order.status, 'paid')
		))
		.groupBy(product.id, product.name, product.photo, product.price)
		.orderBy(sql`sum(${orderItem.quantity}) desc`)
		.limit(5);

	// Get low stock products
	const lowStockProducts = await db
		.select({
			id: product.id,
			name: product.name,
			photo: product.photo,
			stock: product.stock,
			price: product.price
		})
		.from(product)
		.where(and(
			eq(product.merchantId, merchantData.id),
			eq(product.infiniteStock, 0),
			sql`${product.stock} < 10`
		))
		.orderBy(product.stock)
		.limit(5);

	// Get active staff (staff role only, who have created orders today)
	const activeStaff = await db
		.select({
			id: userPos.id,
			name: userPos.name,
			username: userPos.username,
			role: userPos.role,
			lastLogin: userPos.lastLogin,
			orderCount: sql<number>`count(distinct ${order.id})`,
			totalRevenue: sql<number>`sum(${order.total})`
		})
		.from(userPos)
		.innerJoin(order, and(
			eq(order.userPosId, userPos.id),
			gte(order.createdAt, today)
		))
		.where(and(
			eq(userPos.merchantId, merchantData.id),
			eq(userPos.role, 'staff')
		))
		.groupBy(userPos.id, userPos.name, userPos.username, userPos.role, userPos.lastLogin)
		.orderBy(sql`count(distinct ${order.id}) desc`)
		.limit(10);

	return {
		merchant: merchantData,
		stats: {
			products: {
				total: productCount,
				active: activeProductCount,
				lowStock: lowStockCount
			},
			categories: categoryCount,
			tables: tableCount,
			staff: staffCount,
			orders: {
				today: todayOrderCount,
				total: totalOrders,
				pending: pendingOrdersCount
			},
			revenue: {
				today: todayRevenue,
				total: totalRevenue
			}
		},
		ordersByStatus,
		recentOrders,
		topProducts,
		lowStockProducts,
		activeStaff
	};
};

export const actions: Actions = {
    logout: actionLogout
};

async function actionLogout(event: RequestEvent) {
    if (event.locals.sessionPos === null) {
        return fail(401, {
            message: "Not authenticated"
        });
    }
    invalidateSession(event.locals.sessionPos.id);
    deleteSessionTokenCookie(event);
    return redirect(302, "/auth/login");
}
