import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }: any) => {
	
	if (!locals.sessionPos || !locals.userPos) {
		throw redirect(302, '/pos/login');
	}

	return {
		userPos: locals.userPos
	};
};
