import { fail, redirect } from "@sveltejs/kit";
import { deleteSessionTokenCookie, invalidateSession } from "$lib/server/auth-handler/session";
import { db } from "$lib/server/db";
import { merchant, order, subscriptionPayment } from "$lib/server/db/schema";
import { eq, count, sum, and, gte } from "drizzle-orm";
import { getUserActiveSubscription } from "$lib/server/subscription";

import type { Actions, RequestEvent } from "./$types";

export async function load(event) {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, "/auth/login");
	}
	if (!event.locals.user.emailVerified) {
		return redirect(302, "/auth/verify-email");
	}

	const userId = event.locals.user.id;

	// Get user's subscription
	const subscription = await getUserActiveSubscription(userId);

	// Get total merchants
	const merchantsResult = await db
		.select({ count: count() })
		.from(merchant)
		.where(eq(merchant.userId, userId));
	const totalMerchants = merchantsResult[0]?.count || 0;

	// Get merchants for dropdown
	const userMerchants = await db.query.merchant.findMany({
		where: eq(merchant.userId, userId),
		columns: {
			uuid: true,
			name: true,
			slug: true,
			logo: true
		}
	});

	// Calculate date 30 days ago for revenue trends
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	// Get total orders and revenue across all user's merchants
	const ordersResult = await db
		.select({
			totalOrders: count(),
			totalRevenue: sum(order.total)
		})
		.from(order)
		.innerJoin(merchant, eq(order.merchantId, merchant.id))
		.where(
			and(
				eq(merchant.userId, userId),
				eq(order.paymentStatus, 'paid')
			)
		);

	// Get recent orders (last 30 days)
	const recentOrdersResult = await db
		.select({
			totalOrders: count(),
			totalRevenue: sum(order.total)
		})
		.from(order)
		.innerJoin(merchant, eq(order.merchantId, merchant.id))
		.where(
			and(
				eq(merchant.userId, userId),
				eq(order.paymentStatus, 'paid'),
				gte(order.createdAt, thirtyDaysAgo)
			)
		);

	const totalOrders = ordersResult[0]?.totalOrders || 0;
	const totalRevenue = (parseFloat(ordersResult[0]?.totalRevenue as any) || 0) 
	const recentOrders = recentOrdersResult[0]?.totalOrders || 0;
	const recentRevenue = (parseFloat(recentOrdersResult[0]?.totalRevenue as any) || 0) 

	// Check for pending subscription payments
	const pendingPayment = await db.query.subscriptionPayment.findFirst({
		where: and(
			eq(subscriptionPayment.userId, userId),
			eq(subscriptionPayment.status, 'pending')
		),
		orderBy: (subscriptionPayment, { desc }) => [desc(subscriptionPayment.createdAt)],
		with: {
			plan: true
		}
	});

	return {
		user: event.locals.user,
		subscription: {
			planName: subscription.plan.name,
			planSlug: subscription.plan.slug,
			maxStores: subscription.plan.maxStores,
			currentStores: totalMerchants
		},
		stats: {
			totalMerchants,
			totalOrders,
			totalRevenue,
			recentOrders,
			recentRevenue
		},
		merchants: userMerchants,
		pendingPayment: pendingPayment ? {
			paymentRequestId: pendingPayment.paymentRequestId,
			amount: pendingPayment.amount,
			planName: pendingPayment.plan.name,
			expiresAt: pendingPayment.expiresAt?.toISOString() || null,
			createdAt: pendingPayment.createdAt.toISOString()
		} : null
	};
}

export const actions: Actions = {
	logout: actionLogout
};

async function actionLogout(event: RequestEvent) {
	if (event.locals.session === null) {
		return fail(401, {
			message: "Not authenticated"
		});
	}
	invalidateSession(event.locals.session.id);
	deleteSessionTokenCookie(event);
	return redirect(302, "/auth/login");
}
