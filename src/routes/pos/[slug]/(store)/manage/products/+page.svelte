<script lang="ts">
	import { enhance, applyAction } from "$app/forms";
	import { onMount } from "svelte";
	import { afterNavigate } from "$app/navigation";
	import { toast } from "$lib/stores/toast.js";

	let { data }: any = $props();

	let products: any[] = $state([]);
	let pagination = $state({ total: 0, page: 1, limit: 10, totalPages: 1 });
	let loading = $state(false);
	
	
	let selectedCategoryId: number | null = $state(null);
	let searchQuery = $state('');

	let secondaryColor = $state(data.merchant?.secondaryColor || '#3b82f6');
	let secondaryTextColor = $state(data.merchant?.secondaryTextColor || '#ffffff');

	$effect(() => {
		if (data.merchant) {
			secondaryColor = data.merchant.secondaryColor || '#3b82f6';
			secondaryTextColor = data.merchant.secondaryTextColor || '#ffffff';
		}
	});

	// Fetch products from API
	async function fetchProducts(pageNum: number = 1, limitNum: number = 10) {
		loading = true;
		try {
			let url = `/api/products?page=${pageNum}&limit=${limitNum}`;
			
			if (selectedCategoryId) {
				url += `&categoryId=${selectedCategoryId}`;
			}
			
			if (searchQuery.trim()) {
				url += `&search=${encodeURIComponent(searchQuery.trim())}`;
			}
			
			const response = await fetch(url);
			const result = await response.json();
			
			if (result.success) {
				products = result.products;
				pagination = result.pagination;
			} else {
				toast.error("Failed to load products");
			}
		} catch (error) {
			console.error("Error fetching products:", error);
			toast.error("Failed to load products");
		} finally {
			loading = false;
		}
	}
	
	// Handle category filter
	function filterByCategory(categoryId: number | null) {
		selectedCategoryId = categoryId;
		fetchProducts(1, pagination.limit);
	}
	
	// Handle search
	let searchTimeout: any;
	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			fetchProducts(1, pagination.limit);
		}, 300);
	}

	// Refresh products with current pagination
	async function refreshProducts() {
		await fetchProducts(pagination.page, pagination.limit);
	}

	// Delete product modal
	let productToDelete: any = $state(null);

	function openDeleteProductModal(product: any) {
		productToDelete = product;
		const modalEl = document.getElementById('deleteProductModal');
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

	async function handleDeleteProduct(result: any): Promise<void> {
		if (result?.type === "success") {
			toast.success("Product deleted successfully");
			await refreshProducts();
		} else {
			toast.error((result?.data as any)?.message || "Failed to delete product");
		}
		if (result) await applyAction(result);
	}

	function closeModal(modalId: string) {
		window.HSOverlay.close(modalId);
		
	}

	
	function formatPrice(price: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	}

	onMount(() => {
		// Fetch products on mount
		const urlParams = new URLSearchParams(window.location.search);
		const page = parseInt(urlParams.get('page') || '1');
		const limit = parseInt(urlParams.get('limit') || '10');
		fetchProducts(page, limit);

		// Initialize Preline UI
		setTimeout(() => {
			if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);

		// Add event listeners to clean up body overflow when modals close
		const modalIds = ['#deleteProductModal'];
		
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
</script>

<div class="m-4">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold dark:text-white">Products</h2>
			<p class="text-sm text-gray-600 dark:text-neutral-400">Manage your store products</p>
		</div>
		<div class="flex items-center space-x-2">
			<a
				href="/manage/products/add"
				class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none"
				style="background-color: {secondaryColor}; color: {secondaryTextColor};"
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
				Add Product
			</a>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="mb-4">
		<div class="relative">
			<div class="absolute inset-y-0 start-0 flex items-center pointer-events-none z-20 ps-3.5">
				<svg class="shrink-0 size-4 text-gray-400 dark:text-white/60" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.3-4.3"></path>
				</svg>
			</div>
			<input
				type="text"
				bind:value={searchQuery}
				oninput={handleSearch}
				placeholder="Search products..."
				class="py-2 border ps-10 pe-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-600"
			/>
		</div>
	</div>

	<!-- Category Tabs (Horizontal Scroll with Underline) -->
	<div class="mb-6">
		<div class="border-b border-gray-200 dark:border-neutral-700">
			<div class="overflow-x-auto hide-scrollbar">
				<nav class="flex gap-x-5" role="tablist" style="min-width: min-content;">
					<!-- All Tab -->
					<button
						type="button"
						onclick={() => filterByCategory(null)}
						class="py-4 px-1 inline-flex items-center gap-x-2 border-b-2 text-sm whitespace-nowrap focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none transition-colors"
						class:font-semibold={selectedCategoryId === null}
						style={selectedCategoryId === null 
							? `border-color: ${secondaryColor}; color: ${secondaryColor};`
							: 'border-color: transparent; color: #6b7280;'}
					>
						All
					</button>
					
					<!-- Category Tabs -->
					{#each data.categories as category}
						<button
							type="button"
							onclick={() => filterByCategory(category.id)}
							class="py-4 px-1 inline-flex items-center gap-x-2 border-b-2 text-sm whitespace-nowrap focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none transition-colors hover:text-blue-600 dark:hover:text-blue-500"
							class:font-semibold={selectedCategoryId === category.id}
							style={selectedCategoryId === category.id 
								? `border-color: ${secondaryColor}; color: ${secondaryColor};`
								: 'border-color: transparent; color: #6b7280;'}
						>
							{category.name}
						</button>
					{/each}
				</nav>
			</div>
		</div>
	</div>

	<!-- Products Grid -->
	{#if loading}
		<div class="text-center py-12">
			<span class="text-sm text-gray-600 dark:text-neutral-400">Loading...</span>
		</div>
	{:else if products.length === 0}
		<div class="text-center py-12">
			<span class="text-sm text-gray-600 dark:text-neutral-400">No products found</span>
		</div>
	{:else}
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each products as product}
				<div class="flex flex-col bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-neutral-800 dark:border-neutral-700">
					<!-- Product Image -->
					<div class="relative h-48 w-full">
						{#if product.photo}
							<img src={product.photo} alt={product.name} class="h-full w-full object-cover rounded-t-xl" />
						{:else}
							<div class="h-full w-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center rounded-t-xl">
								<svg class="size-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
						{/if}
					</div>

					<!-- Product Info -->
					<div class="p-4 flex-1 flex flex-col">
						<!-- Product Name -->
						<h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200 mb-2">{product.name}</h3>

						<!-- Price -->
						<p class="text-xl font-bold text-gray-900 dark:text-white mb-3">{formatPrice(product.price)}</p>

						<!-- Stock Badge -->
						<div class="mb-3">
							{#if product.infiniteStock}
								<span class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-500/10 dark:text-blue-500">
									∞ Infinite Stock
								</span>
							{:else}
								<span class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-neutral-700 dark:text-neutral-300">
									Stock: {product.stock}
								</span>
							{/if}
						</div>

						<!-- Category Badge -->
						{#if product.category}
							<div class="mb-3">
								<span 
									class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full"
									style="background-color: {secondaryColor}20; color: {secondaryColor};"
								>
									{product.category}
								</span>
							</div>
						{/if}

						<!-- Variants -->
						{#if product.variants && product.variants.length > 0}
							{@const variantGroups = product.variants.reduce((acc: Record<string, string[]>, v: { variantName: string; variantValue: string }) => {
								if (!acc[v.variantName]) acc[v.variantName] = [];
								acc[v.variantName].push(v.variantValue);
								return acc;
							}, {} as Record<string, string[]>)}
							<div class="mb-4 space-y-2">
								{#each Object.entries(variantGroups) as entry}
									{@const variantName = entry[0] as string}
									{@const values = entry[1] as string[]}
									<div>
										<p class="text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">{variantName}:</p>
										<div class="flex flex-wrap gap-1">
											{#each values as value}
												<span 
													class="py-0.5 px-2 inline-flex items-center text-xs font-medium rounded-full"
													style="background-color: {secondaryColor}20; color: {secondaryColor};"
												>
													{value}
												</span>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Actions -->
						<div class="mt-auto flex items-center gap-x-2 pt-3 border-t border-gray-200 dark:border-neutral-700">
							<a
								href="/manage/products/{product.id}/edit"
								class="flex-1 py-2 px-3 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
								style="background-color: {secondaryColor}; color: {secondaryTextColor};"
							>
								Edit
							</a>
							<button
								type="button"
								class="flex-1 py-2 px-3 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-red-500 text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50 disabled:opacity-50 disabled:pointer-events-none dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/10 dark:focus:bg-red-900/10"
								onclick={() => openDeleteProductModal(product)}
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if pagination.totalPages > 1}
			<div class="mt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl dark:bg-neutral-800 dark:border-neutral-700">
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
										class="min-h-[38px] min-w-[38px] flex justify-center items-center text-white py-2 px-3 text-sm rounded-lg focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
										style="background-color: {secondaryColor};"
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
	{/if}
</div>

<!-- Delete Product Modal -->
<div
	id="deleteProductModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="deleteProductModalLabel"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
	>
		<div
			class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="deleteProductModalLabel" class="font-bold text-gray-800 dark:text-white">Delete Product</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
					onclick={() => closeModal("#deleteProductModal")}
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
					Are you sure you want to delete the product <strong>"{productToDelete?.name}"</strong>? This action cannot be undone.
				</p>
			</div>
			<div
				class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700"
			>
				<button
					type="button"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
					onclick={() => closeModal("#deleteProductModal")}
				>
					Cancel
				</button>
				<form
					method="POST"
					action="?/delete-product"
					use:enhance={() => {
						return async ({ result }) => {
							await handleDeleteProduct(result);
							closeModal("#deleteProductModal");
						};
					}}
					class="inline"
				>
					<input type="hidden" name="productId" value={productToDelete?.id || ''} />
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

<style>
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
