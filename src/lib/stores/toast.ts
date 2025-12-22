import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
	message: string;
	type?: ToastType;
	duration?: number;
	position?: 'left' | 'center' | 'right';
	gravity?: 'top' | 'bottom';
}

// Create a writable store for toast notifications
export const toastStore = writable<ToastOptions | null>(null);

// Function to create custom toast HTML
function createCustomToast(message: string, type: ToastType = 'info', toastId: string) {
	const typeStyles = {
		success: {
			bg: 'bg-green-50 border-green-200 dark:bg-green-800/10 dark:border-green-700',
			text: 'text-green-700 dark:text-green-400',
			icon: `<svg class="shrink-0 size-4 text-green-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>`
		},
		error: {
			bg: 'bg-red-50 border-red-200 dark:bg-red-800/10 dark:border-red-700',
			text: 'text-red-700 dark:text-red-400',
			icon: `<svg class="shrink-0 size-4 text-red-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`
		},
		warning: {
			bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-800/10 dark:border-yellow-700',
			text: 'text-yellow-700 dark:text-yellow-400',
			icon: `<svg class="shrink-0 size-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17.02.01 0"/></svg>`
		},
		info: {
			bg: 'bg-blue-50 border-blue-200 dark:bg-blue-800/10 dark:border-blue-700',
			text: 'text-blue-700 dark:text-blue-400',
			icon: `<svg class="shrink-0 size-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="m12 8h.01"/></svg>`
		}
	};

	const style = typeStyles[type];

	return `
		<div id="${toastId}" class="transition duration-300 z-[9999] w-fit max-w-xs ${style.bg} border rounded-xl shadow-lg pointer-events-auto" role="alert" tabindex="-1" style="opacity: 1; transform: translateX(0); position: relative; z-index: 9999;">
			<div class="flex  items-center p-4">
				<div class="shrink-0">
					${style.icon}
				</div>
				<div class="ms-3">
					<p class="text-sm ${style.text}">
						${message}
					</p>
				</div>
				<div class="ml-4">
					<button type="button" class="inline-flex shrink-0 justify-center items-center size-4 rounded-lg text-gray-800 opacity-50 hover:opacity-100 focus:outline-hidden focus:opacity-100 dark:text-white" aria-label="Close" onclick="document.getElementById('${toastId}').remove()">
						<span class="sr-only">Close</span>
						<svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 6 6 18"></path>
							<path d="m6 6 12 12"></path>
						</svg>
					</button>
				</div>
			</div>
		</div>
	`;
}

// Global toast function
export function showToast(options: ToastOptions | string) {
	// Handle both string and object parameters
	const toastOptions: ToastOptions = typeof options === 'string' 
		? { message: options } 
		: options;

	const {
		message,
		type = 'info',
		duration = 3000,
		position = 'right',
		gravity = 'top'
	} = toastOptions;

	// Only show toast if we're in the browser
	if (typeof window !== 'undefined') {
		// Create toast container if it doesn't exist
		let container = document.getElementById('toast-container');
		if (!container) {
			container = document.createElement('div');
			container.id = 'toast-container';
			
			// Build proper positioning classes
			let positionClass = '';
			if (gravity === 'top') positionClass += 'top-4 ';
			else positionClass += 'bottom-4 ';
			
			if (position === 'right') positionClass += 'right-4';
			else if (position === 'left') positionClass += 'left-4';
			else positionClass += 'left-1/2 transform -translate-x-1/2';
			
			container.className = `fixed ${positionClass} z-[9999] space-y-3 pointer-events-none`;
			container.style.pointerEvents = 'none';
			document.body.appendChild(container);
			
			console.log('Toast container created with classes:', container.className);
		}

		// Generate unique ID for this toast
		const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		
		// Create and insert the toast
		const toastHTML = createCustomToast(message, type, toastId);
		container.insertAdjacentHTML('beforeend', toastHTML);

		// Debug: Log that toast was created
		console.log('Toast created:', toastId, message);

		// Auto-remove after duration
		if (duration > 0) {
			setTimeout(() => {
				const toastElement = document.getElementById(toastId);
				if (toastElement) {
					// Add removal animation classes
					toastElement.style.transform = 'translateX(20px)';
					toastElement.style.opacity = '0';
					setTimeout(() => toastElement.remove(), 300);
				}
			}, duration);
		}
	}

	// Update the store (useful for testing or other reactive behaviors)
	toastStore.set(toastOptions);
}

// Convenience functions for different toast types
export const toast = {
	success: (message: string, options?: Partial<ToastOptions>) => 
		showToast({ message, type: 'success', ...options }),
	
	error: (message: string, options?: Partial<ToastOptions>) => 
		showToast({ message, type: 'error', ...options }),
	
	info: (message: string, options?: Partial<ToastOptions>) => 
		showToast({ message, type: 'info', ...options }),
	
	warning: (message: string, options?: Partial<ToastOptions>) => 
		showToast({ message, type: 'warning', ...options }),
};