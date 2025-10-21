import { db } from './db/index.js';
import { merchant } from './db/schema.js';
import { eq } from 'drizzle-orm';

export interface MerchantData {
    name: string;
    slug: string;
    address: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    primaryTextColor: string;
    secondaryTextColor: string;
    slogan: string;
    userId: number;
}

export interface Merchant {
    id: number;
    name: string;
    slug: string;
    address: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    primaryTextColor: string;
    secondaryTextColor: string;
    slogan: string;
    userId: number;
    isActive: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Create a new merchant
 */
export async function createMerchant(merchantData: MerchantData): Promise<void> {
    await db.insert(merchant).values({
        name: merchantData.name,
        slug: merchantData.slug,
        address: merchantData.address,
        logo: merchantData.logo,
        primaryColor: merchantData.primaryColor,
        secondaryColor: merchantData.secondaryColor,
        primaryTextColor: merchantData.primaryTextColor,
        secondaryTextColor: merchantData.secondaryTextColor,
        slogan: merchantData.slogan,
        userId: merchantData.userId,
        isActive: 1
    });
}

/**
 * Get merchant by slug
 */
export async function getMerchantBySlug(slug: string) {
    const result = await db.select()
        .from(merchant)
        .where(eq(merchant.slug, slug))
        .limit(1);

    return result.length > 0 ? result[0] : null;
}

/**
 * Get merchant by ID
 */
export async function getMerchantById(id: number) {
    const result = await db.select()
        .from(merchant)
        .where(eq(merchant.id, id))
        .limit(1);

    return result.length > 0 ? result[0] : null;
}


export async function getMerchantByUUID(uuid: string) {
    const result = await db.select()
        .from(merchant)
        .where(eq(merchant.uuid, uuid))
        .limit(1);

    return result.length > 0 ? result[0] : null;
}



/**
 * Get all merchants for a user
 */
export async function getMerchantsByUserId(userId: number) {
    const result = await db.select()
        .from(merchant)
        .where(eq(merchant.userId, userId));

    return result;
}

/**
 * Update merchant
 */
export async function updateMerchant(id: number, merchantData: Partial<MerchantData>): Promise<void> {
    await db.update(merchant)
        .set(merchantData)
        .where(eq(merchant.id, id));
}

/**
 * Delete merchant (soft delete by setting isActive to 0)
 */
export async function deleteMerchant(id: number): Promise<void> {
    await db.update(merchant)
        .set({ isActive: 0 })
        .where(eq(merchant.id, id));
}

/**
 * Permanently delete merchant from database
 */
export async function permanentlyDeleteMerchant(id: number): Promise<void> {
    await db.delete(merchant)
        .where(eq(merchant.id, id));
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
    const result = await db.select({ id: merchant.id })
        .from(merchant)
        .where(eq(merchant.slug, slug))
        .limit(1);

    return result.length === 0;
}

/**
 * Get paginated merchants for a user
 */
export async function getMerchantsPaginated(userId: number, page: number = 1, limit: number = 10, search: string = '') {
    const offset = (page - 1) * limit;
    
    // First get total count
    const totalResult = await db.select({ count: merchant.id })
        .from(merchant)
        .where(eq(merchant.userId, userId));
    
    const totalMerchants = totalResult.length;
    
    // Then get paginated results
    const merchants = await db.select()
        .from(merchant)
        .where(eq(merchant.userId, userId))
        .limit(limit)
        .offset(offset);

    const totalPages = Math.ceil(totalMerchants / limit);

    return {
        merchants,
        pagination: {
            currentPage: page,
            totalPages,
            totalMerchants,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit,
            offset
        }
    };
}