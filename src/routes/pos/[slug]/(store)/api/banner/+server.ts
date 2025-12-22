import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { promoBanner } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { saveUploadedFile, deleteUploadedFile } from '$lib/server/utils/file-storage';

// GET - List all banners
export const GET: RequestHandler = async ({ locals, params }) => {
	if (locals.sessionPos === null || locals.userPos === null) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const merchantId = locals.userPos.merchantId;
	const merchantSlug = params.slug;

	const banners = await db
		.select()
		.from(promoBanner)
		.where(eq(promoBanner.merchantId, merchantId))
		.orderBy(promoBanner.order);

	return json({ banners, merchantSlug });
};

// POST - Create new banner
export const POST: RequestHandler = async ({ request, locals, params }) => {
	if (locals.sessionPos === null || locals.userPos === null) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const merchantId = locals.userPos.merchantId;
	const merchantSlug = params.slug;

	const formData = await request.formData();
	const title = formData.get('title') as string;
	const image = formData.get('image') as File;
	const order = parseInt(formData.get('order') as string) || 0;
	const isActive = formData.get('isActive') === 'on' ? 1 : 0;

	if (!title || !image || image.size === 0) {
		return json({ error: 'Title and image are required' }, { status: 400 });
	}

	// Validate file size (max 5MB)
	const maxSize = 5 * 1024 * 1024; // 5MB
	if (image.size > maxSize) {
		return json({ error: 'Image size must be less than 5MB' }, { status: 413 });
	}

	// Validate file type
	const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
	if (!allowedTypes.includes(image.type)) {
		return json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
	}

	// Save image to S3
	try {
		const { publicUrl } = await saveUploadedFile(image, {
			directory: `merchants/${merchantSlug}/banners`,
			maxSize: maxSize,
			allowedTypes
		});

		// Save to database
		const [newBanner] = await db
			.insert(promoBanner)
			.values({
				merchantId,
				title,
				image: publicUrl,
				order,
				isActive
			})
			.$returningId();

		const banners = await db
			.select()
			.from(promoBanner)
			.where(eq(promoBanner.merchantId, merchantId))
			.orderBy(promoBanner.order);

		return json({ success: true, message: 'Banner created successfully', banners });
	} catch (error: any) {
		console.error('Error saving banner:', error);
		return json({ error: error.message || 'Failed to save banner' }, { status: 500 });
	}
};

// PUT - Update banner
export const PUT: RequestHandler = async ({ request, locals, params }) => {
	if (locals.sessionPos === null || locals.userPos === null) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const merchantId = locals.userPos.merchantId;
	const merchantSlug = params.slug;
	const formData = await request.formData();
	
	const id = parseInt(formData.get('id') as string);
	const title = formData.get('title') as string;
	const order = parseInt(formData.get('order') as string) || 0;
	const isActive = formData.get('isActive') === 'true' || formData.get('isActive') === '1' ? 1 : 0;
	const image = formData.get('image') as File | null;

	if (!id || !title) {
		return json({ error: 'Invalid data' }, { status: 400 });
	}

	try {
		let imageUrl: string | undefined;

		// If new image is provided, upload it and delete old one
		if (image && image.size > 0) {
			// Validate file size (max 5MB)
			const maxSize = 5 * 1024 * 1024;
			if (image.size > maxSize) {
				return json({ error: 'Image size must be less than 5MB' }, { status: 413 });
			}

			// Validate file type
			const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!allowedTypes.includes(image.type)) {
				return json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
			}

			// Get current banner to delete old image
			const [currentBanner] = await db
				.select()
				.from(promoBanner)
				.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, merchantId)))
				.limit(1);

			if (!currentBanner) {
				return json({ error: 'Banner not found' }, { status: 404 });
			}

			// Upload new image
			const { publicUrl } = await saveUploadedFile(image, {
				directory: `merchants/${merchantSlug}/banners`,
				maxSize: maxSize,
				allowedTypes
			});

			imageUrl = publicUrl;

			// Delete old image
			try {
				await deleteUploadedFile(currentBanner.image);
			} catch (e) {
				console.error('Error deleting old image:', e);
			}
		}

		// Update banner in database
		const updateData: any = {
			title,
			order,
			isActive,
			updatedAt: new Date()
		};

		if (imageUrl) {
			updateData.image = imageUrl;
		}

		await db
			.update(promoBanner)
			.set(updateData)
			.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, merchantId)));

		const banners = await db
			.select()
			.from(promoBanner)
			.where(eq(promoBanner.merchantId, merchantId))
			.orderBy(promoBanner.order);

		return json({ success: true, message: 'Banner updated successfully', banners });
	} catch (error: any) {
		console.error('Error updating banner:', error);
		return json({ error: error.message || 'Failed to update banner' }, { status: 500 });
	}
};

// DELETE - Delete banner
export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (locals.sessionPos === null || locals.userPos === null) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const merchantId = locals.userPos.merchantId;
	const data = await request.json();
	const { id } = data;

	if (!id) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	// Get banner to delete image file
	const banner = await db
		.select()
		.from(promoBanner)
		.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, merchantId)))
		.limit(1);

	if (banner.length > 0) {
		// Delete image file from S3
		try {
			await deleteUploadedFile(banner[0].image);
		} catch (e) {
			console.error('Error deleting image file:', e);
		}

		// Delete from database
		await db
			.delete(promoBanner)
			.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, merchantId)));
	}

	const banners = await db
		.select()
		.from(promoBanner)
		.where(eq(promoBanner.merchantId, merchantId))
		.orderBy(promoBanner.order);

	return json({ success: true, message: 'Banner deleted successfully', banners });
};
