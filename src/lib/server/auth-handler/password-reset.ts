import { db } from "../db";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { generateRandomOTP } from "./utils";
import { sha256 } from "@oslojs/crypto/sha2";
import { eq, and } from "drizzle-orm";
import { passwordResetSession, user } from "../db/schema";

import type { RequestEvent } from "@sveltejs/kit";
import type { User } from "./user";
import { sendOtpReset } from "../utils/email";

export async function createPasswordResetSession(token: string, userId: number, email: string): Promise<PasswordResetSession> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session: PasswordResetSession = {
        id: sessionId,
        userId,
        email,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        code: generateRandomOTP(),
        emailVerified: false,
        twoFactorVerified: false
    };

    await db.insert(passwordResetSession).values({
        id: session.id,
        userId: session.userId,
        email: session.email,
        code: session.code,
        expiresAt: Math.floor(session.expiresAt.getTime() / 1000),
        emailVerified: session.emailVerified ? 1 : 0,
        twoFactorVerified: session.twoFactorVerified ? 1 : 0
    });

    return session;
}

export async function validatePasswordResetSessionToken(token: string): Promise<PasswordResetSessionValidationResult> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

    const rows = await db.select({
        sessionId: passwordResetSession.id,
        sessionUserId: passwordResetSession.userId,
        sessionEmail: passwordResetSession.email,
        sessionCode: passwordResetSession.code,
        sessionExpiresAt: passwordResetSession.expiresAt,
        sessionEmailVerified: passwordResetSession.emailVerified,
        sessionTwoFactorVerified: passwordResetSession.twoFactorVerified,
        userId: user.id,
        userEmail: user.email,
        userUsername: user.username,
        userEmailVerified: user.emailVerified,
        userRegistered2FA: user.totpKey
    })
        .from(passwordResetSession)
        .innerJoin(user, eq(passwordResetSession.userId, user.id))
        .where(eq(passwordResetSession.id, sessionId));

    if (rows.length === 0) {
        return { session: null, user: null };
    }

    const row = rows[0];

    const session: PasswordResetSession = {
        id: row.sessionId,
        userId: row.sessionUserId,
        email: row.sessionEmail,
        code: row.sessionCode,
        expiresAt: new Date(row.sessionExpiresAt * 1000),
        emailVerified: Boolean(row.sessionEmailVerified),
        twoFactorVerified: Boolean(row.sessionTwoFactorVerified)
    };

    const userData: User = {
        id: row.userId,
        email: row.userEmail,
        username: row.userUsername,
        emailVerified: Boolean(row.userEmailVerified),
        registered2FA: Boolean(row.userRegistered2FA),
        enabled2FA: false,
        fullName: "",
        phoneNumber: "",
        profile_picture: ""
    };

    if (Date.now() >= session.expiresAt.getTime()) {
        await db.delete(passwordResetSession).where(eq(passwordResetSession.id, session.id));
        return { session: null, user: null };
    }

    return { session, user: userData};
}

export async function setPasswordResetSessionAsEmailVerified(sessionId: string): Promise<void> {
    await db.update(passwordResetSession)
        .set({ emailVerified: 1 })
        .where(eq(passwordResetSession.id, sessionId));
}

export async function setPasswordResetSessionAs2FAVerified(sessionId: string): Promise<void> {
    await db.update(passwordResetSession)
        .set({ twoFactorVerified: 1 })
        .where(eq(passwordResetSession.id, sessionId));
}

export async function invalidateUserPasswordResetSessions(userId: number): Promise<void> {
    await db.delete(passwordResetSession).where(eq(passwordResetSession.userId, userId));
}

export async function validatePasswordResetSessionRequest(event: RequestEvent): Promise<PasswordResetSessionValidationResult> {
    const token = event.cookies.get("password_reset_session") ?? null;
    if (token === null) {
        return { session: null, user: null };
    }
    const result = await validatePasswordResetSessionToken(token);
    if (result.session === null) {
        deletePasswordResetSessionTokenCookie(event);
    }
    return result;
}

export function setPasswordResetSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set("password_reset_session", token, {
		expires: expiresAt,
		sameSite: "lax",
		httpOnly: true,
		path: "/",
		secure: !import.meta.env.DEV
	});
}

export function deletePasswordResetSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set("password_reset_session", "", {
		maxAge: 0,
		sameSite: "lax",
		httpOnly: true,
		path: "/",
		secure: !import.meta.env.DEV
	});
}

export function sendPasswordResetEmail(email: string, code: string, expiresAt: Date, username: string): void {
    const minutes = (() => {
        if (!expiresAt) return 10;
        const diffMs = expiresAt.getTime() - Date.now();
        const m = Math.ceil(diffMs / 60000);
        return Math.max(1, m); // ensure at least 1 minute
    })();
    sendOtpReset(email, username, code, minutes);
	console.log(`To ${email}: Your reset code is ${code}`);
}

export interface PasswordResetSession {
	id: string;
	userId: number;
	email: string;
	expiresAt: Date;
	code: string;
	emailVerified: boolean;
	twoFactorVerified: boolean;
}

export type PasswordResetSessionValidationResult =
	| { session: PasswordResetSession; user: User }
	| { session: null; user: null };
