<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { onMount } from "svelte";

	let { data } = $props();

	// State for merchant data
	let merchants: any[] = $state([]);
	let pagination = $state({
		currentPage: 1,
		totalPages: 0,
		totalMerchants: 0,
		hasNextPage: false,
		hasPrevPage: false,
		limit: 10
	});
	let loading = $state(true);
	let error = $state('');

	// State for delete confirmation modal
	let showDeleteModal = $state(false);
	let merchantToDelete: any = $state(null);
	let deleting = $state(false);

	// Compute delete behavior based on merchant status
	$derived: {
		if (merchantToDelete) {
			merchantToDelete.isActiveStatus = Boolean(merchantToDelete.isActive);
			merchantToDelete.deleteType = merchantToDelete.isActiveStatus ? 'deactivate' : 'permanent';
			merchantToDelete.deleteAction = merchantToDelete.isActiveStatus ? 'Deactivate' : 'Delete Forever';
			merchantToDelete.deleteDescription = merchantToDelete.isActiveStatus 
				? 'This will deactivate the merchant. You can reactivate it later.' 
				: 'This will permanently delete the merchant and cannot be undone.';
		}
	}

	// Function to format date
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Function to truncate text
	function truncateText(text: string, maxLength: number) {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}

	// Function to fetch merchants from API
	async function fetchMerchants(pageNum: number = 1, limit: number = 10, search: string = '') {
		try {
			loading = true;
			error = '';
			
			const params = new URLSearchParams({
				page: pageNum.toString(),
				limit: limit.toString(),
			});
			
			if (search) {
				params.set('search', search);
			}

			const response = await fetch(`/api/merchants?${params}`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to fetch merchants');
			}

			if (result.success) {
				merchants = result.merchants;
				pagination = result.pagination;
			} else {
				throw new Error(result.error || 'Failed to fetch merchants');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			merchants = [];
			pagination = {
				currentPage: 1,
				totalPages: 0,
				totalMerchants: 0,
				hasNextPage: false,
				hasPrevPage: false,
				limit: 10
			};
		} finally {
			loading = false;
		}
	}

	// Function to navigate to page
	async function navigateToPage(pageNum: number) {
		const url = new URL(window.location.href);
		url.searchParams.set('page', pageNum.toString());
		
		// Update URL without full page reload
		history.pushState({}, '', url.toString());
		
		// Fetch new data
		await fetchMerchants(pageNum);
	}

	// Function to show delete confirmation
	function confirmDelete(merchant: any) {
		merchantToDelete = merchant;
		showDeleteModal = true;
	}

	// Function to cancel delete
	function cancelDelete(event?: Event) {
		// Prevent event bubbling if called from backdrop click
		if (event) {
			event.stopPropagation();
		}
		showDeleteModal = false;
		merchantToDelete = null;
	}

	// Function to delete merchant
	async function deleteMerchant() {
		if (!merchantToDelete) return;

		try {
			deleting = true;
			const response = await fetch(`/api/merchants/${merchantToDelete.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to delete merchant');
			}

			if (result.success) {
				// Remove from local state
				merchants = merchants.filter(m => m.id !== merchantToDelete.id);
				
				// Update pagination counts
				pagination.totalMerchants -= 1;
				
				// Close modal
				showDeleteModal = false;
				merchantToDelete = null;
				
				// Refresh data to ensure consistency
				await fetchMerchants(pagination.currentPage);
			} else {
				throw new Error(result.error || 'Failed to delete merchant');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete merchant';
		} finally {
			deleting = false;
		}
	}

	// Load initial data when component mounts
	onMount(async () => {
		const currentPage = parseInt($page.url.searchParams.get('page') || '1');
		await fetchMerchants(currentPage);
	});

	// Watch for URL changes
	$effect(() => {
		const currentPage = parseInt($page.url.searchParams.get('page') || '1');
		if (currentPage !== pagination.currentPage && !loading) {
			fetchMerchants(currentPage);
		}
	});
</script>

<div class="m-4">
	<!-- Header Section -->
	<div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-2xl font-semibold text-gray-800 dark:text-neutral-200">
				Merchant Management
			</h2>
			<p class="text-sm text-gray-600 dark:text-neutral-400">
				Manage your merchants and their settings
			</p>
		</div>
		<div class="mt-4 sm:mt-0">
			<a
				href="/dashboard/merchant/add"
				class="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
			>
				<svg class="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 12h14"/>
					<path d="M12 5v14"/>
				</svg>
				Add New Merchant
			</a>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
		<div class="bg-white rounded-xl shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center dark:bg-blue-800/30">
						<svg class="w-4 h-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
						</svg>
					</div>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-gray-500 dark:text-neutral-400">Total Merchants</p>
					<p class="text-lg font-semibold text-gray-900 dark:text-neutral-200">
						{loading ? '...' : pagination.totalMerchants}
					</p>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center dark:bg-green-800/30">
						<svg class="w-4 h-4 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
						</svg>
					</div>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-gray-500 dark:text-neutral-400">Active Merchants</p>
					<p class="text-lg font-semibold text-gray-900 dark:text-neutral-200">
						{loading ? '...' : merchants.filter(m => m.isActive).length}
					</p>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center dark:bg-yellow-800/30">
						<svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 2v20M2 12h20"/>
						</svg>
					</div>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-gray-500 dark:text-neutral-400">This Page</p>
					<p class="text-lg font-semibold text-gray-900 dark:text-neutral-200">
						{loading ? '...' : merchants.length}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Merchants Table -->
	<div class="bg-white rounded-xl shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
		<div class="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
			<h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">
				Merchants List
			</h3>
		</div>

		<!-- Error State -->
		{#if error}
			<div class="px-6 py-12 text-center">
				<div class="max-w-md mx-auto">
					<svg class="mx-auto h-12 w-12 text-red-400 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
					</svg>
					<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-neutral-200">Error Loading Merchants</h3>
					<p class="mt-2 text-sm text-gray-500 dark:text-neutral-400">{error}</p>
					<div class="mt-6">
						<button
							onclick={() => fetchMerchants(pagination.currentPage)}
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<svg class="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
								<path d="M21 3v5h-5"/>
								<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
								<path d="M3 21v-5h5"/>
							</svg>
							Try Again
						</button>
					</div>
				</div>
			</div>
		<!-- Loading State -->
		{:else if loading}
			<div class="px-6 py-12 text-center">
				<div class="max-w-md mx-auto">
					<div class="animate-spin mx-auto h-12 w-12 text-blue-600 dark:text-blue-400">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					</div>
					<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-neutral-200">Loading Merchants</h3>
					<p class="mt-2 text-sm text-gray-500 dark:text-neutral-400">Please wait while we fetch your merchants...</p>
				</div>
			</div>
		<!-- Data Display -->
		{:else if merchants.length > 0}
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
					<thead class="bg-gray-50 dark:bg-neutral-800">
						<tr>
							<th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-400">
								Merchant
							</th>
							<th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-400">
								Subdomain
							</th>
							<th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-400">
								Address
							</th>
							<th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-400">
								Status
							</th>
							<th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-400">
								Created
							</th>
							<th scope="col" class="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase dark:text-neutral-400">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 dark:divide-neutral-700">
						{#each merchants as merchant}
							<tr class="hover:bg-gray-50 dark:hover:bg-neutral-700">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="flex-shrink-0 h-10 w-10">
											{#if merchant.logo}
												<img class="h-10 w-10 rounded-lg object-cover" src={merchant.logo} alt="{merchant.name} logo" />
											{:else}
												<div class="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
													<span class="text-white font-semibold text-sm">{merchant.name.charAt(0).toUpperCase()}</span>
												</div>
											{/if}
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900 dark:text-neutral-200">
												{merchant.name}
											</div>
											{#if merchant.slogan}
												<div class="text-sm text-gray-500 dark:text-neutral-400">
													{truncateText(merchant.slogan, 30)}
												</div>
											{/if}
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900 dark:text-neutral-200">
										<code class="bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded text-xs">
											{merchant.slug}.tukoo.web.id
										</code>
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm text-gray-500 dark:text-neutral-400 max-w-xs">
										{truncateText(merchant.address, 50)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if merchant.isActive}
										<span class="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500">
											<span class="w-1.5 h-1.5 inline-block bg-green-800 rounded-full dark:bg-green-500"></span>
											Active
										</span>
									{:else}
										<span class="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-500">
											<span class="w-1.5 h-1.5 inline-block bg-red-800 rounded-full dark:bg-red-500"></span>
											Inactive
										</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
									{formatDate(merchant.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
									<div class="flex items-center justify-end gap-x-2">
										<button
											type="button"
											class="text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400"
											onclick={() => goto(`/dashboard/merchant/${merchant.id}`)}
										>
											View
										</button>
										<button
											type="button"
											class="text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-200"
											onclick={() => goto(`/dashboard/merchant/${merchant.uuid}`)}
										>
												Manage
										</button>
										<button
											type="button"
											class="{merchant.isActive ? 'text-orange-600 hover:text-orange-900 dark:text-orange-500 dark:hover:text-orange-400' : 'text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400'}"
											onclick={() => confirmDelete(merchant)}
										>
											{merchant.isActive ? 'Deactivate' : 'Delete'}
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if pagination.totalPages > 1}
				<div class="px-6 py-4 border-t border-gray-200 dark:border-neutral-700">
					<div class="flex items-center justify-between">
						<div class="text-sm text-gray-500 dark:text-neutral-400">
							Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalMerchants)} of {pagination.totalMerchants} merchants
						</div>
						
						<div class="flex items-center space-x-2">
							<!-- Previous Button -->
							<button
								type="button"
								disabled={!pagination.hasPrevPage || loading}
								onclick={() => navigateToPage(pagination.currentPage - 1)}
								class="py-2 px-3 inline-flex items-center gap-x-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
							>
								<svg class="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="m15 18-6-6 6-6"/>
								</svg>
								Previous
							</button>

							<!-- Page Numbers -->
							{#each Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
								const startPage = Math.max(1, pagination.currentPage - 2);
								return startPage + i;
							}).filter(page => page <= pagination.totalPages) as page}
								<button
									type="button"
									disabled={loading}
									onclick={() => navigateToPage(page)}
									class="py-2 px-3 inline-flex items-center text-sm rounded-lg {page === pagination.currentPage 
										? 'border border-blue-600 bg-blue-600 text-white' 
										: 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700'
									}"
								>
									{page}
								</button>
							{/each}

							<!-- Next Button -->
							<button
								type="button"
								disabled={!pagination.hasNextPage || loading}
								onclick={() => navigateToPage(pagination.currentPage + 1)}
								class="py-2 px-3 inline-flex items-center gap-x-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
							>
								Next
								<svg class="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="m9 18 6-6-6-6"/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/if}
		{:else}
			<!-- Empty State -->
			<div class="px-6 py-12 text-center">
				<div class="max-w-md mx-auto">
					<svg class="mx-auto h-12 w-12 text-gray-400 dark:text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-2.83m0 0a3.001 3.001 0 016.75 0m0 0a3.001 3.001 0 003.75 2.83m0 0a3.001 3.001 0 013.75-2.83m0 0V21m-9 0h9"/>
					</svg>
					<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-neutral-200">No merchants found</h3>
					<p class="mt-2 text-sm text-gray-500 dark:text-neutral-400">
						Get started by creating your first merchant.
					</p>
					<div class="mt-6">
						<a
							href="/dashboard/merchant/add"
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<svg class="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M5 12h14"/>
								<path d="M12 5v14"/>
							</svg>
							Add Your First Merchant
						</a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>



<div id="hs-delete-merchant-modal" class="hs-overlay size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto transition-all duration-300 {showDeleteModal ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}" role="dialog" tabindex="-1" aria-labelledby="hs-delete-merchant-modal-label">
	
	<button
		type="button"
		class="fixed inset-0 bg-gray-900/20 bg-opacity-50 dark:bg-opacity-80 transition-opacity duration-300 {showDeleteModal ? 'opacity-100' : 'opacity-0'}"
		aria-label="Close modal"
		tabindex="0"
		onclick={cancelDelete}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { cancelDelete(e); } }}
	></button>
	
	<div class="hs-overlay-animation-target {showDeleteModal ? 'scale-100 opacity-100' : 'scale-90 opacity-0'} ease-out transition-all duration-300 sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center relative z-10">
		{#if merchantToDelete}
			<div
				role="dialog"
				tabindex="0"
				class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70 relative"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); } }}
				aria-modal="true"
			>
				<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
					<h3 id="hs-delete-merchant-modal-label" class="font-bold text-gray-800 dark:text-white">
						{merchantToDelete.deleteAction} Merchant
					</h3>
					<button type="button" onclick={cancelDelete} class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600" aria-label="Close">
						<span class="sr-only">Close</span>
						<svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 6 6 18"></path>
							<path d="m6 6 12 12"></path>
						</svg>
					</button>
				</div>
				
				<div class="p-4 overflow-y-auto">
					<!-- Warning Icon -->
					<div class="flex justify-center mb-4">
						<span class="inline-flex justify-center items-center size-[62px] rounded-full border-4 {merchantToDelete.deleteType === 'permanent' ? 'border-red-50 bg-red-100 text-red-500 dark:bg-red-600 dark:border-red-700 dark:text-red-100' : 'border-orange-50 bg-orange-100 text-orange-500 dark:bg-orange-600 dark:border-orange-700 dark:text-orange-100'}">
							<svg class="flex-shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
								<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
							</svg>
						</span>
					</div>

					<div class="text-center">
						<p class="text-gray-800 dark:text-neutral-400">
							Are you sure you want to {merchantToDelete.deleteType === 'permanent' ? 'permanently delete' : 'deactivate'} <strong>"{merchantToDelete.name}"</strong>?
						</p>
						<p class="mt-2 text-sm text-gray-500 dark:text-neutral-500">
							{merchantToDelete.deleteDescription}
						</p>

						<!-- Merchant Preview -->
						<div class="mt-4 flex justify-center">
							<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg dark:bg-neutral-700">
								{#if merchantToDelete.logo}
									<img class="h-8 w-8 rounded object-cover" src={merchantToDelete.logo} alt="{merchantToDelete.name} logo" />
								{:else}
									<div class="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
										<span class="text-white font-semibold text-xs">{merchantToDelete.name.charAt(0).toUpperCase()}</span>
									</div>
								{/if}
								<div class="text-left">
									<p class="font-medium text-gray-900 dark:text-neutral-200">{merchantToDelete.name}</p>
									<p class="text-xs text-gray-500 dark:text-neutral-400">{merchantToDelete.slug}.hostdomain.com</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				
				<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700">
					<button type="button" onclick={cancelDelete} class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700">
						Cancel
					</button>
					<button type="button" onclick={deleteMerchant} disabled={deleting} class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent {merchantToDelete.deleteType === 'permanent' ? 'bg-red-600 hover:bg-red-700 focus:outline-hidden focus:bg-red-700' : 'bg-orange-600 hover:bg-orange-700 focus:outline-hidden focus:bg-orange-700'} text-white disabled:opacity-50 disabled:pointer-events-none">
						{#if deleting}
							<div class="animate-spin inline-block size-4 border-[3px] border-current border-t-transparent text-white rounded-full" role="status" aria-label="loading">
								<span class="sr-only">Loading...</span>
							</div>
							{merchantToDelete.deleteType === 'permanent' ? 'Deleting...' : 'Deactivating...'}
						{:else}
							Delete
						{/if}
					</button>
				</div>
			</div>
		{:else}
			<div class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70 relative">
				<div class="p-4">
					<p class="text-center text-gray-500">Loading...</p>
				</div>
			</div>
		{/if}
	</div>
</div>
