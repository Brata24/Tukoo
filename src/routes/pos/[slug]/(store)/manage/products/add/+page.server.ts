import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { createProduct, addProductVariants } from '$lib/server/product';
import { getCategoriesByMerchant } from '$lib/server/category';
import { saveUploadedFile } from '$lib/server/utils/file-storage';
import { v4 as uuidv4 } from 'uuid';

export const load: PageServerLoad = async (event) => {
	const merchant = event.locals.merchant;
	const merchantId = event.locals.userPos?.merchantId;

	if (!merchantId) {
		return { merchant, categories: [] };
	}

	const categories = await getCategoriesByMerchant(merchantId);

	return {
		merchant,
		categories
	};
};

export const actions: Actions = {
	'add-product': async (event) => {
		try {
			const merchantId = event.locals.userPos?.merchantId;
			if (!merchantId) {
				return fail(401, { message: 'Unauthorized' });
			}

			const formData = await event.request.formData();
			const name = formData.get('name') as string;
			const barcode = formData.get('barcode') as string;
			const price = parseInt(formData.get('price') as string);
			const stock = parseInt(formData.get('stock') as string);
			const infiniteStock = formData.get('infiniteStock') === 'true' ? 1 : 0;
			const categoryId = parseInt(formData.get('categoryId') as string);
			const photo = formData.get('photo') as File;

			
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
			let photoPath = '';
			if (photo && photo.size > 0) {
				try {
					const merchant = event.locals.merchant as any;
					if (!merchant?.uuid) {
						return fail(400, { message: 'Merchant information not found' });
					}

					const result = await saveUploadedFile(photo, {
						directory: `merchants/${merchant.uuid}/products`,
						maxSize: 5 * 1024 * 1024, // 5MB
						allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
					});
					
					photoPath = result.publicUrl;
				} catch (error: any) {
					return fail(400, { message: error.message || 'Failed to upload photo' });
				}
			}

			// Generate barcode if not provided
			const finalBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : uuidv4();
			
			const productData = {
				name,
				barcode: finalBarcode,
				price,
				stock: infiniteStock ? 0 : stock,
				infiniteStock,
				photo: photoPath,
				categoryId,
				merchantId
			};

			const newProduct = await createProduct(productData);
			

		
			if (variants.length > 0) {
				
				await addProductVariants(newProduct.id, variants);
			
			} else {
			
			}

			return { success: true };
		} catch (error) {
			console.error('Error adding product:', error);
			return fail(500, { message: 'Failed to add product' });
		}
	}
};
