<script lang="ts">
	import { enhance, applyAction } from "$app/forms";
	import { onMount } from "svelte";
	import { afterNavigate } from "$app/navigation";
	import { toast } from "$lib/stores/toast.js";
	import QRCode from "qrcode";

	let { data }: any = $props();

	let secondaryColor = $state(data.merchant?.secondaryColor || "#3b82f6");
	let secondaryTextColor = $state(data.merchant?.secondaryTextColor || "#ffffff");

	$effect(() => {
		if (data.merchant) {
			secondaryColor = data.merchant.secondaryColor || "#3b82f6";
			secondaryTextColor = data.merchant.secondaryTextColor || "#ffffff";
		}
	});

	// Selected table and form states
	let selectedTable: any = $state(null);
	let tableName = $state("");
	let tableCapacity = $state(4);
	let allowPayAtCashier = $state(true);

	// QR Code generation
	let currentQrUrl = $state("");
	let qrCodeDataUrl = $state("");

	// Pagination and data loading
	let tables = $state<any[]>([]);
	let currentPage = $state(1);
	let itemsPerPage = $state(9); // 3x3 grid
	let totalItems = $state(0);
	let isLoading = $state(false);

	const totalPages = $derived(Math.ceil(totalItems / itemsPerPage));

	async function loadTables(page: number) {
		isLoading = true;
		try {
			const response = await fetch(`/api/tables?merchantId=${data.merchant.id}&page=${page}&limit=${itemsPerPage}`);
			const result = await response.json();

			if (result.success) {
				tables = result.tables;
				totalItems = result.total;
				currentPage = page;
			} else {
				toast.error("Failed to load tables");
			}
		} catch (error) {
			console.error("Error loading tables:", error);
			toast.error("Failed to load tables");
		} finally {
			isLoading = false;
		}
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			loadTables(page);
		}
	}

	function resetForm() {
		tableName = "";
		tableCapacity = 4;
		allowPayAtCashier = true;
	}

	function openEditModal(table: any) {
		selectedTable = table;
		tableName = table.name;
		tableCapacity = table.capacity;
		allowPayAtCashier = table.allowPayAtCashier === 1;

		const modalEl = document.getElementById("editTableModal");
		if (!modalEl) return;

		if (typeof window !== "undefined" && (window as any).HSOverlay) {
			try {
				const HSOverlay = (window as any).HSOverlay;
				new HSOverlay(modalEl).open();
			} catch (e) {
				console.error("Error opening modal:", e);
			}
		}
	}

	function openDeleteModal(table: any) {
		selectedTable = table;

		const modalEl = document.getElementById("deleteTableModal");
		if (!modalEl) return;

		if (typeof window !== "undefined" && (window as any).HSOverlay) {
			try {
				const HSOverlay = (window as any).HSOverlay;
				new HSOverlay(modalEl).open();
			} catch (e) {
				console.error("Error opening modal:", e);
			}
		}
	}

	async function openQrModal(table: any) {
		selectedTable = table;
		// Generate QR URL from table data
		const baseUrl = window.location.origin;
		currentQrUrl = `${baseUrl}/order/${table.qrToken}`;

		// Generate QR code using library
		try {
			qrCodeDataUrl = await QRCode.toDataURL(currentQrUrl, {
				width: 300,
				margin: 2,
				errorCorrectionLevel: "M",
				color: {
					dark: "#000000",
					light: "#FFFFFF"
				}
			});
		} catch (error) {
			console.error("QR generation error:", error);
			toast.error("Failed to generate QR code");
		}

		const modalEl = document.getElementById("qrCodeModal");
		if (!modalEl) return;

		if (typeof window !== "undefined" && (window as any).HSOverlay) {
			try {
				const HSOverlay = (window as any).HSOverlay;
				new HSOverlay(modalEl).open();
			} catch (e) {
				console.error("Error opening modal:", e);
			}
		}
	}

	function extractMessage(data: any): string {
		const m = data?.message;
		if (typeof m === "string") return m;
		if (m === undefined || m === null) return "";
		try {
			return JSON.stringify(m);
		} catch {
			return String(m);
		}
	}

	async function handleSubmit(result: any, successMessage: string): Promise<void> {
		if (result?.type === "success") {
			toast.success(extractMessage(result?.data) || successMessage);
			// Reload current page data
			await loadTables(currentPage);
		} else {
			toast.error(extractMessage(result?.data) || "Action failed");
		}
		if (result) await applyAction(result);
	}

	function downloadQrCode() {
		if (!qrCodeDataUrl) return;

		// Create download link from data URL
		const link = document.createElement("a");
		link.href = qrCodeDataUrl;
		link.download = `${selectedTable?.name.replace(/\s+/g, "-")}-qr.png`;
		link.click();
	}

	function closeModal(modalId: string) {
		window.HSOverlay.close(modalId);
		// Overflow cleanup is handled by the close.hs.overlay event listener
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard!");
	}

	function printQrCode() {
		if (!qrCodeDataUrl) return;

		const printWindow = window.open("", "_blank");
		if (printWindow) {
			printWindow.document.write(`
				<html>
					<head>
						<title>QR Code - ${selectedTable?.name}</title>
						<style>
							body { text-align: center; font-family: Arial, sans-serif; margin: 20px; }
							.qr-container { margin: 20px auto; }
							.table-info { margin: 20px 0; }
							img { border: 2px solid #000; }
						</style>
					</head>
					<body>
						<div class="table-info">
							<h2>${selectedTable?.name}</h2>
							<p>Capacity: ${selectedTable?.capacity} people</p>
							<p>Scan to order</p>
						</div>
						<div class="qr-container">
							<img src="${qrCodeDataUrl}" alt="QR Code" />
						</div>
						<p style="font-size: 12px; margin-top: 20px;">
							${currentQrUrl}
						</p>
					</body>
				</html>
			`);
			printWindow.document.close();
			printWindow.print();
		}
	}

	onMount(() => {
		
		loadTables(1);

		setTimeout(() => {
			if (typeof window !== "undefined" && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);

		
		const modalIds = ['#createTableModal', '#editTableModal', '#deleteTableModal', '#qrCodeModal'];
		
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
			if (typeof window !== "undefined" && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);
	});
</script>

<div class="m-4">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h2 class="text-2xl font-semibold dark:text-white">Table Management</h2>
			<p class="text-sm text-gray-600 dark:text-neutral-400">Manage restaurant tables and QR codes for self-ordering</p>
		</div>
		<button
			type="button"
			data-hs-overlay="#createTableModal"
			class="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent text-white disabled:opacity-50 disabled:pointer-events-none"
			style="background-color: {secondaryColor}; color: {secondaryTextColor};"
		>
			<svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add New Table
		</button>
	</div>

	<!-- Loading State -->
	{#if isLoading}
		<div class="flex justify-center items-center py-12">
			<div
				class="animate-spin inline-block size-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500"
				role="status"
				aria-label="loading"
			>
				<span class="sr-only">Loading...</span>
			</div>
		</div>
	{:else}
		<!-- Tables Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each tables as table}
				<div
					class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-neutral-800 dark:border-neutral-700"
				>
					<div class="flex justify-between items-start mb-4">
						<div>
							<h3 class="text-lg font-semibold text-gray-800 dark:text-white">{table.name}</h3>
							<p class="text-sm text-gray-500 dark:text-neutral-400">Capacity: {table.capacity} people</p>
						</div>
						<div class="flex items-center space-x-2">
							<!-- Status Badge -->
							<span
								class="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium {table.isActive
									? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
									: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}"
							>
								<span
									class="size-1.5 rounded-full {table.isActive
										? 'bg-green-800 dark:bg-green-400'
										: 'bg-red-800 dark:bg-red-400'}"
								></span>
								{table.isActive ? "Active" : "Inactive"}
							</span>
						</div>
					</div>

					<!-- Payment Option -->
					<div class="mb-4">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600 dark:text-neutral-400">Pay at Cashier:</span>
							<span
								class="text-sm font-medium {table.allowPayAtCashier
									? 'text-green-600 dark:text-green-400'
									: 'text-red-600 dark:text-red-400'}"
							>
								{table.allowPayAtCashier ? "Enabled" : "Disabled"}
							</span>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex flex-wrap gap-2 mb-4">
						<!-- QR Code Button -->
						<button
							type="button"
							onclick={() => openQrModal(table)}
							class="py-2 px-3 text-sm font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="size-4 inline mr-1"
								><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect
									width="5"
									height="5"
									x="3"
									y="16"
									rx="1"
								/><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path
									d="M3 12h.01"
								/><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path
									d="M12 21v-1"
								/></svg
							>
							
							QR Code
						</button>

						<!-- Edit Button -->
						<button
							type="button"
							onclick={() => openEditModal(table)}
							class="py-2 px-3 text-sm font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600 transition-colors"
						>
							<svg
								class="size-4 inline mr-1"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							Edit
						</button>

						<!-- Toggle Status -->
						<form
							method="POST"
							action="?/toggle-status"
							use:enhance={({ formData }) => {
								return async ({ result }) => {
									if (result?.type === "success") {
										toast.success((result as any).data?.message || "Status updated successfully");
										await loadTables(currentPage);
									} else {
										toast.error((result as any).data?.message || "Action failed");
									}
									if (result) await applyAction(result);
								};
							}}
						>
							<input type="hidden" name="id" value={table.id} />
							<button
								type="submit"
								class="py-2 px-3 text-sm font-medium rounded-lg transition-colors {table.isActive
									? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
									: 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'}"
							>
								{table.isActive ? "Deactivate" : "Activate"}
							</button>
						</form>

						<!-- Toggle Pay at Cashier -->
						<form
							method="POST"
							action="?/toggle-pay-cashier"
							use:enhance={({ formData }) => {
								return async ({ result }) => {
									if (result?.type === "success") {
										toast.success((result as any).data?.message || "Payment option updated");
										await loadTables(currentPage);
									} else {
										toast.error((result as any).data?.message || "Action failed");
									}
									if (result) await applyAction(result);
								};
							}}
						>
							<input type="hidden" name="id" value={table.id} />
							<button
								type="submit"
								class="py-2 px-3 text-sm font-medium rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 transition-colors"
								title={table.allowPayAtCashier ? "Disable pay at cashier" : "Enable pay at cashier"}
							>
								<svg
									class="size-4 inline mr-1"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
									/>
								</svg>
								{table.allowPayAtCashier ? "Disable" : "Enable"}
							</button>
						</form>
					</div>

					<!-- Danger Zone -->
					<div class="pt-4 border-t border-gray-200 dark:border-neutral-700">
						<button
							type="button"
							onclick={() => openDeleteModal(table)}
							class="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
						>
							<svg
								class="size-4 inline mr-1"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Delete Table
						</button>
					</div>
				</div>
			{/each}

			{#if tables.length === 0}
				<div class="col-span-full text-center py-12">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tables found</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">Get started by creating your first table.</p>
				</div>
			{/if}
		</div>

		<!-- Pagination Controls -->
		{#if totalPages > 1}
			<div class="flex justify-center items-center gap-2 mt-8">
				<button
					type="button"
					onclick={() => goToPage(currentPage - 1)}
					disabled={currentPage === 1 || isLoading}
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
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
						<path d="m15 18-6-6 6-6"></path>
					</svg>
					Previous
				</button>

				<div class="flex items-center gap-1">
					{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
						{#if page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)}
							<button
								type="button"
								onclick={() => goToPage(page)}
								disabled={isLoading}
								class="min-w-[40px] flex justify-center items-center py-2 px-3 text-sm rounded-lg focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none {page ===
								currentPage
									? 'bg-gray-200 text-gray-800 dark:bg-neutral-600 dark:text-white'
									: 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700'}"
							>
								{page}
							</button>
						{:else if page === currentPage - 2 || page === currentPage + 2}
							<span
								class="min-w-[40px] flex justify-center items-center py-2 px-3 text-sm text-gray-800 dark:text-white"
								>...</span
							>
						{/if}
					{/each}
				</div>

				<button
					type="button"
					onclick={() => goToPage(currentPage + 1)}
					disabled={currentPage === totalPages || isLoading}
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
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
						stroke-linejoin="round"
					>
						<path d="m9 18 6-6-6-6"></path>
					</svg>
				</button>
			</div>
		{/if}
	{/if}
</div>

<!-- Create Table Modal -->
<div
	id="createTableModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="createTableModalLabel"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
	>
		<div
			class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="createTableModalLabel" class="font-bold text-gray-800 dark:text-white">Create New Table</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
					onclick={() => {
						resetForm();
						closeModal("#createTableModal");
					}}
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
					action="?/create-table"
					use:enhance={() => {
						return async ({ result }) => {
							await handleSubmit(result, "Table created successfully");
							resetForm();
							closeModal("#createTableModal");
						};
					}}
				>
					<div class="space-y-4">
						<div>
							<label for="name" class="block text-sm font-medium mb-2 dark:text-white">Table Name</label>
							<input
								type="text"
								id="name"
								name="name"
								required
								bind:value={tableName}
								placeholder="e.g., Table 1, Meja A1"
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							/>
						</div>

						<div>
							<label for="capacity" class="block text-sm font-medium mb-2 dark:text-white">Capacity (people)</label>
							<input
								type="number"
								id="capacity"
								name="capacity"
								required
								min="1"
								max="20"
								bind:value={tableCapacity}
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							/>
						</div>

						<div class="flex items-center">
							<input
								type="checkbox"
								id="allowPayAtCashier"
								name="allowPayAtCashier"
								bind:checked={allowPayAtCashier}
								value="true"
								class="shrink-0 mt-0.5 border-gray-200 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800"
							/>
							<label for="allowPayAtCashier" class="ml-3 block text-sm text-gray-700 dark:text-neutral-300">
								Allow "Pay at Cashier" option
							</label>
						</div>
						<p class="text-xs text-gray-500 dark:text-neutral-400">
							Disable this for tables outside direct supervision to prevent fake orders
						</p>
					</div>

					<div class="flex justify-end gap-x-2 mt-4">
						<button
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
							onclick={() => {
								resetForm();
								closeModal("#createTableModal");
							}}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent text-white disabled:opacity-50 disabled:pointer-events-none"
							style="background-color: {secondaryColor};"
						>
							Create Table
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<!-- Edit Table Modal -->
<div
	id="editTableModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="editTableModalLabel"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
	>
		<div
			class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="editTableModalLabel" class="font-bold text-gray-800 dark:text-white">Edit Table</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
					onclick={() => closeModal("#editTableModal")}
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
					action="?/update-table"
					use:enhance={() => {
						return async ({ result }) => {
							await handleSubmit(result, "Table updated successfully");
							closeModal("#editTableModal");
						};
					}}
				>
					<input type="hidden" name="id" value={selectedTable?.id} />

					<div class="space-y-4">
						<div>
							<label for="edit-name" class="block text-sm font-medium mb-2 dark:text-white">Table Name</label>
							<input
								type="text"
								id="edit-name"
								name="name"
								required
								bind:value={tableName}
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							/>
						</div>

						<div>
							<label for="edit-capacity" class="block text-sm font-medium mb-2 dark:text-white">Capacity (people)</label
							>
							<input
								type="number"
								id="edit-capacity"
								name="capacity"
								required
								min="1"
								max="20"
								bind:value={tableCapacity}
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							/>
						</div>

						<div class="flex items-center">
							<input
								type="checkbox"
								id="edit-allowPayAtCashier"
								name="allowPayAtCashier"
								bind:checked={allowPayAtCashier}
								value="true"
								class="shrink-0 mt-0.5 border-gray-200 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800"
							/>
							<label for="edit-allowPayAtCashier" class="ml-3 block text-sm text-gray-700 dark:text-neutral-300">
								Allow "Pay at Cashier" option
							</label>
						</div>
					</div>

					<div class="flex justify-end gap-x-2 mt-4">
						<button
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
							onclick={() => closeModal("#editTableModal")}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent text-white disabled:opacity-50 disabled:pointer-events-none"
							style="background-color: {secondaryColor};"
						>
							Update Table
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
<div
	id="deleteTableModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="deleteTableModalLabel"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
	>
		<div
			class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="deleteTableModalLabel" class="font-bold text-red-600 dark:text-red-400">Delete Table</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
					onclick={() => closeModal("#deleteTableModal")}
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
				<div class="flex items-start mb-4">
					<div class="flex-shrink-0">
						<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm text-gray-700 dark:text-neutral-300">
							Are you sure you want to delete <strong class="text-gray-900 dark:text-white"
								>"{selectedTable?.name}"</strong
							>?
						</p>
						<p class="text-sm text-gray-500 dark:text-neutral-400 mt-1">
							This action cannot be undone and will remove the QR code access as well.
						</p>
					</div>
				</div>

				<form
					method="POST"
					action="?/delete-table"
					use:enhance={() => {
						return async ({ result }) => {
							await handleSubmit(result, "Table deleted successfully");
							closeModal("#deleteTableModal");
						};
					}}
				>
					<input type="hidden" name="id" value={selectedTable?.id} />

					<div class="flex justify-end gap-x-2">
						<button
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
							onclick={() => closeModal("#deleteTableModal")}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
						>
							Delete Table
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<!-- QR Code Modal -->
<div
	id="qrCodeModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="qrCodeModalLabel"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
	>
		<div
			class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="qrCodeModalLabel" class="font-bold text-gray-800 dark:text-white">QR Code for {selectedTable?.name}</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
					onclick={() => closeModal("#qrCodeModal")}
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
				<div class="text-center">
					<!-- QR Code Display -->
					<div class="inline-block p-4 bg-white rounded-lg shadow-sm mb-4 dark:bg-neutral-700">
						{#if qrCodeDataUrl}
							<img
								src={qrCodeDataUrl}
								alt="QR Code for {selectedTable?.name}"
								class="w-64 h-64 border-2 border-gray-200 dark:border-neutral-600"
							/>
						{:else}
							<div class="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-neutral-800">
								<p class="text-gray-500 dark:text-neutral-400">Generating QR...</p>
							</div>
						{/if}
					</div>

					<div class="space-y-4">
						<!-- URL Display -->
						<div class="p-3 bg-gray-50 rounded-lg text-left dark:bg-neutral-700">
							<p class="text-xs text-gray-500 dark:text-neutral-400 mb-1">Order URL:</p>
							<p class="text-sm font-mono text-gray-800 dark:text-neutral-200 break-all">{currentQrUrl}</p>
							<button
								type="button"
								onclick={() => copyToClipboard(currentQrUrl)}
								class="mt-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors inline-flex items-center gap-1"
							>
								<svg
									class="size-3"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								Copy URL
							</button>
						</div>

						<!-- Action Buttons -->
						<div class="grid grid-cols-2 gap-3">
							<button
								type="button"
								onclick={downloadQrCode}
								class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors inline-flex items-center justify-center gap-2"
							>
								<svg
									class="size-4"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								Download
							</button>

							<button
								type="button"
								onclick={printQrCode}
								class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
							>
								<svg
									class="size-4"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
									/>
								</svg>
								Print
							</button>

							<form
								method="POST"
								action="?/regenerate-qr"
								class="col-span-2"
								use:enhance={({ formData }) => {
									return async ({ result }) => {
										if (result?.type === "success") {
											const newUrl = (result as any).data?.newQrUrl;
											if (newUrl) {
												currentQrUrl = newUrl;
											}
											// Regenerate QR code with new URL
											try {
												qrCodeDataUrl = await QRCode.toDataURL(currentQrUrl, {
													width: 300,
													margin: 2,
													errorCorrectionLevel: "M",
													color: {
														dark: "#000000",
														light: "#FFFFFF"
													}
												});
												toast.success("QR code regenerated successfully - old QR codes are now invalid");
											} catch (error) {
												console.error("QR generation error:", error);
												toast.error("Failed to regenerate QR code");
											}
										} else {
											toast.error("Failed to regenerate QR code");
										}
									};
								}}
							>
								<input type="hidden" name="id" value={selectedTable?.id} />
								<button
									type="submit"
									class="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-2"
								>
									<svg
										class="size-4"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
									Regenerate QR (Revoke Old)
								</button>
							</form>
						</div>

						<div class="text-xs text-gray-500 dark:text-neutral-400 space-y-2 mt-4">
							<div class="flex items-start gap-2">
								<svg
									class="size-4 flex-shrink-0 mt-0.5"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
									/>
								</svg>
								<p><strong>Tip:</strong> Print and place this QR code on the table</p>
							</div>
							<div class="flex items-start gap-2">
								<svg
									class="size-4 flex-shrink-0 mt-0.5"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
								<p><strong>Security:</strong> Regenerate periodically to revoke old QR codes</p>
							</div>
							<div class="flex items-start gap-2">
								<svg
									class="size-4 flex-shrink-0 mt-0.5"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
									/>
								</svg>
								<p><strong>Usage:</strong> Customers scan to access the ordering menu</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
