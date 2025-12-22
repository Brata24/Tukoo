import path from 'path';
import { Readable } from 'stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { getS3Client, s3Config } from './s3-client';

const MIME_MAP: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

const sanitizeSegments = (segments: string[]): string[] =>
    segments
        .map((segment) => segment.trim().replace(/\\/g, '/'))
        .filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..');

const guessContentType = (filePath: string): string => {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_MAP[ext] ?? 'application/octet-stream';
};

const toReadableStream = (body: GetObjectCommandOutput['Body']): ReadableStream<Uint8Array> => {
    if (!body) {
        throw new Error('S3 object body is empty');
    }

    if (body instanceof Readable) {
        return Readable.toWeb(body) as ReadableStream<Uint8Array>;
    }

    if (body instanceof Uint8Array) {
        return new ReadableStream({
            start(controller) {
                controller.enqueue(body);
                controller.close();
            }
        });
    }

    if (typeof body === 'string') {
        const buffer = Buffer.from(body);
        return new ReadableStream({
            start(controller) {
                controller.enqueue(buffer);
                controller.close();
            }
        });
    }

    if (typeof Blob !== 'undefined' && body instanceof Blob) {
        return body.stream() as ReadableStream<Uint8Array>;
    }

    const candidate = body as unknown;
    if (typeof candidate === 'object' && candidate !== null && Symbol.asyncIterator in candidate) {
        return Readable.toWeb(Readable.from(candidate as AsyncIterable<Uint8Array>)) as ReadableStream<Uint8Array>;
    }

    throw new Error('Unsupported S3 body type');
};

const tryServeS3File = async (relativeKey: string): Promise<Response | null> => {
    const client = getS3Client();
    try {
        const result = await client.send(
            new GetObjectCommand({
                Bucket: s3Config.bucketName,
                Key: relativeKey
            })
        );
        if (!result.Body) {
            return null;
        }

        const headers = new Headers();
        headers.set('Cache-Control', result.CacheControl ?? 'public, max-age=3600');
        headers.set('Content-Type', result.ContentType ?? guessContentType(relativeKey));
        if (typeof result.ContentLength === 'number') {
            headers.set('Content-Length', result.ContentLength.toString());
        }

        return new Response(toReadableStream(result.Body), { headers });
    } catch (error) {
        const statusCode = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
        if (statusCode === 404) {
            return null;
        }
        throw error;
    }
};

const serveByKey = async (relativeKey: string): Promise<Response> => {
    try {
        const remoteResponse = await tryServeS3File(relativeKey);
        if (remoteResponse) {
            return remoteResponse;
        }
    } catch (error) {
        console.error('Failed to fetch file from S3:', relativeKey, error);
        return new Response('Failed to retrieve file', { status: 500 });
    }

    return new Response('File not found', { status: 404 });
};

export async function serveStoredPath(path: string): Promise<Response> {
    const safeSegments = sanitizeSegments(path.split('/'));
    if (safeSegments.length === 0) {
        return new Response('File not found', { status: 404 });
    }
    return serveByKey(safeSegments.join('/'));
}

/**
 * Serve a stored file through the remote bucket.
 */
