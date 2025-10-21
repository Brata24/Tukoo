import { db } from "../db";
import { decrypt, decryptToString, encrypt, encryptString } from "./encryption";
import { hashPassword } from "./base/password";
import { generateRandomRecoveryCode } from "./utils";
import { eq, and } from 'drizzle-orm';
import { user } from '../db/schema';

export function verifyUsernameInput(username: string): boolean {
	return username.length > 3 && username.length < 32 && username.trim() === username;
}

export async function createUser(email: string, username: string, password: string, fullName: string, phoneNumber: string, twoFactorEnabled: boolean): Promise<User> {
    const passwordHash = await hashPassword(password);
    const recoveryCode = generateRandomRecoveryCode();
    const encryptedRecoveryCode = Buffer.from(encryptString(recoveryCode)).toString('base64');

    const newUserId = (await db.insert(user).values({
        email,
        username,
        passwordHash,
        recoveryCode: encryptedRecoveryCode,
        fullName,
        phoneNumber,
        twoFactorEnabled: Number(twoFactorEnabled)
    }).$returningId())[0].id;

    if (!newUserId) {
        throw new Error("Unexpected error");
    }

    return {
        id: newUserId,
        username,
        email,
        emailVerified: false,
        registered2FA: false,
        enabled2FA: twoFactorEnabled,
        fullName,
        phoneNumber,
        profile_picture: ''
    };
}

export async function updateUserPassword(userId: number, password: string): Promise<void> {
    const passwordHash = await hashPassword(password);
    await db.update(user).set({ passwordHash }).where(eq(user.id, userId));
}

export async function updateUserEmailAndSetEmailAsVerified(userId: number, email: string): Promise<void> {
    await db.update(user).set({ email, emailVerified: 1 }).where(eq(user.id, userId));
}

export async function setUserAsEmailVerifiedIfEmailMatches(userId: number, email: string): Promise<boolean> {
    const result = await db.update(user).set({ emailVerified: 1 }).where(and(eq(user.id, userId), eq(user.email, email)));
    return result.length > 0;
}

export async function getUserPasswordHash(userId: number): Promise<string> {
    const result = await db.select({ passwordHash: user.passwordHash }).from(user).where(eq(user.id, userId));
    if (result.length === 0) {
        throw new Error("Invalid user ID");
    }
    return result[0].passwordHash;
}

export async function getUserRecoverCode(userId: number): Promise<string> {
    const result = await db.select({ recoveryCode: user.recoveryCode }).from(user).where(eq(user.id, userId));
    if (result.length === 0) {
        throw new Error("Invalid user ID");
    }
	
    const recoveryCode = decryptToString(Buffer.from(result[0].recoveryCode, 'base64'));
    
    return recoveryCode;
}

export async function getUserTOTPKey(userId: number): Promise<Uint8Array | null> {
    const result = await db.select({ totpKey: user.totpKey }).from(user).where(eq(user.id, userId));
    if (result.length === 0) {
        throw new Error("Invalid user ID");
    }
    const encrypted = result[0].totpKey;
    return encrypted ? decrypt(Buffer.from(encrypted, 'base64')) : null;
}

export async function updateUserTOTPKey(userId: number, key: Uint8Array): Promise<void> {
    const encrypted = Buffer.from(encrypt(key)).toString('base64');
    await db.update(user).set({ totpKey: encrypted }).where(eq(user.id, userId));
}


export async function updateUser2FASettings(userId: number, status: boolean): Promise<void> {
    await db.update(user).set({ twoFactorEnabled: Number(status) }).where(eq(user.id, userId));
}

export async function updateUserProfile(userId: number, data: { fullName?: string; email?: string; phoneNumber?: string; profile_picture?: string }): Promise<void> {
    const updateData: any = {};
    
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.profile_picture !== undefined) updateData.profile_picture = data.profile_picture;
    
    if (Object.keys(updateData).length > 0) {
        await db.update(user).set(updateData).where(eq(user.id, userId));
    }
}

export async function resetUserRecoveryCode(userId: number): Promise<string> {
    const recoveryCode = generateRandomRecoveryCode();
    const encrypted = Buffer.from(encryptString(recoveryCode)).toString('base64');
    await db.update(user).set({ recoveryCode: encrypted }).where(eq(user.id, userId));
    return recoveryCode;
}

export async function getUserFromEmail(email: string): Promise<User | null> {
    const result = await db.select({
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: user.emailVerified,
        totpKey: user.totpKey,
        twoFactorEnabled: user.twoFactorEnabled,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        profile_picture: user.profile_picture
    }).from(user).where(eq(user.email, email));

    if (result.length === 0) {
        return null;
    }

    const row = result[0];
    return {
        id: row.id,
        email: row.email,
        username: row.username,
        emailVerified: Boolean(row.emailVerified),
        registered2FA: row.totpKey != null,
        enabled2FA: Boolean(row.twoFactorEnabled),
        fullName: row.fullName,
        phoneNumber: row.phoneNumber,
        profile_picture: row.profile_picture
    };
}

export interface User {
	id: number;
	email: string;
	username: string;
	emailVerified: boolean;
	registered2FA: boolean;
    enabled2FA: boolean;
    fullName: string;
    phoneNumber: string;
    profile_picture: string;
}
