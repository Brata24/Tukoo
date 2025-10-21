<script lang="ts">
	import { enhance, applyAction } from "$app/forms";
	import { onMount } from "svelte";
	import { afterNavigate } from "$app/navigation";
	import { toast } from "$lib/stores/toast.js";

	let {data}: any = $props();
   

	let categories: any[] = $state([]);
	let pagination = $state({ total: 0, page: 1, limit: 10, totalPages: 1 });
	let loading = $state(false);

	
	let secondaryColor = $state(data.merchant?.secondaryColor || '#3b82f6');
	let secondaryTextColor = $state(data.merchant?.secondaryTextColor || '#ffffff');

	
	$effect(() => {
		if (data.merchant) {
			secondaryColor = data.merchant.secondaryColor || '#3b82f6';
			secondaryTextColor = data.merchant.secondaryTextColor || '#ffffff';
		}
	});

	// Fetch categories from API
	async function fetchCategories(pageNum: number = 1, limitNum: number = 10) {
		loading = true;
		try {
			const response = await fetch(`/api/categories?page=${pageNum}&limit=${limitNum}`);
			const result = await response.json();
			
			if (result.success) {
				categories = result.categories;
				pagination = result.pagination;
			} else {
				toast.error("Failed to load categories");
			}
		} catch (error) {
			console.error("Error fetching categories:", error);
			toast.error("Failed to load categories");
		} finally {
			loading = false;
		}
	}

	
	async function refreshCategories() {
		await fetchCategories(pagination.page, pagination.limit);
	}

	function closeModal(modalId: string) {
		window.HSOverlay.close(modalId);
		// Overflow cleanup is handled by the close.hs.overlay event listener
	}

	
	let categoryToDelete: any = $state(null);

	function openDeleteCategoryModal(category: any) {
		categoryToDelete = category;
		const modalEl = document.getElementById('deleteCategoryModal');
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

	
	async function handleAddCategory(result: any): Promise<void> {
		if (result?.type === "success") {
			toast.success("Category added successfully");
			await refreshCategories();
		} else {
			toast.error((result?.data as any)?.message || "Failed to add category");
		}
		if (result) await applyAction(result);
	}

	
	async function handleEditCategory(result: any): Promise<void> {
		if (result?.type === "success") {
			toast.success("Category updated successfully");
			await refreshCategories();
		} else {
			toast.error((result?.data as any)?.message || "Failed to update category");
		}
		if (result) await applyAction(result);
	}

	
	async function handleDeleteCategory(result: any): Promise<void> {
		if (result?.type === "success") {
			toast.success("Category deleted successfully");
			await refreshCategories();
		} else {
			toast.error((result?.data as any)?.message || "Failed to delete category");
		}
		if (result) await applyAction(result);
	}

	
	onMount(() => {
		// Fetch categories on mount
		const urlParams = new URLSearchParams(window.location.search);
		const page = parseInt(urlParams.get('page') || '1');
		const limit = parseInt(urlParams.get('limit') || '10');
		fetchCategories(page, limit);

		// Initialize Preline UI
		setTimeout(() => {
			if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);

		// Add event listeners to clean up body overflow when modals close
		const modalIds = ['#addCategoryModal', '#editCategoryModal', '#deleteCategoryModal'];
		
		const handleModalClose = () => {
			setTimeout(() => {
				document.body.style.overflow = '';
				document.body.style.removeProperty('overflow');
				
			}, 300);
		};

		modalIds.forEach(modalId => {
			const modalEl = document.querySelector(modalId);
			if (modalEl) {
				modalEl.addEventListener('close.hs.overlay', handleModalClose);
			}
		});

		// Cleanup event listeners on unmount
		return () => {
			modalIds.forEach(modalId => {
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

	
	function openAddCategoryModal() {
		// Reset the form
		const nameInput = document.getElementById("add-name") as HTMLInputElement;
		if (nameInput) nameInput.value = '';
	}

	
	function openEditCategoryModal(category: any) {
		const idInput = document.getElementById("edit-category-id") as HTMLInputElement;
		const nameInput = document.getElementById("edit-name") as HTMLInputElement;
		
		if (idInput) idInput.value = String(category.id);
		if (nameInput) nameInput.value = category.name;
		
		const modalEl = document.getElementById('editCategoryModal');
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
</script>

<div class="m-4">
   
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold dark:text-white">Categories</h2>
			<p class="text-sm text-gray-600 dark:text-neutral-400">Manage product categories</p>
		</div>
		<div class="flex items-center space-x-2">
			<button
				type="button"
				class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none"
				style="background-color: {secondaryColor}; color: {secondaryTextColor};"
				data-hs-overlay="#addCategoryModal"
				onclick={openAddCategoryModal}
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
					stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
				>
				Add Category
			</button>
		</div>
	</div>

	<div class="flex flex-col">
		<div class="-m-1.5 overflow-x-auto">
			<div class="p-1.5 min-w-full inline-block align-middle">
				<div
					class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-neutral-800 dark:border-neutral-700"
				>
					<!-- Table -->
					<table class="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
						<thead class="bg-gray-50 dark:bg-neutral-800">
							<tr>
								<th scope="col" class="ps-6 py-3 text-start">
									<div class="flex items-center gap-x-2">
										<span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
											Name
										</span>
									</div>
								</th>

								<th scope="col" class="px-6 py-3 text-end"></th>
							</tr>
						</thead>

						<tbody class="divide-y divide-gray-200 dark:divide-neutral-700">
							{#each categories as cat}
								<tr>
									<td class="size-px whitespace-nowrap">
										<div class="ps-6 py-3">
											<div class="flex items-center gap-x-3">
												<div class="grow">
													<span class="block text-sm font-semibold text-gray-800 dark:text-neutral-200">{cat.name}</span>
												</div>
											</div>
										</div>
									</td>
									<td class="size-px whitespace-nowrap">
										<div class="px-6 py-1.5 flex justify-end items-center gap-x-2">
											<button
												type="button"
												class="inline-flex items-center gap-x-1 text-sm decoration-2 hover:underline focus:outline-none focus:underline font-medium"
												style="color: {secondaryColor};"
												onclick={() => openEditCategoryModal(cat)}
											>
												Edit
											</button>
											<button
												type="button"
												class="inline-flex items-start gap-x-1 text-sm text-red-600 decoration-2 hover:underline focus:outline-none focus:underline font-medium dark:text-red-500"
												onclick={() => openDeleteCategoryModal(cat)}
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							{/each}
							{#if loading}
								<tr>
									<td colspan="2" class="size-px whitespace-nowrap">
										<div class="px-6 py-3 text-center">
											<span class="text-sm text-gray-600 dark:text-neutral-400">Loading...</span>
										</div>
									</td>
								</tr>
							{:else if categories.length === 0}
								<tr>
									<td colspan="2" class="size-px whitespace-nowrap">
										<div class="px-6 py-3 text-center">
											<span class="text-sm text-gray-600 dark:text-neutral-400">No categories found</span>
										</div>
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
					<!-- End Table -->

					<!-- Footer -->
					{#if pagination.totalPages > 1}
						<div
							class="px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-t border-gray-200 dark:border-neutral-700"
						>
							<div>
								<p class="text-sm text-gray-600 dark:text-neutral-400">
									<span class="font-semibold text-gray-800 dark:text-neutral-200">{pagination.total}</span> results
								</p>
							</div>

							<div>
								<div class="inline-flex gap-x-2">
									{#if pagination.page > 1}
										<a
											href="?page={pagination.page - 1}&limit={pagination.limit}"
											class="py-1.5 px-2 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
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
												stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
											>
											Prev
										</a>
									{:else}
										<button
											disabled
											class="py-1.5 px-2 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm opacity-50 pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
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
												stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
											>
											Prev
										</button>
									{/if}

									<div class="flex items-center gap-x-1">
										{#each Array(pagination.totalPages) as _, i}
											{#if i + 1 === pagination.page}
												<button
													type="button"
													class="min-h-[38px] min-w-[38px] flex justify-center items-center bg-blue-600 text-white py-2 px-3 text-sm rounded-lg focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
													aria-current="page">{i + 1}</button
												>
											{:else}
												<a
													href="?page={i + 1}&limit={pagination.limit}"
													class="min-h-[38px] min-w-[38px] flex justify-center items-center border border-gray-200 text-gray-800 py-2 px-3 text-sm rounded-lg focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:border-neutral-700 dark:text-white dark:focus:bg-neutral-700"
													>{i + 1}</a
												>
											{/if}
										{/each}
									</div>

									{#if pagination.page < pagination.totalPages}
										<a
											href="?page={pagination.page + 1}&limit={pagination.limit}"
											class="py-1.5 px-2 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
										>
											Next
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
												stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
											>
										</a>
									{:else}
										<button
											disabled
											class="py-1.5 px-2 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm opacity-50 pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
										>
											Next
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
												stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
											>
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/if}
					<!-- End Footer -->
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Add Category Modal -->
<div
	id="addCategoryModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="addCategoryModalLabel"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
	>
		<div
			class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="addCategoryModalLabel" class="font-bold text-gray-800 dark:text-white">Add Category</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
					data-hs-overlay="#addCategoryModal"
				>
					<span class="sr-only">Close</span>
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
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>
			<div class="p-4 overflow-y-auto">
				<form
					method="POST"
					action="?/add-category"
					use:enhance={() => {
						return async ({ result }) => {
							await handleAddCategory(result);
                            closeModal("#addCategoryModal");
						};
					}}
				>
					<div class="space-y-4">
						<div>
							<label for="add-name" class="block text-sm font-medium mb-2 dark:text-white">Name</label>
							<input
								type="text"
								id="add-name"
								name="name"
								required
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
								placeholder="Enter category name"
							/>
						</div>
					</div>
					<div
						class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700 mt-4"
					>
						<button
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
							data-hs-overlay="#addCategoryModal"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none"
							style="background-color: {secondaryColor}; color: {secondaryTextColor};"
						>
							Create Category
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<!-- Edit Category Modal -->
<div
	id="editCategoryModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="editCategoryModalLabel"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
	>
		<div
			class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="editCategoryModalLabel" class="font-bold text-gray-800 dark:text-white">Edit Category</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
					onclick={() => closeModal("#editCategoryModal")}
				>
					<span class="sr-only">Close</span>
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
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>
			<div class="p-4 overflow-y-auto">
				<form
					method="POST"
					action="?/edit-category"
					use:enhance={() => {
						return async ({ result }) => {
							await handleEditCategory(result);
                            closeModal("#editCategoryModal");
						};
					}}
				>
					<input type="hidden" id="edit-category-id" name="categoryId" value="" />
					<div class="space-y-4">
						<div>
							<label for="edit-name" class="block text-sm font-medium mb-2 dark:text-white">Name</label>
							<input
								type="text"
								id="edit-name"
								name="name"
								required
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
								placeholder="Enter category name"
							/>
						</div>
					</div>
					<div
						class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700 mt-4"
					>
						<button
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
							onclick={() => closeModal("#editCategoryModal")}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none"
							style="background-color: {secondaryColor}; color: {secondaryTextColor};"
						>
							Update Category
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<!-- Delete Category Modal -->
<div
	id="deleteCategoryModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="deleteCategoryModalLabel"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
	>
		<div
			class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="deleteCategoryModalLabel" class="font-bold text-gray-800 dark:text-white">Delete Category</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
					onclick={() => closeModal("#deleteCategoryModal")}
				>
					<span class="sr-only">Close</span>
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
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>
			<div class="p-4 overflow-y-auto">
				<p class="text-gray-800 dark:text-neutral-400">
					Are you sure you want to delete the category <strong>"{categoryToDelete?.name}"</strong>? This action cannot be undone.
				</p>
			</div>
			<div
				class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700"
			>
				<button
					type="button"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
					onclick={() => closeModal("#deleteCategoryModal")}
				>
					Cancel
				</button>
				<form
					method="POST"
					action="?/delete-category"
					use:enhance={() => {
						return async ({ result }) => {
							await handleDeleteCategory(result);
							closeModal("#deleteCategoryModal");
						};
					}}
					class="inline"
				>
					<input type="hidden" name="categoryId" value={categoryToDelete?.id || ''} />
					<button
						type="submit"
						class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-red-600 text-white hover:bg-red-700 focus:outline-hidden focus:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
					>
						Delete
					</button>
				</form>
			</div>
		</div>
	</div>
</div>
