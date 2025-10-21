import type { PageServerLoadEvent } from "../../../routes/$types";


export function checkLoginRedirect(event: PageServerLoadEvent, redirect: (code: number, to: string) => void) {
    if (event.locals.session === null || event.locals.user === null) {
       return redirect(302, "/auth/login");
    }
    if (!event.locals.user.emailVerified) {
        return redirect(302, "/auth/verify-email");
    }
    if (!event.locals.user.registered2FA) {
        return redirect(302, "/auth/2fa/setup");
    }
    if (!event.locals.session.twoFactorVerified) {
        return redirect(302, "/auth/2fa");
    }
}