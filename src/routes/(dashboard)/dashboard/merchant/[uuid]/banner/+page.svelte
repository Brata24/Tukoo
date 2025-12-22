<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	let editingBanner = $state<any>(null);
	let isSubmitting = $state(false);
	let previewUrl = $state<string | null>(null);

	function openCreateModal() {
		editingBanner = null;
		previewUrl = null;
		
		// Reset form
		const form = document.querySelector('#bannerModal form') as HTMLFormElement;
		if (form) form.reset();
	}

	function openEditModal(banner: any) {
		editingBanner = banner;
		previewUrl = null;
		
		const modalEl = document.getElementById('bannerModal');
		if (!modalEl) return;

		if (typeof window !== 'undefined' && (window as any).HSOverlay) {
			try {
				const HSOverlay = (window as any).HSOverlay;
				new HSOverlay(modalEl).open();
			} catch (e) {
				console.error('Error opening modal:', e);
			}
		}
	}

	function closeModal() {
		if (typeof window !== 'undefined' && (window as any).HSOverlay) {
			(window as any).HSOverlay.close('#bannerModal');
		}
		editingBanner = null;
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		previewUrl = null;
	}

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
			previewUrl = URL.createObjectURL(input.files[0]);
		}
	}

	onMount(() => {
		// Initialize Preline UI
		setTimeout(() => {
			if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);

		// Cleanup body overflow when modal closes
		const handleModalClose = () => {
			setTimeout(() => {
				document.body.style.overflow = '';
				document.body.style.removeProperty('overflow');
			}, 300);
		};

		const modalEl = document.querySelector('#bannerModal');
		if (modalEl) {
			modalEl.addEventListener('close.hs.overlay', handleModalClose);
		}

		// Cleanup on unmount
		return () => {
			if (modalEl) {
				modalEl.removeEventListener('close.hs.overlay', handleModalClose);
			}
		};
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isSubmitting = true;

		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const url = `/api/merchant/${data.merchant.uuid}/banner`;
			const method = editingBanner ? 'PUT' : 'POST';
			
			if (editingBanner) {
				formData.append('id', editingBanner.id.toString());
			}

			const response = await fetch(url, {
				method,
				body: formData
			});

			const result = await response.json();

			if (result.success) {
				toast.success(result.message);
				closeModal();
				await invalidateAll();
			} else {
				toast.error(result.error || 'Failed to save banner');
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('An error occurred');
		} finally {
			isSubmitting = false;
		}
	}

	async function deleteBanner(id: number) {
		if (!confirm('Are you sure you want to delete this banner?')) return;

		try {
			const response = await fetch(`/api/merchant/${data.merchant.uuid}/banner`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id })
			});

			const result = await response.json();

			if (result.success) {
				toast.success(result.message);
				await invalidateAll();
			} else {
				toast.error(result.error || 'Failed to delete banner');
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('An error occurred');
		}
	}
</script>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="flex justify-between items-center mb-8">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Promo Banners</h1>
				<p class="text-gray-600 mt-2">Manage promotional banners for {data.merchant.name}</p>
			</div>
			<button
				data-hs-overlay="#bannerModal"
				onclick={openCreateModal}
				class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
			>
				+ Add Banner
			</button>
		</div>

		<!-- Banners List -->
		<div class="bg-white rounded-lg shadow overflow-hidden">
			{#if data.banners.length === 0}
				<div class="p-12 text-center">
					<div class="flex justify-center mb-4">
						<svg class="w-16 h-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-gray-700 mb-2">No banners yet</h3>
					<p class="text-gray-500 mb-6">Create your first promotional banner</p>
					<button
						data-hs-overlay="#bannerModal"
						onclick={openCreateModal}
						class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Add Banner
					</button>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50 border-b">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Preview
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Title
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Order
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each data.banners as banner}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap">
										<img
											src={banner.image}
											alt={banner.title}
											class="h-16 w-24 object-cover rounded"
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">{banner.title}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="text-sm text-gray-900">{banner.order}</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{#if banner.isActive}
											<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
												Active
											</span>
										{:else}
											<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
												Inactive
											</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
										<button
											onclick={() => openEditModal(banner)}
											class="text-blue-600 hover:text-blue-900 mr-4"
										>
											Edit
										</button>
										<button
											onclick={() => deleteBanner(banner.id)}
											class="text-red-600 hover:text-red-900"
										>
											Delete
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Modal -->
<div
	id="bannerModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="bannerModalLabel"
