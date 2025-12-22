import { redirect } from '@sveltejs/kit';
import { getUserActiveSubscription, canCreateStore } from '$lib/server/subscription.js';

export async function load(event) {
    // Only handle authentication checks - data will be loaded client-side
    if (event.locals.session === null || event.locals.user === null) {
        return redirect(302, "/auth/login");
    }
    if (!event.locals.user.emailVerified) {
        return redirect(302, "/auth/verify-email");
    }

    // Get user's subscription info
    const subscription = await getUserActiveSubscription(event.locals.user.id);
    const storeLimit = await canCreateStore(event.locals.user.id);

    // Return minimal data - actual merchant data will be fetched via API
    return {
        user: event.locals.user,
        subscription: {
            planName: subscription.plan.name,
            currentStores: storeLimit.currentCount,
            maxStores: storeLimit.maxStores,
            canCreate: storeLimit.allowed
        }
    };
};