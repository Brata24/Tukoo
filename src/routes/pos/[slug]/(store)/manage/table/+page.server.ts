import { fail } from '@sveltejs/kit';
import type { Actions, RequestEvent } from '@sveltejs/kit';
import { 
	getTablesByMerchant, 
	createTable, 
	updateTable, 
	deleteTable, 
	regenerateQrToken,
	toggleTableStatus,
	togglePayAtCashier,
	generateTableQrUrl 
} from '$lib/server/table';

export const load = async (event: any) => {
	const merchant = event.locals.merchant;
	const merchantId = event.locals.userPos?.merchantId;

	if (!merchantId || !merchant) {
		return { 
			merchant: null, 
			tables: [],
			qrBaseUrl: ''
		};
	}

	const tables = await getTablesByMerchant(merchantId);
	const qrBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

	return {
		merchant,
		tables: tables.map(table => ({
			...table,
			qrUrl: generateTableQrUrl(merchant.slug, table.qrToken)
		})),
		qrBaseUrl
	};
};

export const actions: Actions = {
	'create-table': async (event) => {
		try {
			const merchantId = event.locals.userPos?.merchantId;
			if (!merchantId) {
				return fail(401, { message: 'Unauthorized' });
			}

			const formData = await event.request.formData();
			const name = formData.get('name') as string;
			const capacity = parseInt(formData.get('capacity') as string);
			const allowPayAtCashier = formData.get('allowPayAtCashier') === 'true' ? 1 : 0;

			if (!name || !capacity || capacity < 1) {
				return fail(400, { message: 'Name and valid capacity are required' });
			}

			await createTable({
				name,
				capacity,
				allowPayAtCashier,
				merchantId
			});

			return { success: true, message: 'Table created successfully' };
		} catch (error) {
			console.error('Error creating table:', error);
			return fail(500, { message: 'Failed to create table' });
		}
	},

	'update-table': async (event) => {
		try {
			const merchantId = event.locals.userPos?.merchantId;
			if (!merchantId) {
				return fail(401, { message: 'Unauthorized' });
			}

			const formData = await event.request.formData();
			const id = parseInt(formData.get('id') as string);
			const name = formData.get('name') as string;
			const capacity = parseInt(formData.get('capacity') as string);
			const allowPayAtCashier = formData.get('allowPayAtCashier') === 'true' ? 1 : 0;

			if (!id || !name || !capacity || capacity < 1) {
				return fail(400, { message: 'Valid ID, name and capacity are required' });
			}

			await updateTable(id, {
				name,
				capacity,
				allowPayAtCashier
			});

			return { success: true, message: 'Table updated successfully' };
		} catch (error) {
			console.error('Error updating table:', error);
			return fail(500, { message: 'Failed to update table' });
		}
	},

	'delete-table': async (event) => {
		try {
			const merchantId = event.locals.userPos?.merchantId;
			if (!merchantId) {
				return fail(401, { message: 'Unauthorized' });
			}

			const formData = await event.request.formData();
			const id = parseInt(formData.get('id') as string);

			if (!id) {
				return fail(400, { message: 'Table ID is required' });
			}

			await deleteTable(id);

			return { success: true, message: 'Table deleted successfully' };
		} catch (error) {
			console.error('Error deleting table:', error);
			return fail(500, { message: 'Failed to delete table' });
		}
	},

	'regenerate-qr': async (event) => {
		try {
			const merchantId = event.locals.userPos?.merchantId;
			const merchant = event.locals.merchant;
			if (!merchantId || !merchant) {
				return fail(401, { message: 'Unauthorized' });
			}

			const formData = await event.request.formData();
			const id = parseInt(formData.get('id') as string);

			if (!id) {
				return fail(400, { message: 'Table ID is required' });
			}

			const newToken = await regenerateQrToken(id);
			const newQrUrl = generateTableQrUrl(merchant.slug, newToken);

			return { 
				success: true, 
				message: 'QR code regenerated successfully',
				newQrUrl
			};
		} catch (error) {
			console.error('Error regenerating QR:', error);
			return fail(500, { message: 'Failed to regenerate QR code' });
		}
	},

	'toggle-status': async (event) => {
		try {
			const merchantId = event.locals.userPos?.merchantId;
			if (!merchantId) {
				return fail(401, { message: 'Unauthorized' });
			}

			const formData = await event.request.formData();
			const id = parseInt(formData.get('id') as string);

			if (!id) {
				return fail(400, { message: 'Table ID is required' });
			}

			await toggleTableStatus(id);

			return { success: true, message: 'Table status updated successfully' };
		} catch (error) {
			console.error('Error toggling status:', error);
			return fail(500, { message: 'Failed to update table status' });
		}
	},

	'toggle-pay-cashier': async (event) => {
		try {
			const merchantId = event.locals.userPos?.merchantId;
			if (!merchantId) {
				return fail(401, { message: 'Unauthorized' });
			}

			const formData = await event.request.formData();
			const id = parseInt(formData.get('id') as string);

			if (!id) {
				return fail(400, { message: 'Table ID is required' });
			}

			await togglePayAtCashier(id);

			return { success: true, message: 'Payment option updated successfully' };
		} catch (error) {
			console.error('Error toggling payment option:', error);
			return fail(500, { message: 'Failed to update payment option' });
		}
	}
};