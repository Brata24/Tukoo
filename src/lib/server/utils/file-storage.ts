import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { buildPublicUrl, extractStorageKeyFromUrl, getS3Client, s3Config } from './s3-client';

export interface FileStorageOptions {
    /** Directory prefix to group files in the bucket (e.g., 'profile', 'documents') */
    directory: string;
    /** Maximum file size in bytes (default: 5MB) */
    maxSize?: number;
    /** Allowed file types (default: images only) */
    allowedTypes?: string[];
    /** Custom filename (if not provided, UUID will be used) */
    customFileName?: string;
}

export interface FileStorageResult {
    /** Public URL path to access the file */
    publicUrl: string;
    /** Storage key (path) inside the S3 bucket */
    storageKey: string;
    /** Generated filename */
    fileName: string;
}

/**
 * Save an uploaded file to the static directory with proper validation
 * @param file - The uploaded file
 * @param options - Storage configuration options
 * @returns Promise<FileStorageResult> - File storage information
 */
export async function saveUploadedFile(file: File, options: FileStorageOptions): Promise<FileStorageResult> {
    const {
        directory,
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        customFileName
    } = options;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Validate file size
    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        throw new Error(`File size ${Math.round(file.size / (1024 * 1024))}MB exceeds maximum allowed size of ${maxSizeMB}MB`);
    }

    // Generate filename
    const fileExtension = file.name.split('.').pop() || 'bin';
    const fileName = customFileName 
        ? `${customFileName}.${fileExtension}`
        : `${uuidv4()}.${fileExtension}`;
    
    const normalizedDir = directory.replace(/(^\/+|\/+$)/g, '');
    const storageKey = normalizedDir ? `${normalizedDir}/${fileName}` : fileName;

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    const client = getS3Client();

    try {
        await client.send(new PutObjectCommand({
            Bucket: s3Config.bucketName,
            Key: storageKey,
            Body: buffer,
            ContentType: file.type || 'application/octet-stream',
            ACL: s3Config.objectAcl
        }));
    } catch (error) {
        console.error('Failed to upload file to S3', error);
        throw new Error('Failed to upload file');
    }

    return {
        publicUrl: buildPublicUrl(storageKey),
        storageKey,
        fileName
    };
}

/**
 * Save profile picture with predefined settings
 * @param file - The uploaded profile picture file
 * @returns Promise<string> - Public URL of the saved file
 */
export async function saveProfilePicture(file: File): Promise<string> {
    const result = await saveUploadedFile(file, {
        directory: 'profile',
        maxSize: 5 * 1024 * 1024, 
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    });
    
    return result.publicUrl;
}

/**
 * Save document file with predefined settings
 * @param file - The uploaded document file
 * @returns Promise<string> - Public URL of the saved file
 */
export async function saveDocumentFile(file: File): Promise<string> {
    const result = await saveUploadedFile(file, {
        directory: 'documents',
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });
    
    return result.publicUrl;
}

/**
 * Delete a file from the static directory (optional utility)
 * @param publicUrl - The public URL of the file to delete
 */
export async function deleteUploadedFile(publicUrl: string): Promise<void> {
    try {
        const key = extractStorageKeyFromUrl(publicUrl);
        if (!key) {
            return;
        }
        const client = getS3Client();
        await client.send(new DeleteObjectCommand({
            Bucket: s3Config.bucketName,
            Key: key
        }));
    } catch (error) {
        console.warn('Failed to delete file from S3:', publicUrl, error);
    }
}
