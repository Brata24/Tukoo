import { fail } from '@sveltejs/kit';
import { deleteProduct, verifyProductOwnership, getProductById } from '$lib/server/product';
import { getCategoriesByMerchant } from '$lib/server/category';
import { deleteUploadedFile } from '$lib/server/utils/file-storage';

export const load = async (event: any) => {
	const merchantId = event.locals.userPos?.merchantId;
	
	let categories: any[] = [];
	if (merchantId) {
		categories = await getCategoriesByMerchant(merchantId);
	}
	
	return {
		merchant: event.locals.merchant,
		categories
	};
};

export const actions = {
	'delete-product': async (event: any) => {
		try {
			const merchantId = event.locals.userPos?.merchantId;
			if (!merchantId) {
				return fail(401, { message: 'Unauthorized' });
			}

			const formData = await event.request.formData();
			const productId = parseInt(formData.get('productId') as string);

			if (!productId) {
				return fail(400, { message: 'Product ID is required' });
			}

			// Verify ownership
			const isOwner = await verifyProductOwnership(productId, merchantId);
			if (!isOwner) {
				return fail(403, { message: 'You do not have permission to delete this product' });
			}

			// Get product to delete its photo
			const productToDelete = await getProductById(productId);
			
			// Delete product photo if it exists
			if (productToDelete?.photo && productToDelete.photo.startsWith('/merchants/')) {
				try {
					await deleteUploadedFile(productToDelete.photo);
					console.log('Product photo deleted:', productToDelete.photo);
				} catch (error) {
					console.warn('Failed to delete product photo:', productToDelete.photo, error);
					// Continue even if deletion fails
				}
			}

			await deleteProduct(productId);

			return { success: true };
		} catch (error) {
			console.error('Error deleting product:', error);
			return fail(500, { message: 'Failed to delete product' });
		}
	}
};
