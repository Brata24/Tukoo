import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { merchant, promoBanner } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	// Check if user is logged in as cashier
	if (!locals.sessionPos || !locals.userPos) {
		throw redirect(302, `/pos/${params.slug}/auth/login?redirect=/frontview`);
	}

	// Only allow cashier/staff role to access frontview
	if (locals.userPos.role !== 'cashier' && locals.userPos.role !== 'staff') {
		throw error(403, `Only cashiers can access customer display (your role: ${locals.userPos.role})`);
	}

	const merchantData = await db.query.merchant.findFirst({
		where: eq(merchant.slug, params.slug)
	});

	if (!merchantData) {
		throw error(404, 'Merchant not found');
	}

	// Get active promo banners
	const banners = await db.select()
		.from(promoBanner)
		.where(
			and(
				eq(promoBanner.merchantId, merchantData.id),
				eq(promoBanner.isActive, 1)
			)
		)
		.orderBy(promoBanner.order);

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
		banners: banners.map(b => ({
			id: b.id,
			title: b.title,
			image: b.image,
			order: b.order,
			isActive: b.isActive === 1
		})),
		cashier: {
			id: locals.userPos.id,
			name: locals.userPos.name,
			username: locals.userPos.username
		}
	};
};
