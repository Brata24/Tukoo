import { serveStoredPath } from '$lib/server/utils/file-response';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    return serveStoredPath(params.file);
};
