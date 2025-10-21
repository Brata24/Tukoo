import { fail, redirect } from "@sveltejs/kit";
import { deleteSessionTokenCookie, invalidateSession } from "$lib/server/auth-handler/session";

import type { Actions, RequestEvent } from "./$types";

export const actions: Actions = {
    logout: actionLogout
};

async function actionLogout(event: RequestEvent) {
    if (event.locals.sessionPos === null) {
        return fail(401, {
            message: "Not authenticated"
        });
    }
    invalidateSession(event.locals.sessionPos.id);
    deleteSessionTokenCookie(event);
    return redirect(302, "/auth/login");
}
