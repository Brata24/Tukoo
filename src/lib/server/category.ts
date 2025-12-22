import { db } from './db/index.js';
import { category } from './db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

export interface Category {
    id: number;
    name: string;
    merchantId: number;
  
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCategoryData {
    name: string;
    merchantId: number;
}

export interface UpdateCategoryData {
    name?: string;
   
}

// Get all categories for a merchant
export async function getCategoriesByMerchant(merchantId: number): Promise<Category[]> {
    const categories = await db.select().from(category).where(eq(category.merchantId, merchantId)).orderBy(desc(category.createdAt));
    return categories;
}

// Get categories with pagination
export async function getCategoriesByMerchantPaginated(merchantId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    
    const categories = await db
        .select()
        .from(category)
        .where(eq(category.merchantId, merchantId))
        .orderBy(desc(category.createdAt))
        .limit(limit)
        .offset(offset);
    
    const totalResult = await db
        .select({ count: category.id })
        .from(category)
        .where(eq(category.merchantId, merchantId));
    
    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);
    
    return {
        items: categories,
        total,
        page,
        limit,
        totalPages
    };
}

// Get category by ID
export async function getCategoryById(categoryId: number): Promise<Category | null> {
    const result = await db.select().from(category).where(eq(category.id, categoryId)).limit(1);
    return result[0] || null;
}

// Create a new category
export async function createCategory(data: CreateCategoryData): Promise<Category> {
    const result = await db.insert(category).values({
        name: data.name,
        merchantId: data.merchantId,
       
    });
    
    const newCategory = await getCategoryById(Number(result[0].insertId));
    if (!newCategory) {
        throw new Error('Failed to create category');
    }
    return newCategory;
}

// Update a category
export async function updateCategory(categoryId: number, data: UpdateCategoryData): Promise<void> {
    await db.update(category).set(data).where(eq(category.id, categoryId));
}

// Delete a category
export async function deleteCategory(categoryId: number): Promise<void> {
    await db.delete(category).where(eq(category.id, categoryId));
}

// Check if category belongs to merchant
export async function verifyCategoryOwnership(categoryId: number, merchantId: number): Promise<boolean> {
    const cat = await db
        .select()
        .from(category)
        .where(and(eq(category.id, categoryId), eq(category.merchantId, merchantId)))
        .limit(1);
    
    return cat.length > 0;
}
