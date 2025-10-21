import { ensureDirectoryExists } from './file-storage.js';
import path from 'path';

/**
 * Initialize required directories for the application
 */
export async function initializeDirectories(): Promise<void> {
    const staticPath = path.join(process.cwd(), 'static');
    
    // Create required directories
    const requiredDirs = [
        path.join(staticPath, 'profile'),
        path.join(staticPath, 'documents'),
        path.join(staticPath, 'uploads')
    ];

    for (const dir of requiredDirs) {
        await ensureDirectoryExists(dir);
    }
    
    console.log('✅ All required directories initialized');
}

/**
 * Initialize directories on application startup
 * Call this in your app initialization or server setup
 */
export function initializeApp(): void {
    initializeDirectories().catch(console.error);
}