/**
 * Legacy no-op initializer kept for backwards compatibility.
 * Previously created local directories for file uploads; all files now live in S3.
 */
export async function initializeDirectories(): Promise<void> {
    console.log('✅ Remote storage active – no local directories to initialize');
}

/**
 * Initialize directories on application startup (no-op with remote storage)
 */
export function initializeApp(): void {
    initializeDirectories().catch(console.error);
}
