import { redirect } from '@sveltejs/kit';

export async function load(event) {
    // Only handle authentication checks - data will be loaded client-side
    if (event.locals.session === null || event.locals.user === null) {
        return redirect(302, "/auth/login");
    }
    if (!event.locals.user.emailVerified) {
        return redirect(302, "/auth/verify-email");
    }

    // Return minimal data - actual merchant data will be fetched via API
    return {
        user: event.locals.user
    };
};