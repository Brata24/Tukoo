import { error, json } from "@sveltejs/kit";
import { db } from '$lib/server/db';
import { merchant, userPos } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, request, params, cookies }) => {
	if (!locals.sessionPos || !locals.userPos) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { action, password } = body;

	const merchantData = await db.query.merchant.findFirst({
		where: eq(merchant.slug, params.slug)
	});

	if (!merchantData) {
		throw error(404, 'Merchant not found');
	}

	if (action === 'lock') {
		// Set lock status in httpOnly cookie
		cookies.set(`dashboard_locked_${merchantData.id}`, 'true', {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: false,
			maxAge: 60 * 60 * 24 * 7
		});

		return json({ success: true });
	}

	if (action === 'unlock') {
		if (!password) {
			throw error(400, 'Password harus diisi');
		}

		// Get current POS user's password from database
		const posUser = await db.query.userPos.findFirst({
			where: eq(userPos.id, locals.userPos.id),
			columns: {
				password: true
			}
		});

		if (!posUser) {
			throw error(404, 'User tidak ditemukan');
		}

		// Verify password using argon2
		const isPasswordValid = await verify(posUser.password, password);

		if (!isPasswordValid) {
			throw error(401, 'Password salah');
		}

		// Set lock status to false
		cookies.set(`dashboard_locked_${merchantData.id}`, 'false', {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: false,
			maxAge: 60 * 60 * 24 * 7
		});

		return json({ success: true });
	}

	throw error(400, 'Invalid action');
};
