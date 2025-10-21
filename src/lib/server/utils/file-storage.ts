import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileStorageOptions {
    /** Directory name inside static folder (e.g., 'profile', 'documents') */
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
    /** Full file path on disk */
    filePath: string;
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

    // Create target directory if it doesn't exist
    const targetDir = path.join(process.cwd(), 'static', directory);
    await ensureDirectoryExists(targetDir);

    // Generate filename
    const fileExtension = file.name.split('.').pop() || 'bin';
    const fileName = customFileName 
        ? `${customFileName}.${fileExtension}`
        : `${uuidv4()}.${fileExtension}`;
    
    const filePath = path.join(targetDir, fileName);

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return file information
    return {
        publicUrl: `/${directory}/${fileName}`,
        filePath,
        fileName
    };
}

/**
 * Ensure a directory exists, create it if it doesn't
 * @param dirPath - Full path to the directory
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
    }
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
        const filePath = path.join(process.cwd(), 'static', publicUrl);
        const { unlink } = await import('fs/promises');
        await unlink(filePath);
    } catch (error) {
        console.warn('Failed to delete file:', publicUrl, error);
        
    }
}