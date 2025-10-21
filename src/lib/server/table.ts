import { db } from './db';
import { restaurantTable } from './db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface RestaurantTable {
	id: number;
	uuid: string;
	name: string;
	capacity: number;
	qrToken: string;
	isActive: number;
	allowPayAtCashier: number;
	merchantId: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateTableData {
	name: string;
	capacity: number;
	allowPayAtCashier: number;
	merchantId: number;
}

export interface UpdateTableData {
	name?: string;
	capacity?: number;
	isActive?: number;
	allowPayAtCashier?: number;
}

/**
 * Get all tables for a merchant
 */
export async function getTablesByMerchant(merchantId: number): Promise<RestaurantTable[]> {
	return await db.select().from(restaurantTable)
		.where(eq(restaurantTable.merchantId, merchantId))
		.orderBy(restaurantTable.name);
}

/**
 * Get table by ID
 */
export async function getTableById(id: number): Promise<RestaurantTable | null> {
	const result = await db.select().from(restaurantTable)
		.where(eq(restaurantTable.id, id))
		.limit(1);
	return result[0] || null;
}

/**
 * Get table by QR token
 */
export async function getTableByQrToken(qrToken: string): Promise<RestaurantTable | null> {
	const result = await db.select().from(restaurantTable)
		.where(eq(restaurantTable.qrToken, qrToken))
		.limit(1);
	return result[0] || null;
}

/**
 * Create a new table
 */
export async function createTable(data: CreateTableData): Promise<RestaurantTable> {
	const result = await db.insert(restaurantTable).values(data);
	const insertedTable = await getTableById(Number(result[0].insertId));
	return insertedTable!;
}

/**
 * Update table information
 */
export async function updateTable(id: number, data: UpdateTableData): Promise<void> {
	await db.update(restaurantTable)
		.set(data)
		.where(eq(restaurantTable.id, id));
}

/**
 * Regenerate QR token for security
 */
export async function regenerateQrToken(id: number): Promise<string> {
	const newToken = uuidv4();
	await db.update(restaurantTable)
		.set({ qrToken: newToken })
		.where(eq(restaurantTable.id, id));
	return newToken;
}

/**
 * Delete a table
 */
export async function deleteTable(id: number): Promise<void> {
	await db.delete(restaurantTable)
		.where(eq(restaurantTable.id, id));
}

/**
 * Toggle table active status
 */
export async function toggleTableStatus(id: number): Promise<void> {
	const table = await getTableById(id);
	if (table) {
		const newStatus = table.isActive ? 0 : 1;
		await updateTable(id, { isActive: newStatus });
	}
}

/**
 * Toggle "Pay at Cashier" option
 */
export async function togglePayAtCashier(id: number): Promise<void> {
	const table = await getTableById(id);
	if (table) {
		const newStatus = table.allowPayAtCashier ? 0 : 1;
		await updateTable(id, { allowPayAtCashier: newStatus });
	}
}

/**
 * Generate QR code URL for table
 */
export function generateTableQrUrl(merchantSlug: string, qrToken: string): string {
	// This would be your domain - adjust accordingly
	const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
	return `${baseUrl}/pos/${merchantSlug}/order/${qrToken}`;
}