import { db } from "../db";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { eq, and } from "drizzle-orm";
import { session, user } from "../db/schema";

import type { User } from "./user";
import type { RequestEvent } from "@sveltejs/kit";

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const rows = await db.select({
			sessionId: session.id,
			sessionUserId: session.userId,
			sessionExpiresAt: session.expiresAt,
			sessionTwoFactorVerified: session.twoFactorVerified,
			userId: user.id,
			userEmail: user.email,
			userUsername: user.username,
			userEmailVerified: user.emailVerified,
			userRegistered2FA: user.totpKey,
			userEnabled2FA: user.twoFactorEnabled,
			fullName: user.fullName,
			phoneNumber: user.phoneNumber,
			profile_picture: user.profile_picture
		})
			.from(session)
			.innerJoin(user, eq(session.userId, user.id))
			.where(eq(session.id, sessionId));

	
	if (rows.length === 0) {
		return { session: null, user: null };
	}

	const row = rows[0] 

	const sessionData: Session = {
		id: row.sessionId,
		userId: row.sessionUserId,
		expiresAt: new Date(row.sessionExpiresAt * 1000),
		twoFactorVerified: Boolean(row.sessionTwoFactorVerified)
	};

	const userData: User = {
		id: row.userId,
		email: row.userEmail,
		username: row.userUsername,
		emailVerified: Boolean(row.userEmailVerified),
		registered2FA: Boolean(row.userRegistered2FA ?? 0),
		enabled2FA: Boolean(row.userEnabled2FA ?? 0),
		fullName: row.fullName,
		phoneNumber: row.phoneNumber,
		profile_picture: row.profile_picture
	};

	if (Date.now() >= sessionData.expiresAt.getTime()) {
		await db.delete(session).where(eq(session.id, sessionData.id));
		return { session: null, user: null };
	}

	if (Date.now() >= sessionData.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		sessionData.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await db.update(session)
			.set({ expiresAt: Math.floor(sessionData.expiresAt.getTime() / 1000) })
			.where(eq(session.id, sessionData.id));
	}

	return { session: sessionData, user: userData };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(session).where(eq(session.id, sessionId));
}

export async function invalidateUserSessions(userId: number): Promise<void> {
	await db.delete(session).where(eq(session.userId, userId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set("session", token, {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		expires: expiresAt
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set("session", "", {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		maxAge: 0
	});
}

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32LowerCaseNoPadding(tokenBytes).toLowerCase();
	return token;
}

export async function createSession(token: string, userId: number, flags: SessionFlags): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const sessionData: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		twoFactorVerified: flags.twoFactorVerified
	};

	await db.insert(session).values({
		id: sessionData.id,
		userId: sessionData.userId,
		expiresAt: Math.floor(sessionData.expiresAt.getTime() / 1000),
		twoFactorVerified: sessionData.twoFactorVerified ? 1 : 0
	});

	return sessionData;
}

export async function setSessionAs2FAVerified(sessionId: string): Promise<void> {
	await db.update(session)
		.set({ twoFactorVerified: 1 })
		.where(eq(session.id, sessionId));
}

export interface SessionFlags {
	twoFactorVerified: boolean;
}

export interface Session extends SessionFlags {
	id: string;
	expiresAt: Date;
	userId: number;
}

type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
