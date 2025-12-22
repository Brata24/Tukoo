import { db } from '$lib/server/db';
import { merchant, product, category, order, restaurantTable, userPos, productVariant } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const merchantUuid = params.uuid;

	// Get merchant details
	const merchantData = await db.query.merchant.findFirst({
		where: and(
			eq(merchant.uuid, merchantUuid),
			eq(merchant.userId, user.id)
		)
	});

	if (!merchantData) {
		throw error(404, 'Merchant not found');
	}

	// Get product count
	const productCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(product)
		.where(eq(product.merchantId, merchantData.id))
		.then(r => r[0]?.count || 0);

	// Get category count
	const categoryCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(category)
		.where(eq(category.merchantId, merchantData.id))
		.then(r => r[0]?.count || 0);

	// Get variant count
	const variantCount = await db
		.select({ count: sql<number>`count(distinct ${productVariant.id})` })
		.from(productVariant)
		.innerJoin(product, eq(productVariant.productId, product.id))
		.where(eq(product.merchantId, merchantData.id))
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

	// Get order count
	const orderCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(order)
		.where(eq(order.merchantId, merchantData.id))
		.then(r => r[0]?.count || 0);

	// Get total revenue (sum of paid orders)
	const revenueData = await db
		.select({ total: sql<number>`sum(${order.total})` })
		.from(order)
		.where(and(
			eq(order.merchantId, merchantData.id),
			eq(order.status, 'paid')
		))
		.then(r => r[0]?.total || 0);

	// Get recent orders
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
			tableId: order.tableId,
			userPosName: userPos.name,
			userPosId: order.userPosId
		})
		.from(order)
		.leftJoin(restaurantTable, eq(order.tableId, restaurantTable.id))
		.leftJoin(userPos, eq(order.userPosId, userPos.id))
		.where(eq(order.merchantId, merchantData.id))
		.orderBy(sql`${order.createdAt} desc`)
		.limit(5);

	// Get top products by order quantity
	const topProducts = await db
		.select({
			productId: product.id,
			productName: product.name,
			photo: product.photo,
			price: product.price,
			totalOrders: sql<number>`count(distinct ${order.id})`,
			totalQuantity: sql<number>`sum(order_item.quantity)`
		})
		.from(product)
		.leftJoin(sql`order_item`, sql`order_item.product_id = ${product.id}`)
		.leftJoin(order, sql`order_item.order_id = ${order.id}`)
		.where(eq(product.merchantId, merchantData.id))
		.groupBy(product.id, product.name, product.photo, product.price)
		.orderBy(sql`sum(order_item.quantity) desc`)
		.limit(5);

	return {
		merchant: merchantData,
		stats: {
			productCount,
			categoryCount,
			variantCount,
			tableCount,
			staffCount,
			orderCount,
			revenue: revenueData
		},
		recentOrders,
		topProducts
	};
};
