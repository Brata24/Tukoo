import { db } from "../db";
import { decryptToString, encryptString } from "./encryption";
import { ExpiringTokenBucket } from "./rate-limit";
import { generateRandomRecoveryCode } from "./utils";
import { eq, and } from "drizzle-orm";
import { user, session } from "../db/schema";

export const totpBucket = new ExpiringTokenBucket<number>(5, 60 * 30);
export const recoveryCodeBucket = new ExpiringTokenBucket<number>(3, 60 * 60);

export async function resetUser2FAWithRecoveryCode(userId: number, recoveryCode: string): Promise<boolean> {
    // Fetch the user recovery code
    const row = await db.select({ recoveryCode: user.recoveryCode })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    if (row.length === 0) {
        return false;
    }

    const encryptedRecoveryCode = Buffer.from(row[0].recoveryCode, 'base64');
    const userRecoveryCode = decryptToString(encryptedRecoveryCode);

    if (recoveryCode !== userRecoveryCode) {
        return false;
    }

    const newRecoveryCode = generateRandomRecoveryCode();
    const encryptedNewRecoveryCode = encryptString(newRecoveryCode).toString();

    // Update session and user records
    await db.update(session)
        .set({ twoFactorVerified: 0 })
        .where(eq(session.userId, userId));

    const result = await db.update(user)
        .set({ recoveryCode: encryptedNewRecoveryCode, totpKey: null })
        .where(and(eq(user.id, userId), eq(user.recoveryCode, row[0].recoveryCode)));

    // Check if any rows were affected
    return result ? true : false;
}
