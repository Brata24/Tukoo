import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { promoBanner } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';

export const load: PageServerLoad = async (event) => {
	if (event.locals.sessionPos === null || event.locals.userPos === null) {
		return redirect(302, `/pos/${event.params.slug}/auth/login`);
	}

	const merchantId = event.locals.userPos.merchantId;

	const banners = await db
		.select()
		.from(promoBanner)
		.where(eq(promoBanner.merchantId, merchantId))
		.orderBy(promoBanner.order);

	return {
		banners,
		merchantSlug: event.params.slug,
		merchant: event.locals.merchant
	};
};

export const actions: Actions = {
	create: async (event) => {
		if (event.locals.sessionPos === null || event.locals.userPos === null) {
			return fail(401, { message: 'Unauthorized' });
		}

		const merchantId = event.locals.userPos.merchantId;
		const formData = await event.request.formData();
		const title = formData.get('title') as string;
		const image = formData.get('image') as File;
		const order = parseInt(formData.get('order') as string) || 0;
		const isActive = formData.get('isActive') === 'on' ? 1 : 0;

		if (!title || !image || image.size === 0) {
			return fail(400, { message: 'Title and image are required' });
		}

		// Save image file
		const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
		const filepath = join('static', 'merchants', event.params.slug, 'banners', filename);
		const uploadDir = join('static', 'merchants', event.params.slug, 'banners');

		try {
			// Create directory if not exists
			await mkdir(uploadDir, { recursive: true });
		} catch (e) {
			console.error('Error creating directory:', e);
		}

		const buffer = Buffer.from(await image.arrayBuffer());
		await writeFile(filepath, buffer);

		// Save to database
		const imagePath = `/merchants/${event.params.slug}/banners/${filename}`;
		await db.insert(promoBanner).values({
			merchantId,
			title,
			image: imagePath,
			order,
			isActive
		});

		return { success: true, message: 'Banner created successfully' };
	},

	update: async (event) => {
		if (event.locals.sessionPos === null || event.locals.userPos === null) {
			return fail(401, { message: 'Unauthorized' });
		}

		const merchantId = event.locals.userPos.merchantId;
		const formData = await event.request.formData();
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
			.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, merchantId)));

		return { success: true, message: 'Banner updated successfully' };
	},

	delete: async (event) => {
		if (event.locals.sessionPos === null || event.locals.userPos === null) {
			return fail(401, { message: 'Unauthorized' });
		}

		const merchantId = event.locals.userPos.merchantId;
		const formData = await event.request.formData();
		const id = parseInt(formData.get('id') as string);

		if (!id) {
			return fail(400, { message: 'Invalid ID' });
		}

		// Get banner to delete image file
		const banner = await db
			.select()
			.from(promoBanner)
			.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, merchantId)))
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
				.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, merchantId)));
		}

		return { success: true, message: 'Banner deleted successfully' };
	}
};
