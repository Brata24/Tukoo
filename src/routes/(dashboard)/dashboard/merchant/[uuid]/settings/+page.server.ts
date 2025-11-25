import { db } from '$lib/server/db';
import { merchant } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { saveUploadedFile, deleteUploadedFile } from '$lib/server/utils/file-storage';

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

	return {
		merchant: merchantData
	};
};

export const actions = {
	update: async ({ request, params, locals }) => {
		const user = locals.user;
		if (!user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const merchantUuid = params.uuid;
		const formData = await request.formData();

		// Get merchant to verify ownership
		const merchantData = await db.query.merchant.findFirst({
			where: and(
				eq(merchant.uuid, merchantUuid),
				eq(merchant.userId, user.id)
			)
		});

		if (!merchantData) {
			return fail(404, { message: 'Merchant not found' });
		}

		const name = formData.get('name') as string;
		const slogan = formData.get('slogan') as string;
		const address = formData.get('address') as string;
		const primaryColor = formData.get('primaryColor') as string;
		const secondaryColor = formData.get('secondaryColor') as string;
		const primaryTextColor = formData.get('primaryTextColor') as string;
		const secondaryTextColor = formData.get('secondaryTextColor') as string;
		const merchantLogo = formData.get('merchantLogo') as File;

		// Validate required fields
		if (!name || !address) {
			return fail(400, { 
				message: 'Name and address are required',
				name,
				slogan,
				address,
				primaryColor,
				secondaryColor,
				primaryTextColor,
				secondaryTextColor
			});
		}

		try {
			// Handle logo upload
			let logoUrl = merchantData.logo;
			if (merchantLogo && merchantLogo.size > 0) {
				// Validate file type
				if (!merchantLogo.type.startsWith('image/')) {
					return fail(400, {
						message: 'Logo must be an image file'
					});
				}
				
				// Validate file size (5MB limit)
				if (merchantLogo.size > 5 * 1024 * 1024) {
					return fail(400, {
						message: 'Logo file size must be less than 5MB'
					});
				}

				try {
					// Save new logo
					logoUrl = await saveUploadedFile(merchantLogo, {
						directory: 'merchants/logos',
						maxSize: 5 * 1024 * 1024,
						allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
					}).then(result => result.publicUrl);

					// Delete old logo if it exists
					if (merchantData.logo) {
						try {
							await deleteUploadedFile(merchantData.logo);
						} catch (deleteError) {
							console.error('Error deleting old logo:', deleteError);
							// Continue even if deletion fails
						}
					}
				} catch (uploadError) {
					console.error('Error saving merchant logo:', uploadError);
					return fail(500, {
						message: 'Failed to save merchant logo'
					});
				}
			}

			// Update merchant
			await db.update(merchant)
				.set({
					name,
					slogan: slogan || '',
					address,
					logo: logoUrl,
					primaryColor: primaryColor || merchantData.primaryColor,
					secondaryColor: secondaryColor || merchantData.secondaryColor,
					primaryTextColor: primaryTextColor || merchantData.primaryTextColor,
					secondaryTextColor: secondaryTextColor || merchantData.secondaryTextColor,
					updatedAt: new Date()
				})
				.where(eq(merchant.id, merchantData.id));

			return { success: true, message: 'Merchant updated successfully' };
		} catch (err) {
			console.error('Error updating merchant:', err);
			return fail(500, { message: 'Failed to update merchant' });
		}
	}
};
