import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { promoBanner } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';

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

	// Save image file
	const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
	const filepath = join('static', 'merchants', merchantSlug, 'banners', filename);
	const uploadDir = join('static', 'merchants', merchantSlug, 'banners');

	try {
		await mkdir(uploadDir, { recursive: true });
	} catch (e) {
		console.error('Error creating directory:', e);
	}

	const buffer = Buffer.from(await image.arrayBuffer());
	await writeFile(filepath, buffer);

	// Save to database
	const imagePath = `/merchants/${merchantSlug}/banners/${filename}`;
	const [newBanner] = await db
		.insert(promoBanner)
		.values({
			merchantId,
			title,
			image: imagePath,
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
};

// PUT - Update banner
export const PUT: RequestHandler = async ({ request, locals }) => {
	if (locals.sessionPos === null || locals.userPos === null) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const merchantId = locals.userPos.merchantId;
	const data = await request.json();
	const { id, title, order, isActive } = data;

	if (!id || !title) {
		return json({ error: 'Invalid data' }, { status: 400 });
	}

	await db
		.update(promoBanner)
		.set({ title, order, isActive: isActive ? 1 : 0, updatedAt: new Date() })
		.where(and(eq(promoBanner.id, id), eq(promoBanner.merchantId, merchantId)));

	const banners = await db
		.select()
		.from(promoBanner)
		.where(eq(promoBanner.merchantId, merchantId))
		.orderBy(promoBanner.order);

	return json({ success: true, message: 'Banner updated successfully', banners });
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

	const banners = await db
		.select()
		.from(promoBanner)
		.where(eq(promoBanner.merchantId, merchantId))
		.orderBy(promoBanner.order);

	return json({ success: true, message: 'Banner deleted successfully', banners });
};
