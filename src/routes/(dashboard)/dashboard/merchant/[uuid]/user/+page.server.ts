import { redirect, fail } from '@sveltejs/kit';
import { listPosUsersByMerchant, listPosUsersByMerchantPaginated, createPosUser, resetPosPassword, deletePosUser, getPosUserById } from '$lib/server/pos.js';
import { getMerchantByUUID } from '$lib/server/merchant.js';

export async function load(event) {
    if (event.locals.session === null || event.locals.user === null) {
        return redirect(302, '/auth/login');
    }
    const merchant = await getMerchantByUUID(event.params.uuid);
    if (!merchant) return redirect(302, '/dashboard/merchant');

    const url = new URL(event.request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');

    const pag = await listPosUsersByMerchantPaginated(merchant.id, page, limit);

    return { merchant, users: pag.items, pagination: { total: pag.total, page: pag.page, limit: pag.limit, totalPages: pag.totalPages } };
}

export const actions = {
    'add-user': async (event) => {
        const form = await event.request.formData();
        const name = form.get('name');
        const username = form.get('username');
        const password = form.get('password');
        const role = form.get('role') || 'staff';

        if (!name || typeof name !== 'string' || !username || typeof username !== 'string' || !password || typeof password !== 'string') {
            return fail(400, { message: 'Invalid input' });
        }

        const merchant = await getMerchantByUUID(event.params.uuid);
        if (!merchant) return fail(404, { message: 'Merchant not found' });

        try {
            await createPosUser({ name: name.trim(), username: username.trim(), password: password as string, role: role as string, merchantId: merchant.id });
            return { success: true };
        } catch (err) {
            console.error(err);
            return fail(500, { message: 'Failed to create user' });
        }
    },
    'reset-password': async (event) => {
        const form = await event.request.formData();
        const userId = form.get('userId');
        const newPassword = form.get('newPassword');

        if (!userId || !newPassword) return fail(400, { message: 'Invalid input' });

        try {
            await resetPosPassword(Number(userId), newPassword as string);
            return { success: true };
        } catch (err) {
            console.error(err);
            return fail(500, { message: 'Failed to reset password' });
        }
    },
    'delete-user': async (event) => {
        const form = await event.request.formData();
        const userId = form.get('userId');
        if (!userId) return fail(400, { message: 'Invalid input' });

        try {
            await deletePosUser(Number(userId));
            return { success: true };
        } catch (err) {
            console.error(err);
            return fail(500, { message: 'Failed to delete user' });
        }
    }
};
