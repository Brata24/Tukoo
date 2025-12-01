<script lang="ts">
	import { fly } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { toast } from '$lib/stores/toast';

	let { data, form } = $props();

	let showModal = $state(false);
	let editingBanner = $state<any>(null);
	let isSubmitting = $state(false);

	function openCreateModal() {
		editingBanner = null;
		showModal = true;
	}

	function openEditModal(banner: any) {
		editingBanner = banner;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingBanner = null;
	}

	$effect(() => {
		if (form?.success) {
			toast.success(form.message);
			closeModal();
		} else if (form?.message) {
			toast.error(form.message);
		}
	});
</script>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="flex justify-between items-center mb-8">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Promo Banners</h1>
				<p class="text-gray-600 mt-2">Manage promotional banners for front view display</p>
			</div>
			<button
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
					<div class="text-gray-400 text-6xl mb-4">📸</div>
					<h3 class="text-xl font-semibold text-gray-700 mb-2">No banners yet</h3>
					<p class="text-gray-500 mb-6">Create your first promotional banner</p>
					<button
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
										<form method="POST" action="?/delete" use:enhance class="inline">
											<input type="hidden" name="id" value={banner.id} />
											<button
												type="submit"
												class="text-red-600 hover:text-red-900"
												onclick={(e) => {
													if (!confirm('Are you sure you want to delete this banner?')) {
														e.preventDefault();
													}
												}}
											>
												Delete
											</button>
										</form>
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
{#if showModal}
	<div class="fixed inset-0 z-50 overflow-y-auto" transition:fly={{ y: -20, duration: 200 }}>
		<div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
			<!-- Background overlay -->
			<div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onclick={closeModal}></div>

			<!-- Modal panel -->
			<div class="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
				<h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
					{editingBanner ? 'Edit Banner' : 'Create Banner'}
				</h3>

				<form
					method="POST"
					action={editingBanner ? '?/update' : '?/create'}
					enctype="multipart/form-data"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					{#if editingBanner}
						<input type="hidden" name="id" value={editingBanner.id} />
					{/if}

					<div class="space-y-4">
						<!-- Title -->
						<div>
							<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
								Title
							</label>
							<input
								type="text"
								id="title"
								name="title"
								value={editingBanner?.title || ''}
								required
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<!-- Image (only for create) -->
						{#if !editingBanner}
							<div>
								<label for="image" class="block text-sm font-medium text-gray-700 mb-1">
									Image
								</label>
								<input
									type="file"
									id="image"
									name="image"
									accept="image/*"
									required
									class="w-full px-4 py-2 border border-gray-300 rounded-lg"
								/>
								<p class="text-xs text-gray-500 mt-1">Recommended: 1920x400px</p>
							</div>
						{/if}

						<!-- Order -->
						<div>
							<label for="order" class="block text-sm font-medium text-gray-700 mb-1">
								Display Order
							</label>
							<input
								type="number"
								id="order"
								name="order"
								value={editingBanner?.order || 0}
								min="0"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<!-- Active Status -->
						<div class="flex items-center">
							<input
								type="checkbox"
								id="isActive"
								name="isActive"
								checked={editingBanner ? editingBanner.isActive === 1 : true}
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label for="isActive" class="ml-2 block text-sm text-gray-900">
								Active
							</label>
						</div>
					</div>

					<div class="mt-6 flex justify-end space-x-3">
						<button
							type="button"
							onclick={closeModal}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
						>
							{isSubmitting ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
