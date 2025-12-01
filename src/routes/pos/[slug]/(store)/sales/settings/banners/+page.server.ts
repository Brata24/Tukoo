import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { promoBanner } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.merchant) {
		throw new Error('Merchant not found');
	}

	const banners = await db
		.select()
		.from(promoBanner)
		.where(eq(promoBanner.merchantId, locals.merchant.id))
		.orderBy(promoBanner.order);

	return {
		merchant: locals.merchant,
		banners
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.merchant) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const image = formData.get('image') as File;
		const order = parseInt(formData.get('order') as string) || 0;
		const isActive = formData.get('isActive') === 'on' ? 1 : 0;

		if (!title || !image || image.size === 0) {
			return fail(400, { message: 'Title and image are required' });
		}

		// Save image file
		const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
		const filepath = join('static', 'merchants', locals.merchant.slug, 'banners', filename);
		const uploadDir = join('static', 'merchants', locals.merchant.slug, 'banners');

		try {
			// Create directory if not exists
			await mkdir(uploadDir, { recursive: true });
		} catch (e) {
			// Directory exists or error creating
		}

		const buffer = Buffer.from(await image.arrayBuffer());
		await writeFile(filepath, buffer);

		// Save to database
		const imagePath = `/merchants/${locals.merchant.slug}/banners/${filename}`;
		await db.insert(promoBanner).values({
			merchantId: locals.merchant.id,
			title,
			image: imagePath,
			order,
			isActive
		});

		return { success: true, message: 'Banner created successfully' };
	},

	update: async ({ request, locals }) => {
		if (!locals.merchant) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);
		const title = formData.get('title') as string;
		const order = parseInt(formData.get('order') as string) || 0;
		const isActive = formData.get('isActive') === 'on' ? 1 : 0;

		if (!id || !title) {
			return fail(400, { message: 'Invalid data' });
		}

		await db
			.update(promoBanner)
			.set({ title, order, isActive, updatedAt: new Date() })
			.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, locals.merchant.id)));

		return { success: true, message: 'Banner updated successfully' };
	},

	delete: async ({ request, locals }) => {
		if (!locals.merchant) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);

		if (!id) {
			return fail(400, { message: 'Invalid ID' });
		}

		// Get banner to delete image file
		const banner = await db
			.select()
			.from(promoBanner)
			.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, locals.merchant.id)))
			.limit(1);

		if (banner.length > 0) {
			// Delete image file
			try {
				const imagePath = join('static', banner[0].image);
				await unlink(imagePath);
			} catch (e) {
				console.error('Error deleting image file:', e);
			}

			// Delete from database
			await db
				.delete(promoBanner)
				.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, locals.merchant.id)));
		}

		return { success: true, message: 'Banner deleted successfully' };
	}
};
