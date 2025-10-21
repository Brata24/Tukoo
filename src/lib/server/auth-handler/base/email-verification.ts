import { generateRandomOTP } from "../utils";
import { db } from "../../db";
import { ExpiringTokenBucket } from "../rate-limit";
import { encodeBase32 } from "@oslojs/encoding";
import { eq, and } from "drizzle-orm";
import { emailVerificationRequest } from "../../db/schema";

import type { RequestEvent } from "@sveltejs/kit";
import { sendOtpEmail } from "$lib/server/utils/email";

export async function getUserEmailVerificationRequest(userId: number, id: string): Promise<EmailVerificationRequest | null> {
    const row = await db.select()
        .from(emailVerificationRequest)
        .where(and(eq(emailVerificationRequest.id, id), eq(emailVerificationRequest.userId, userId)))
        .limit(1);

    if (row.length === 0) {
        return null;
    }

    const request: EmailVerificationRequest = {
        id: row[0].id,
        userId: row[0].userId,
        code: row[0].code,
        email: row[0].email,
        expiresAt: new Date(row[0].expiresAt * 1000)
    };
    return request;
}

export async function createEmailVerificationRequest(userId: number, email: string): Promise<EmailVerificationRequest> {
    await deleteUserEmailVerificationRequest(userId);

    const idBytes = new Uint8Array(20);
    crypto.getRandomValues(idBytes);
    const id = encodeBase32(idBytes).toLowerCase();

    const code = generateRandomOTP();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

    await db.insert(emailVerificationRequest).values({
        id,
        userId,
        code,
        email,
        expiresAt: Math.floor(expiresAt.getTime() / 1000)
    });

    const request: EmailVerificationRequest = {
        id,
        userId,
        code,
        email,
        expiresAt
    };
    return request;
}

export async function deleteUserEmailVerificationRequest(userId: number): Promise<void> {
    await db.delete(emailVerificationRequest).where(eq(emailVerificationRequest.userId, userId));
}

// Overloads to support existing call sites
export function sendVerificationEmail(email: string, code: string, expiresAt?: Date): void;
export function sendVerificationEmail(email: string, fullname: string, code: string, expiresAt?: Date): void;
export function sendVerificationEmail(
    email: string,
    arg2: string,
    arg3?: string | Date,
    arg4?: Date
): void {
    let fullname: string | undefined;
    let code: string;
    let expiresAt: Date | undefined;

    if (arg3 instanceof Date || arg3 === undefined) {
        // Signature: (email, code, expiresAt?)
        code = arg2;
        expiresAt = arg3 as Date | undefined;
    } else {
        // Signature: (email, fullname, code, expiresAt?)
        fullname = arg2;
        code = arg3 as string;
        expiresAt = arg4;
    }

    // Compute remaining minutes from expiresAt Date; default to 10 if not provided
    const minutes = (() => {
        if (!expiresAt) return 10;
        const diffMs = expiresAt.getTime() - Date.now();
        const m = Math.ceil(diffMs / 60000);
        return Math.max(1, m); // ensure at least 1 minute
    })();

    // Fallback name if fullname not provided
    const fallbackName = email.split("@")[0] || "there";
    sendOtpEmail(email, fullname ?? fallbackName, code, minutes);
    console.log(`To ${email}: Your verification code is ${code} (expires in ${minutes} minutes)`);
}

export function setEmailVerificationRequestCookie(event: RequestEvent, request: EmailVerificationRequest): void {
	event.cookies.set("email_verification", request.id, {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		expires: request.expiresAt
	});
}

export function deleteEmailVerificationRequestCookie(event: RequestEvent): void {
	event.cookies.set("email_verification", "", {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		maxAge: 0
	});
}

export async function getUserEmailVerificationRequestFromRequest(event: RequestEvent): Promise<EmailVerificationRequest | null> {
    if (event.locals.user === null) {
        return null;
    }
    const id = event.cookies.get("email_verification") ?? null;
    if (id === null) {
        return null;
    }
    const request = await getUserEmailVerificationRequest(event.locals.user.id, id);
    if (request === null) {
        deleteEmailVerificationRequestCookie(event);
    }
    return request;
}

export const sendVerificationEmailBucket = new ExpiringTokenBucket<number>(3, 60 * 10);

export interface EmailVerificationRequest {
	id: string;
	userId: number;
	code: string;
	email: string;
	expiresAt: Date;
}
