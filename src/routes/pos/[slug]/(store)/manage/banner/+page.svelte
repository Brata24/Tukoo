<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { toast } from '$lib/stores/toast';

	let { data } = $props();

	let banners = $state<any[]>(data.banners || []);
	let editingBanner = $state<any>(null);
	let bannerToDelete = $state<any>(null);
	let isLoading = $state(false);

	let secondaryColor = $state(data.merchant?.secondaryColor || '#3b82f6');
	let secondaryTextColor = $state(data.merchant?.secondaryTextColor || '#ffffff');
	let primaryColor = $state(data.merchant?.primaryColor || '#1e40af');

	$effect(() => {
		if (data.merchant) {
			secondaryColor = data.merchant.secondaryColor || '#3b82f6';
			secondaryTextColor = data.merchant.secondaryTextColor || '#ffffff';
			primaryColor = data.merchant.primaryColor || '#1e40af';
		}
		if (data.banners) {
			banners = data.banners;
		}
	});

	function closeModal(modalId: string) {
		if (typeof window !== 'undefined' && (window as any).HSOverlay) {
			const modalEl = document.querySelector(modalId);
			if (modalEl) {
				(window as any).HSOverlay.close(modalEl);
			}
		}
	}

	function openAddBannerModal() {
		editingBanner = null;
		const titleInput = document.getElementById('add-title') as HTMLInputElement;
		const orderInput = document.getElementById('add-order') as HTMLInputElement;
		const imageInput = document.getElementById('add-image') as HTMLInputElement;
		const activeInput = document.getElementById('add-isActive') as HTMLInputElement;
		
		if (titleInput) titleInput.value = '';
		if (orderInput) orderInput.value = '0';
		if (imageInput) imageInput.value = '';
		if (activeInput) activeInput.checked = true;
	}

	function openEditBannerModal(banner: any) {
		editingBanner = banner;
		const idInput = document.getElementById('edit-banner-id') as HTMLInputElement;
		const titleInput = document.getElementById('edit-title') as HTMLInputElement;
		const orderInput = document.getElementById('edit-order') as HTMLInputElement;
		const activeInput = document.getElementById('edit-isActive') as HTMLInputElement;
		
		if (idInput) idInput.value = String(banner.id);
		if (titleInput) titleInput.value = banner.title;
		if (orderInput) orderInput.value = String(banner.order);
		if (activeInput) activeInput.checked = banner.isActive === 1;
		
		const modalEl = document.getElementById('editBannerModal');
		if (modalEl && typeof window !== 'undefined' && (window as any).HSOverlay) {
			try {
				new (window as any).HSOverlay(modalEl).open();
			} catch (e) {
				console.error('Error opening modal:', e);
			}
		}
	}

	function openDeleteBannerModal(banner: any) {
		bannerToDelete = banner;
		const modalEl = document.getElementById('deleteBannerModal');
		if (modalEl && typeof window !== 'undefined' && (window as any).HSOverlay) {
			try {
				new (window as any).HSOverlay(modalEl).open();
			} catch (e) {
				console.error('Error opening modal:', e);
			}
		}
	}

	async function handleCreateBanner(event: Event) {
		event.preventDefault();
		isLoading = true;

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		// Validate file size (max 5MB)
		const imageFile = formData.get('image') as File;
		if (imageFile && imageFile.size > 5 * 1024 * 1024) {
			toast.error('Image size must be less than 5MB');
			isLoading = false;
			return;
		}

		// Validate file type
		if (imageFile && !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(imageFile.type)) {
			toast.error('Only JPEG, PNG, and WebP images are allowed');
			isLoading = false;
			return;
		}

		try {
			const response = await fetch('/api/banner', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.success) {
				toast.success(result.message);
				banners = result.banners;
				closeModal('#addBannerModal');
				form.reset();
			} else {
				toast.error(result.error || 'Failed to create banner');
			}
		} catch (error) {
			console.error('Error creating banner:', error);
			toast.error('Failed to create banner');
		} finally {
			isLoading = false;
		}
	}

	async function handleUpdateBanner(event: Event) {
		event.preventDefault();
		isLoading = true;

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		const data = {
			id: parseInt(formData.get('id') as string),
			title: formData.get('title') as string,
			order: parseInt(formData.get('order') as string) || 0,
			isActive: formData.get('isActive') === 'on'
		};

		try {
			const response = await fetch('/api/banner', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			const result = await response.json();

			if (response.ok && result.success) {
				toast.success(result.message);
				banners = result.banners;
				closeModal('#editBannerModal');
			} else {
				toast.error(result.error || 'Failed to update banner');
			}
		} catch (error) {
			console.error('Error updating banner:', error);
			toast.error('Failed to update banner');
		} finally {
			isLoading = false;
		}
	}

	async function handleDeleteBanner() {
		if (!bannerToDelete) return;
		isLoading = true;

		try {
			const response = await fetch('/api/banner', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: bannerToDelete.id })
			});

			const result = await response.json();

			if (response.ok && result.success) {
				toast.success(result.message);
				banners = result.banners;
				closeModal('#deleteBannerModal');
				bannerToDelete = null;
			} else {
				toast.error(result.error || 'Failed to delete banner');
			}
		} catch (error) {
			console.error('Error deleting banner:', error);
			toast.error('Failed to delete banner');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		setTimeout(() => {
			if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);

		const modalIds = ['#addBannerModal', '#editBannerModal', '#deleteBannerModal'];
		const handleModalClose = () => {
			setTimeout(() => {
				document.body.style.overflow = '';
				document.body.style.removeProperty('overflow');
			}, 300);
		};

		modalIds.forEach((modalId) => {
			const modalEl = document.querySelector(modalId);
			if (modalEl) {
				modalEl.addEventListener('close.hs.overlay', handleModalClose);
			}
		});

		return () => {
			modalIds.forEach((modalId) => {
				const modalEl = document.querySelector(modalId);
				if (modalEl) {
					modalEl.removeEventListener('close.hs.overlay', handleModalClose);
				}
			});
		};
	});

	afterNavigate(() => {
		setTimeout(() => {
			if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);
	});
</script>

<svelte:head>
	<title>Promo Banners Management</title>
</svelte:head>

<div class="m-4">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold dark:text-white">Promo Banners</h2>
			<p class="text-sm text-gray-600 dark:text-neutral-400">Manage promotional banners for customer display</p>
		</div>
		<div class="flex items-center space-x-2">
			<button
				type="button"
				class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none"
				style="background-color: {secondaryColor}; color: {secondaryTextColor};"
				data-hs-overlay="#addBannerModal"
				onclick={openAddBannerModal}
			>
				<svg
					class="shrink-0 size-4"
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M5 12h14" />
					<path d="M12 5v14" />
				</svg>
				Add Banner
			</button>
		</div>
	</div>

	<!-- Table -->
	<div class="flex flex-col">
		<div class="-m-1.5 overflow-x-auto">
			<div class="p-1.5 min-w-full inline-block align-middle">
				<div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
					{#if banners.length === 0}
						<div class="p-16 text-center">
							<div class="inline-flex items-center justify-center size-16 rounded-full bg-gray-100 mb-4 dark:bg-neutral-700">
								<svg
									class="shrink-0 size-8 text-gray-400 dark:text-neutral-500"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect width="18" height="18" x="3" y="3" rx="2"/>
									<circle cx="9" cy="9" r="2"/>
									<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
								</svg>
							</div>
							<h3 class="text-xl font-semibold text-gray-700 mb-2 dark:text-neutral-300">No banners yet</h3>
							<p class="text-gray-500 mb-6 dark:text-neutral-500">Create your first promotional banner</p>
							<button
								type="button"
								class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent"
								style="background-color: {secondaryColor}; color: {secondaryTextColor};"
								data-hs-overlay="#addBannerModal"
								onclick={openAddBannerModal}
							>
								Add Banner
							</button>
						</div>
					{:else}
						<table class="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
							<thead class="bg-gray-50 dark:bg-neutral-800">
								<tr>
									<th scope="col" class="px-6 py-3 text-start">
										<span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
											Preview
										</span>
									</th>
									<th scope="col" class="px-6 py-3 text-start">
										<span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
											Title
										</span>
									</th>
									<th scope="col" class="px-6 py-3 text-start">
										<span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
											Order
										</span>
									</th>
									<th scope="col" class="px-6 py-3 text-start">
										<span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
											Status
										</span>
									</th>
									<th scope="col" class="px-6 py-3 text-end"></th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 dark:divide-neutral-700">
								{#each banners as banner}
									<tr class="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
										<td class="px-6 py-4 whitespace-nowrap">
											<img
												src={banner.image}
												alt={banner.title}
												class="h-16 w-28 object-cover rounded-md border border-gray-200 dark:border-neutral-700"
											/>
										</td>
										<td class="px-6 py-4">
											<span class="text-sm font-semibold text-gray-800 dark:text-neutral-200">{banner.title}</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200">
												{banner.order}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											{#if banner.isActive}
												<span class="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-500/10 dark:text-teal-500">
													<svg class="size-2.5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
														<circle cx="8" cy="8" r="8"/>
													</svg>
													Active
												</span>
											{:else}
												<span class="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-400">
													<svg class="size-2.5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
														<circle cx="8" cy="8" r="8"/>
													</svg>
													Inactive
												</span>
											{/if}
										</td>
										<td class="px-6 py-1.5 whitespace-nowrap">
											<div class="flex justify-end items-center gap-x-2">
												<button
													type="button"
													class="inline-flex items-center gap-x-1 text-sm decoration-2 hover:underline focus:outline-none focus:underline font-medium"
													style="color: {secondaryColor};"
													onclick={() => openEditBannerModal(banner)}
												>
													Edit
												</button>
												<button
													type="button"
													class="inline-flex items-center gap-x-1 text-sm text-red-600 decoration-2 hover:underline focus:outline-none focus:underline font-medium dark:text-red-500"
													onclick={() => openDeleteBannerModal(banner)}
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Info Box -->
	<div class="mt-6 flex bg-blue-50 border border-blue-200 rounded-xl p-4 dark:bg-blue-800/10 dark:border-blue-900">
		<div class="shrink-0">
			<svg class="shrink-0 size-5 text-blue-600 mt-0.5 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
			</svg>
		</div>
		<div class="ms-3">
			<h3 class="text-sm font-semibold text-blue-800 dark:text-blue-400">Customer Display</h3>
			<p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
				Banners will display on front view: 
				<code class="text-xs font-mono bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">/pos/{data.merchantSlug}/frontview</code>
			</p>
		</div>
	</div>
</div>

<!-- Add Banner Modal -->
<div
	id="addBannerModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
>
	<div class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center">
		<div class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700">
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 class="font-bold text-gray-800 dark:text-white">Add Banner</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400"
					aria-label="Close"
					data-hs-overlay="#addBannerModal"
				>
					<svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>
			<div class="p-4 overflow-y-auto">
				<form
					onsubmit={handleCreateBanner}
					enctype="multipart/form-data"
				>
					<div class="space-y-4">
						<div>
							<label for="add-title" class="block text-sm font-medium mb-2 dark:text-white">Title *</label>
							<input
								type="text"
								id="add-title"
								name="title"
								required
								placeholder="e.g., Summer Sale 50% Off"
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							/>
						</div>

						<div>
							<label for="add-image" class="block text-sm font-medium mb-2 dark:text-white">Banner Image *</label>
							<input
								type="file"
								id="add-image"
								name="image"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								required
								class="block w-full border border-gray-200 shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 file:bg-gray-50 file:border-0 file:me-4 file:py-3 file:px-4 dark:file:bg-neutral-700 dark:file:text-neutral-400"
							/>
							<p class="mt-1 text-xs text-gray-500 dark:text-neutral-500">Recommended: 1920x400px • Max: 5MB • JPEG, PNG, WebP</p>
						</div>

						<div>
							<label for="add-order" class="block text-sm font-medium mb-2 dark:text-white">Display Order</label>
							<input
								type="number"
								id="add-order"
								name="order"
								value="0"
								min="0"
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							/>
							<p class="mt-1 text-xs text-gray-500 dark:text-neutral-500">Lower numbers appear first</p>
						</div>

						<div class="flex">
							<input
								type="checkbox"
								id="add-isActive"
								name="isActive"
								checked
								class="shrink-0 mt-0.5 border-gray-200 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800"
							/>
							<label for="add-isActive" class="text-sm text-gray-500 ms-3 dark:text-neutral-400">Active (show on customer display)</label>
						</div>
					</div>

					<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700 mt-4">
						<button
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
							data-hs-overlay="#addBannerModal"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading}
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none"
							style="background-color: {secondaryColor}; color: {secondaryTextColor};"
						>
							{#if isLoading}
								<svg class="animate-spin size-4" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Creating...
							{:else}
								Create Banner
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
<!-- Edit Banner Modal -->
<div
	id="editBannerModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
>
	<div class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center">
		<div class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700">
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 class="font-bold text-gray-800 dark:text-white">Edit Banner</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400"
					aria-label="Close"
					onclick={() => closeModal('#editBannerModal')}
				>
					<svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>
			<div class="p-4 overflow-y-auto">
				<form
					onsubmit={handleUpdateBanner}
				>
					<input type="hidden" id="edit-banner-id" name="id" value="" />

					{#if editingBanner}
						<div class="mb-4">
							<div class="block text-sm font-medium mb-2 dark:text-white">Current Image</div>
							<img src={editingBanner.image} alt={editingBanner.title} class="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-neutral-700" />
							<p class="mt-1 text-xs text-gray-500 dark:text-neutral-500">To change image, delete and create new banner</p>
						</div>
					{/if}

					<div class="space-y-4">
						<div>
							<label for="edit-title" class="block text-sm font-medium mb-2 dark:text-white">Title *</label>
							<input
								type="text"
								id="edit-title"
								name="title"
								required
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							/>
						</div>

						<div>
							<label for="edit-order" class="block text-sm font-medium mb-2 dark:text-white">Display Order</label>
							<input
								type="number"
								id="edit-order"
								name="order"
								min="0"
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							/>
						</div>

						<div class="flex">
							<input
								type="checkbox"
								id="edit-isActive"
								name="isActive"
								class="shrink-0 mt-0.5 border-gray-200 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800"
							/>
							<label for="edit-isActive" class="text-sm text-gray-500 ms-3 dark:text-neutral-400">Active</label>
						</div>
					</div>

					<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700 mt-4">
						<button
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
							onclick={() => closeModal('#editBannerModal')}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading}
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none"
							style="background-color: {secondaryColor}; color: {secondaryTextColor};"
						>
							{#if isLoading}
								<svg class="animate-spin size-4" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Updating...
							{:else}
								Update Banner
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<!-- Delete Banner Modal -->
<div
	id="deleteBannerModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
>
	<div class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center">
		<div class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700">
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 class="font-bold text-gray-800 dark:text-white">Delete Banner</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400"
					aria-label="Close"
					onclick={() => closeModal('#deleteBannerModal')}
				>
					<svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>
			<div class="p-4 overflow-y-auto">
				<p class="text-gray-800 dark:text-neutral-400">
					Are you sure you want to delete <strong>"{bannerToDelete?.title}"</strong>? This action cannot be undone.
				</p>
			</div>
			<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700">
				<button
					type="button"
					disabled={isLoading}
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
					onclick={() => closeModal('#deleteBannerModal')}
				>
					Cancel
				</button>
				<button
					type="button"
					disabled={isLoading}
					onclick={handleDeleteBanner}
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-red-600 text-white hover:bg-red-700 focus:outline-hidden focus:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
				>
					{#if isLoading}
						<svg class="animate-spin size-4" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Deleting...
					{:else}
						Delete
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
