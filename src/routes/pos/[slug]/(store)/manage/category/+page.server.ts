import { redirect, fail } from '@sveltejs/kit';
import { createCategory, updateCategory, deleteCategory, verifyCategoryOwnership } from '$lib/server/category.js';

export async function load(event) {
    if (event.locals.sessionPos === null || event.locals.userPos === null) {
        return redirect(302, `/pos/${event.params.slug}/auth/login`);
    }

    return { 
      
    };
}

export const actions = {
    'add-category': async (event) => {
        if (event.locals.sessionPos === null || event.locals.userPos === null) {
            return fail(401, { message: 'Unauthorized' });
        }

        const form = await event.request.formData();
        const name = form.get('name');

        if (!name || typeof name !== 'string') {
            return fail(400, { message: 'Invalid input' });
        }

        const merchantId = event.locals.userPos.merchantId;

        try {
            await createCategory({ 
                name: name.trim(), 
                merchantId 
            });
            return { success: true };
        } catch (err) {
            console.error(err);
            return fail(500, { message: 'Failed to create category' });
        }
    },
    'edit-category': async (event) => {
        if (event.locals.sessionPos === null || event.locals.userPos === null) {
            return fail(401, { message: 'Unauthorized' });
        }

        const form = await event.request.formData();
        const categoryId = form.get('categoryId');
        const name = form.get('name');

        if (!categoryId || !name || typeof name !== 'string') {
            return fail(400, { message: 'Invalid input' });
        }

        const merchantId = event.locals.userPos.merchantId;

        // Verify ownership
        const isOwner = await verifyCategoryOwnership(Number(categoryId), merchantId);
        if (!isOwner) {
            return fail(403, { message: 'Forbidden' });
        }

        try {
            await updateCategory(Number(categoryId), { 
                name: name.trim()
            });
            return { success: true };
        } catch (err) {
            console.error(err);
            return fail(500, { message: 'Failed to update category' });
        }
    },
    'delete-category': async (event) => {
        if (event.locals.sessionPos === null || event.locals.userPos === null) {
            return fail(401, { message: 'Unauthorized' });
        }

        const form = await event.request.formData();
        const categoryId = form.get('categoryId');

        if (!categoryId) {
            return fail(400, { message: 'Invalid input' });
        }

        const merchantId = event.locals.userPos.merchantId;

        // Verify ownership
        const isOwner = await verifyCategoryOwnership(Number(categoryId), merchantId);
        if (!isOwner) {
            return fail(403, { message: 'Forbidden' });
        }

        try {
            await deleteCategory(Number(categoryId));
            return { success: true };
        } catch (err) {
            console.error(err);
            return fail(500, { message: 'Failed to delete category' });
        }
    }
};
