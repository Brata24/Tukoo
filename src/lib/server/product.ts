import { db } from './db';
import { product, productVariant, category } from './db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface Product {
	id: number;
	name: string;
	barcode: string;
	price: number;
	stock: number;
	infiniteStock: number;
	photo: string;
	categoryId: number;
	merchantId: number;
	isActive: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductVariant {
	id: number;
	productId: number;
	variantName: string;
	variantValue: string;
	createdAt: Date;
}

export interface CreateProductData {
	name: string;
	barcode: string;
	price: number;
	stock: number;
	infiniteStock: number;
	photo: string;
	categoryId: number;
	merchantId: number;
}

export interface UpdateProductData {
	name?: string;
	price?: number;
	stock?: number;
	infiniteStock?: number;
	photo?: string;
	categoryId?: number;
	isActive?: number;
}

export interface ProductVariantInput {
	variantName: string;
	variantValue: string;
}

// Get all products by merchant
export async function getProductsByMerchant(merchantId: number): Promise<Product[]> {
	return await db.select().from(product).where(eq(product.merchantId, merchantId)).orderBy(desc(product.createdAt));
}

// Get products with pagination
export async function getProductsByMerchantPaginated(
	merchantId: number,
	page: number = 1,
	limit: number = 10
): Promise<{ items: Product[]; total: number; page: number; limit: number; totalPages: number }> {
	const offset = (page - 1) * limit;

	const items = await db
		.select()
		.from(product)
		.where(eq(product.merchantId, merchantId))
		.orderBy(desc(product.createdAt))
		.limit(limit)
		.offset(offset);

	const totalResult = await db
		.select({ count: product.id })
		.from(product)
		.where(eq(product.merchantId, merchantId));

	const total = totalResult.length;
	const totalPages = Math.ceil(total / limit);

	return {
		items,
		total,
		page,
		limit,
		totalPages
	};
}

// Get products with category and variants (for display)
export async function getProductsWithDetailsPaginated(
	merchantId: number,
	page: number = 1,
	limit: number = 10,
	categoryId?: number,
	searchQuery?: string
): Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number }> {
	const offset = (page - 1) * limit;

	// Build where conditions
	const conditions = [eq(product.merchantId, merchantId)];
	
	if (categoryId) {
		conditions.push(eq(product.categoryId, categoryId));
	}
	
	if (searchQuery && searchQuery.trim()) {
		const { like } = await import('drizzle-orm');
		conditions.push(like(product.name, `%${searchQuery.trim()}%`));
	}

	// Get products with category
	const productsData = await db
		.select({
			id: product.id,
			name: product.name,
			price: product.price,
			stock: product.stock,
			infiniteStock: product.infiniteStock,
			photo: product.photo,
			categoryId: product.categoryId,
			categoryName: category.name,
			merchantId: product.merchantId,
			isActive: product.isActive,
			createdAt: product.createdAt,
			updatedAt: product.updatedAt
		})
		.from(product)
		.leftJoin(category, eq(product.categoryId, category.id))
		.where(and(...conditions))
		.orderBy(desc(product.createdAt))
		.limit(limit)
		.offset(offset);

	// Get variants for all products
	const productIds = productsData.map(p => p.id);
	let variantsData: ProductVariant[] = [];
	
	if (productIds.length > 0) {
		// Fetch all variants for all products
		const allVariants = await db.select().from(productVariant);
		variantsData = allVariants.filter(v => productIds.includes(v.productId));
	}

	// Group variants by product
	const variantsByProduct = variantsData.reduce((acc: any, variant: ProductVariant) => {
		if (!acc[variant.productId]) {
			acc[variant.productId] = [];
		}
		acc[variant.productId].push(variant);
		return acc;
	}, {});

	// Combine products with their variants - add default variant if none exist
	const items = productsData.map(p => ({
		...p,
		category: p.categoryName,
		variants: variantsByProduct[p.id] && variantsByProduct[p.id].length > 0 
			? variantsByProduct[p.id]
			: [{
				id: null,
				productId: p.id,
				variantName: 'Default',
				variantValue: 'Standard',
				createdAt: new Date()
			}]
	}));

	const totalResult = await db
		.select({ count: product.id })
		.from(product)
		.where(and(...conditions));

	const total = totalResult.length;
	const totalPages = Math.ceil(total / limit);

	return {
		items,
		total,
		page,
		limit,
		totalPages
	};
}

// Get single product by id
export async function getProductById(productId: number): Promise<Product | null> {
	const result = await db.select().from(product).where(eq(product.id, productId));
	return result[0] || null;
}

// Get product with variants
export async function getProductWithVariants(productId: number): Promise<{ product: Product | null; variants: ProductVariant[] }> {
	const productData = await getProductById(productId);
	const variants = await db.select().from(productVariant).where(eq(productVariant.productId, productId));
	
	return {
		product: productData,
		variants
	};
}

// Get variants by product id
export async function getVariantsByProductId(productId: number): Promise<ProductVariant[]> {
	return await db.select().from(productVariant).where(eq(productVariant.productId, productId));
}

// Create a new product
export async function createProduct(data: CreateProductData): Promise<Product> {
	const result = await db.insert(product).values(data);
	const insertedProduct = await getProductById(Number(result[0].insertId));
	return insertedProduct!;
}

// Add variant to product
export async function addProductVariant(productId: number, variantName: string, variantValue: string): Promise<void> {
	await db.insert(productVariant).values({
		productId,
		variantName,
		variantValue
	});
}

// Add multiple variants to product
export async function addProductVariants(productId: number, variants: ProductVariantInput[]): Promise<void> {

	
	if (variants.length === 0) {
		
		return;
	}
	
	const variantData = variants.map(v => ({
		productId,
		variantName: v.variantName,
		variantValue: v.variantValue
	}));
		
	try {
		const result = await db.insert(productVariant).values(variantData);
		console.log('Variants inserted successfully:', result);
	} catch (error) {
		console.error('Error inserting variants:', error);
		throw error;
	}
}

// Update product
export async function updateProduct(productId: number, data: UpdateProductData): Promise<void> {
	await db.update(product).set(data).where(eq(product.id, productId));
}

// Delete product
export async function deleteProduct(productId: number): Promise<void> {
	// Delete variants first
	await db.delete(productVariant).where(eq(productVariant.productId, productId));
	// Then delete product
	await db.delete(product).where(eq(product.id, productId));
}

// Delete specific variant
export async function deleteVariant(variantId: number): Promise<void> {
	await db.delete(productVariant).where(eq(productVariant.id, variantId));
}

// Delete all variants for a product
export async function deleteProductVariants(productId: number): Promise<void> {
	await db.delete(productVariant).where(eq(productVariant.productId, productId));
}

// Verify product ownership
export async function verifyProductOwnership(productId: number, merchantId: number): Promise<boolean> {
	const productData = await db
		.select()
		.from(product)
		.where(and(eq(product.id, productId), eq(product.merchantId, merchantId)));
	return productData.length > 0;
}