>
	<div class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-2xl sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center">
		<div class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700">
			<!-- Modal Header -->
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="bannerModalLabel" class="font-bold text-gray-800 dark:text-white">
					{editingBanner ? 'Edit Banner' : 'Create New Banner'}
				</h3>
				<button
					type="button"
					data-hs-overlay="#bannerModal"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400"
					aria-label="Close"
				>
					<span class="sr-only">Close</span>
					<svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>


			<!-- Modal Body -->
			<div class="p-4 overflow-y-auto">
				<form onsubmit={handleSubmit} enctype="multipart/form-data">
					<div class="space-y-4">
						<!-- Title -->
						<div>
							<label for="title" class="block text-sm font-medium mb-2">
								Title
							</label>
							<input
								type="text"
								id="title"
								name="title"
								value={editingBanner?.title || ''}
								required
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
								placeholder="Enter banner title"
							/>
						</div>

						<!-- Image -->
						{#if editingBanner}
							<div>
								<label for="image" class="block text-sm font-medium mb-2">
									Banner Image
								</label>
								<input
									type="file"
									id="image"
									name="image"
									accept="image/jpeg,image/jpg,image/png,image/webp"
									onchange={handleFileChange}
									class="block w-full border border-gray-200 shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none file:bg-gray-50 file:border-0 file:me-4 file:py-3 file:px-4"
								/>
								<p class="mt-2 text-xs text-gray-500">Recommended: 1920x400px | Max: 5MB | Format: JPEG, PNG, WebP</p>
								<div class="mt-3">
									<div class="text-xs text-gray-500 mb-2">{previewUrl ? 'New preview:' : 'Current image:'}</div>
									<div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
										<img src={previewUrl || editingBanner.image} alt={editingBanner.title} class="h-32 w-auto mx-auto object-contain rounded" />
									</div>
								</div>
							</div>
						{:else}
							<div>
								<label for="image" class="block text-sm font-medium mb-2">
									Image
								</label>
								<input
									type="file"
									id="image"
									name="image"
									accept="image/jpeg,image/jpg,image/png,image/webp"
									required
									onchange={handleFileChange}
									class="block w-full border border-gray-200 shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none file:bg-gray-50 file:border-0 file:me-4 file:py-3 file:px-4"
								/>
								<p class="mt-2 text-xs text-gray-500">Recommended: 1920x400px | Max: 5MB | Format: JPEG, PNG, WebP</p>
								{#if previewUrl}
									<div class="mt-3">
										<div class="text-xs text-gray-500 mb-2">Preview:</div>
										<div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
											<img src={previewUrl} alt="Preview" class="h-32 w-auto mx-auto object-contain rounded" />
										</div>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Order -->
						<div>
							<label for="order" class="block text-sm font-medium mb-2">
								Display Order
							</label>
							<input
								type="number"
								id="order"
								name="order"
								value={editingBanner?.order || 0}
								min="0"
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
								placeholder="0"
							/>
							<p class="mt-2 text-xs text-gray-500">Lower numbers appear first</p>
						</div>

						<!-- Active Status -->
						<div class="flex items-center gap-x-3 bg-gray-50 p-3 rounded-lg">
							<input
								type="checkbox"
								id="isActive"
								name="isActive"
								value="true"
								checked={editingBanner ? editingBanner.isActive : true}
								class="shrink-0 mt-0.5 border-gray-200 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
							/>
							<label for="isActive" class="text-sm text-gray-800">
								Show this banner on the display
							</label>
						</div>
					</div>


					<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700 mt-4">
						<button
							type="button"
							data-hs-overlay="#bannerModal"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
						>
							{#if isSubmitting}
								<span class="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-white rounded-full" role="status" aria-label="loading"></span>
								Saving...
							{:else}
								{editingBanner ? 'Update Banner' : 'Create Banner'}
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
