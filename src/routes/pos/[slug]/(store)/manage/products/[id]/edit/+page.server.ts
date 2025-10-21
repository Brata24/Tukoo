import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { 
	getProductWithVariants, 
	updateProduct, 
	deleteProductVariants, 
	addProductVariants,
	verifyProductOwnership 
} from '$lib/server/product';
import { getCategoriesByMerchant } from '$lib/server/category';
import { saveUploadedFile, deleteUploadedFile } from '$lib/server/utils/file-storage';

export const load: PageServerLoad = async (event) => {
	const merchant = event.locals.merchant;
	const merchantId = event.locals.userPos?.merchantId;
	const productId = parseInt(event.params.id);

	if (!merchantId || !merchant) {
		throw redirect(302, '/');
	}

	// Verify product ownership
	const isOwner = await verifyProductOwnership(productId, merchantId);
	if (!isOwner) {
		throw redirect(302, `/pos/${merchant.slug}/manage/products`);
	}

	// Get product with variants
	const { product, variants } = await getProductWithVariants(productId);
	
	if (!product) {
		throw redirect(302, `/pos/${merchant.slug}/manage/products`);
	}

	// Get categories
	const categories = await getCategoriesByMerchant(merchantId);

	return {
		merchant,
		product,
		variants,
		categories
	};
};

export const actions: Actions = {
	'update-product': async (event) => {
		try {
			const merchantId = event.locals.userPos?.merchantId;
			if (!merchantId) {
				return fail(401, { message: 'Unauthorized' });
			}

			const productId = parseInt(event.params.id);

			// Verify ownership
			const isOwner = await verifyProductOwnership(productId, merchantId);
			if (!isOwner) {
				return fail(403, { message: 'You do not have permission to edit this product' });
			}

			const formData = await event.request.formData();
			const name = formData.get('name') as string;
			const price = parseInt(formData.get('price') as string);
			const stock = parseInt(formData.get('stock') as string);
			const infiniteStock = formData.get('infiniteStock') === 'true' ? 1 : 0;
			const categoryId = parseInt(formData.get('categoryId') as string);
			const photo = formData.get('photo') as File;
			const existingPhoto = formData.get('existingPhoto') as string;

			const variantsJson = formData.get('variants') as string;
			let variants: Array<{ variantName: string; variantValue: string }> = [];
			
			if (variantsJson) {
				try {
					variants = JSON.parse(variantsJson);
				} catch (e) {
					console.error('Error parsing variants:', e);
				}
			}

			if (!name || !categoryId || price === undefined || price < 0) {
				return fail(400, { message: 'Missing required fields' });
			}

			// Handle photo upload using file storage utility
			let photoPath = existingPhoto;
			if (photo && photo.size > 0) {
				try {
					const merchant = event.locals.merchant as any;
					if (!merchant?.uuid) {
						return fail(400, { message: 'Merchant information not found' });
					}

					// Delete old photo if it exists and is not the default
					if (existingPhoto && existingPhoto.startsWith('/merchants/')) {
						try {
							await deleteUploadedFile(existingPhoto);
							console.log('Old photo deleted:', existingPhoto);
						} catch (error) {
							console.warn('Failed to delete old photo:', existingPhoto, error);
							// Continue even if deletion fails
						}
					}

					// Upload new photo
					const result = await saveUploadedFile(photo, {
						directory: `merchants/${merchant.uuid}/products`,
						maxSize: 5 * 1024 * 1024, // 5MB
						allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
					});
					
					photoPath = result.publicUrl;
					console.log('New photo uploaded:', photoPath);
				} catch (error: any) {
					return fail(400, { message: error.message || 'Failed to upload photo' });
				}
			}

			// Update product
			const updateData = {
				name,
				price,
				stock: infiniteStock ? 0 : stock,
				infiniteStock,
				photo: photoPath,
				categoryId
			};

			await updateProduct(productId, updateData);

			// Update variants: delete all old variants and add new ones
			await deleteProductVariants(productId);
			
			if (variants.length > 0) {
				await addProductVariants(productId, variants);
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating product:', error);
			return fail(500, { message: 'Failed to update product' });
		}
	}
};
