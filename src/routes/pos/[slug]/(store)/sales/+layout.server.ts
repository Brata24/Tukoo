import { error } from "@sveltejs/kit";
import { db } from '$lib/server/db';
import { merchant } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, params, cookies }) => {
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
	console.log('Layout Load - Lock cookie value:', lockCookieValue, 'for merchant:', merchantData.id);

	return {
		isLocked: lockCookieValue === 'true',
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
		user: {
			name: locals.userPos.name
		}
	};
};
