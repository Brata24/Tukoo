import { S3Client, type ObjectCannedACL } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

type RequiredEnvValue = string & { __brand: 'RequiredEnvValue' };

const requireEnv = (key: string, value: string | undefined): RequiredEnvValue => {
    if (!value || value.length === 0) {
        throw new Error(`${key} is not set`);
    }
    return value as RequiredEnvValue;
};

const accessKeyId = requireEnv('S3_ACCESS_KEY_ID', env.S3_ACCESS_KEY_ID);
const secretAccessKey = requireEnv('S3_SECRET_ACCESS_KEY', env.S3_SECRET_ACCESS_KEY);
const bucketName = requireEnv('S3_BUCKET', env.S3_BUCKET);

const endpoint = env.S3_ENDPOINT?.replace(/\/+$/, '');
const hasCustomEndpoint = Boolean(endpoint);
const specifiedRegion = env.S3_REGION && env.S3_REGION.length > 0 ? env.S3_REGION : undefined;
const region = specifiedRegion ?? (hasCustomEndpoint ? 'us-east-1' : requireEnv('S3_REGION', env.S3_REGION));
const forcePathStyle = env.S3_FORCE_PATH_STYLE
    ? env.S3_FORCE_PATH_STYLE === 'true'
    : hasCustomEndpoint && !endpoint?.includes('amazonaws.com');
const objectAclValue = env.S3_OBJECT_ACL && env.S3_OBJECT_ACL.length > 0 ? env.S3_OBJECT_ACL : undefined;
const objectAcl = objectAclValue as ObjectCannedACL | undefined;

const fallbackAwsUrl = `https://${bucketName}.s3.${region}.amazonaws.com`;
const cdnBaseUrl = (env.S3_PUBLIC_URL ?? env.S3_CDN_URL ?? (hasCustomEndpoint ? endpoint : fallbackAwsUrl))?.replace(/\/+$/, '') ?? fallbackAwsUrl;

const storagePathRaw = env.STORAGE_PUBLIC_PATH ?? '/storage';
const normalizedStorageBasePath = (() => {
    const prefixed = storagePathRaw.startsWith('/') ? storagePathRaw : `/${storagePathRaw}`;
    const trimmed = prefixed.replace(/\/+$/, '');
    return trimmed.length > 0 ? trimmed : '/storage';
})();

let client: S3Client | null = null;

export const s3Config = {
    bucketName,
    region,
    cdnBaseUrl,
    storageBasePath: normalizedStorageBasePath,
    objectAcl
};

export function getS3Client(): S3Client {
    if (!client) {
        client = new S3Client({
            region,
            endpoint,
            forcePathStyle,
            credentials: {
                accessKeyId,
                secretAccessKey
            }
        });
    }
    return client;
}

export function buildPublicUrl(key: string): string {
    const normalizedKey = key.replace(/^\/+/, '');
    const basePath = s3Config.storageBasePath;
    return `${basePath}/${normalizedKey}`;
}

export function extractStorageKeyFromUrl(urlOrKey: string): string | null {
    if (!urlOrKey) {
        return null;
    }
    const trimmed = urlOrKey.trim();
    if (trimmed.length === 0) {
        return null;
    }

    const normalizePath = (value: string) => value.replace(/^\/+/, '');

    const stripPrefix = (value: string, prefix: string | null | undefined) => {
        if (!prefix) return null;
        const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
        if (value.startsWith(normalizedPrefix)) {
            return value.slice(normalizedPrefix.length).replace(/^\/+/, '');
        }
        if (value === prefix) {
            return '';
        }
        return null;
    };

    const storageMatch = stripPrefix(trimmed, s3Config.storageBasePath);
    if (storageMatch !== null) {
        return storageMatch.length > 0 ? storageMatch : null;
    }

    const cdnMatch = stripPrefix(trimmed, s3Config.cdnBaseUrl);
    if (cdnMatch !== null) {
        return cdnMatch.length > 0 ? cdnMatch : null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const url = new URL(trimmed);
            return url.pathname.replace(/^\/+/, '');
        } catch {
            return normalizePath(trimmed);
        }
    }

    return normalizePath(trimmed);
}
