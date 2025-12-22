import { db } from "../../db";
import { count, eq, sql } from "drizzle-orm";
import { user } from "../../db/schema";

export function verifyEmailInput(email: string): boolean {
	return /^.+@.+\..+$/.test(email) && email.length < 256;
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
    const countrow = await db
        .select({ count: count() })
        .from(user)
        .where(eq(user.email, email));

    if (count.length === 0) {
        throw new Error("Unexpected error");
    }

    return countrow[0].count === 0;
}
