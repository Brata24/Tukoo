import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { promoBanner } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { saveUploadedFile, deleteUploadedFile } from '$lib/server/utils/file-storage';

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

		// Validate file size (max 5MB)
		const maxSize = 5 * 1024 * 1024;
		if (image.size > maxSize) {
			return fail(413, { message: 'Image size must be less than 5MB' });
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(image.type)) {
			return fail(400, { message: 'Only JPEG, PNG, and WebP images are allowed' });
		}

		try {
			// Upload to S3/CDN
			const { publicUrl } = await saveUploadedFile(image, {
				directory: `merchants/${locals.merchant.uuid}/banners`,
				maxSize,
				allowedTypes
			});

			// Save to database
			await db.insert(promoBanner).values({
				merchantId: locals.merchant.id,
				title,
				image: publicUrl,
				order,
				isActive
			});

			return { success: true, message: 'Banner created successfully' };
		} catch (error: any) {
			console.error('Error creating banner:', error);
			return fail(500, { message: error.message || 'Failed to create banner' });
		}
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
		const image = formData.get('image') as File | null;

		if (!id || !title) {
			return fail(400, { message: 'Invalid data' });
		}

		const updateData: any = {
			title,
			order,
			isActive,
			updatedAt: new Date()
		};

		// Handle image upload if new image is provided
		if (image && image.size > 0) {
			// Validate file size (max 5MB)
			const maxSize = 5 * 1024 * 1024;
			if (image.size > maxSize) {
				return fail(413, { message: 'Image size must be less than 5MB' });
			}

			// Validate file type
			const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!allowedTypes.includes(image.type)) {
				return fail(400, { message: 'Only JPEG, PNG, and WebP images are allowed' });
			}

			try {
				// Get current banner to delete old image
				const [currentBanner] = await db
					.select()
					.from(promoBanner)
					.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, locals.merchant.id)))
					.limit(1);

				if (currentBanner) {
					// Delete old image from S3/CDN
					try {
						await deleteUploadedFile(currentBanner.image);
					} catch (e) {
						console.error('Error deleting old image:', e);
					}
				}

				// Upload new image to S3/CDN
				const { publicUrl } = await saveUploadedFile(image, {
					directory: `merchants/${locals.merchant.uuid}/banners`,
					maxSize,
					allowedTypes
				});

				updateData.image = publicUrl;
			} catch (error: any) {
				console.error('Error uploading image:', error);
				return fail(500, { message: error.message || 'Failed to upload image' });
			}
		}

		await db
			.update(promoBanner)
			.set(updateData)
			.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, locals.merchant.id)));

		return { success: true, message: 'Banner updated successfully' };
	},

	remove: async ({ request, locals }) => {
		if (!locals.merchant) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);

		if (!id) {
			return fail(400, { message: 'Invalid ID' });
		}

		// Get banner to delete image file
		const [banner] = await db
			.select()
			.from(promoBanner)
			.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, locals.merchant.id)))
			.limit(1);

		if (banner) {
			// Delete image from S3/CDN
			try {
				await deleteUploadedFile(banner.image);
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
