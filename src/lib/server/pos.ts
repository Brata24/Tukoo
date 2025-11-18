import { db } from './db/index.js';
import { userPos, sessionPos } from './db/schema.js';
import { eq, count } from 'drizzle-orm';
import { hashPassword, verifyPasswordHash } from './auth-handler/base/password.js';
import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding';

export interface PosUserData {
    id: number;
    name: string;
    username: string;
    password: string;
    role?: string;
    merchantId: number;
}

export async function listPosUsersByMerchant(merchantId: number) {
    return await db.select().from(userPos).where(eq(userPos.merchantId, merchantId));
}

export async function listPosUsersByMerchantPaginated(merchantId: number, page = 1, limit = 10) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));

    // total count
    const totalRow = await db.select({ total: count() }).from(userPos).where(eq(userPos.merchantId, merchantId));
    const total = (totalRow?.[0]?.total as number) || 0;

    const items = await db
        .select()
        .from(userPos)
        .where(eq(userPos.merchantId, merchantId))
        .orderBy(userPos.id)
        .limit(safeLimit)
        .offset((safePage - 1) * safeLimit);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
        items,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages
    };
}

export async function createPosUser(data: PosUserData) {
    const hashed = await hashPassword(data.password);
    await db.insert(userPos).values({
        name: data.name,
        username: data.username,
        password: hashed,
        role: data.role || 'staff',
        merchantId: data.merchantId
    });
}

export async function getPosUserById(id: number) {
    const res = await db.select().from(userPos).where(eq(userPos.id, id)).limit(1);
    return res.length ? res[0] : null;
}

export async function resetPosPassword(id: number, newPassword: string) {
    const hashed = await hashPassword(newPassword);
    await db.update(userPos).set({ password: hashed }).where(eq(userPos.id, id));
}

export async function deletePosUser(id: number) {
    await db.delete(userPos).where(eq(userPos.id, id));
}

export async function getPosUserByUsername(username: string) {
    const res = await db.select().from(userPos).where(eq(userPos.username, username)).limit(1);
    return res.length ? res[0] : null;
}

export async function verifyPosUserPassword(username: string, password: string): Promise<{ success: boolean; user?: any }> {
    const user = await getPosUserByUsername(username);
    if (!user) {
        return { success: false };
    }

    const validPassword = await verifyPasswordHash(user.password, password);
    if (!validPassword) {
        return { success: false };
    }

    return { success: true, user };
}

// POS Session Management
export function generatePosSessionToken(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return encodeBase32LowerCaseNoPadding(bytes);
}

export async function createPosSession(token: string, userPosId: number): Promise<{ id: string; userPosId: number; expiresAt: Date }> {
    // Session expires in 30 days - create as Date object like regular sessions
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    
    // Update last login timestamp
    await db.update(userPos).set({ lastLogin: new Date() }).where(eq(userPos.id, userPosId));
    
    await db.insert(sessionPos).values({
        id: token,
        userPosId,
        expiresAt: Math.floor(expiresAt.getTime() / 1000) // Store as timestamp in DB
    });

    return {
        id: token,
        userPosId,
        expiresAt // Return as Date object
    };
}

export async function validatePosSessionToken(token: string): Promise<{ session: any; user: any } | null> {
    const result = await db
        .select({
            session: sessionPos,
            user: userPos
        })
        .from(sessionPos)
        .innerJoin(userPos, eq(sessionPos.userPosId, userPos.id))
        .where(eq(sessionPos.id, token))
        .limit(1);

    if (result.length === 0) {
        return null;
    }

    const { session, user } = result[0];

    
    if (Date.now() / 1000 >= session.expiresAt) {
        await invalidatePosSession(token);
        return null;
    }

    
    return { 
        session: {
            ...session,
            expiresAt: new Date(session.expiresAt * 1000)
        }, 
        user 
    };
}

export async function invalidatePosSession(sessionId: string): Promise<void> {
    await db.delete(sessionPos).where(eq(sessionPos.id, sessionId));
}

export async function invalidateAllPosUserSessions(userPosId: number): Promise<void> {
    await db.delete(sessionPos).where(eq(sessionPos.userPosId, userPosId));
}
