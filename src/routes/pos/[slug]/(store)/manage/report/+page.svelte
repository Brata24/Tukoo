<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { data } = $props();

	let secondaryColor = $state(data.merchant?.secondaryColor || '#3b82f6');
	let secondaryTextColor = $state(data.merchant?.secondaryTextColor || '#ffffff');
	let isExporting = $state(false);
	let availableYears = $state<number[]>([]);
	let isLoadingYears = $state(true);

	$effect(() => {
		if (data.merchant) {
			secondaryColor = data.merchant.secondaryColor || '#3b82f6';
			secondaryTextColor = data.merchant.secondaryTextColor || '#ffffff';
		}
	});

	// Generate month options
	const months = [
		{ value: 1, label: 'January' },
		{ value: 2, label: 'February' },
		{ value: 3, label: 'March' },
		{ value: 4, label: 'April' },
		{ value: 5, label: 'May' },
		{ value: 6, label: 'June' },
		{ value: 7, label: 'July' },
		{ value: 8, label: 'August' },
		{ value: 9, label: 'September' },
		{ value: 10, label: 'October' },
		{ value: 11, label: 'November' },
		{ value: 12, label: 'December' }
	];

	async function fetchAvailableYears() {
		try {
			const response = await fetch(`/api/report/available-years`);
			if (response.ok) {
				const result = await response.json();
				availableYears = result.years || [];
			}
		} catch (error) {
			console.error('Failed to fetch available years:', error);
			// Fallback to current year if API fails
			availableYears = [new Date().getFullYear()];
		} finally {
			isLoadingYears = false;
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function handleFilterChange() {
		const monthSelect = document.getElementById('monthSelect') as HTMLSelectElement;
		const yearSelect = document.getElementById('yearSelect') as HTMLSelectElement;
		
		if (monthSelect && yearSelect) {
			const newUrl = new URL($page.url);
			newUrl.searchParams.set('month', monthSelect.value);
			newUrl.searchParams.set('year', yearSelect.value);
			goto(newUrl.toString());
		}
	}

	async function exportToExcel() {
		isExporting = true;
		try {
			const XLSX = await import('xlsx');
			
			// Prepare data for export
			const exportData: any[] = data.salesReport.map((item, index) => ({
				'No': index + 1,
				'Product Name': item.productName,
				'Category': item.categoryName,
				'Barcode': item.productBarcode,
				'Unit Price': item.productPrice,
				'Quantity Sold': item.totalQuantity,
				'Total Revenue': item.totalRevenue,
				'Orders Count': item.orderCount
			}));

			// Add summary at the end
			exportData.push({
				'No': '',
				'Product Name': '',
				'Category': '',
				'Barcode': 'SUMMARY',
				'Unit Price': 0,
				'Quantity Sold': data.summary.totalItems,
				'Total Revenue': data.summary.totalRevenue,
				'Orders Count': data.summary.totalOrders
			});

			const worksheet = XLSX.utils.json_to_sheet(exportData);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

			// Generate filename
			const monthName = months.find(m => m.value === data.selectedMonth)?.label || '';
			const filename = `Sales_Report_${monthName}_${data.selectedYear}.xlsx`;

			XLSX.writeFile(workbook, filename);
		} catch (error) {
			console.error('Export to Excel failed:', error);
			alert('Failed to export to Excel');
		} finally {
			isExporting = false;
		}
	}

	async function exportToPDF() {
		isExporting = true;
		try {
			const response = await fetch(`/manage/report/export-pdf`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					month: data.selectedMonth,
					year: data.selectedYear
				})
			});

			if (!response.ok) {
				throw new Error('Failed to generate PDF');
			}

			const result = await response.json();
			
			// Convert base64 to blob and download
			const byteCharacters = atob(result.pdf);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: 'application/pdf' });
			
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = result.filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Export to PDF failed:', error);
			alert('Failed to export to PDF');
		} finally {
			isExporting = false;
		}
	}

	onMount(() => {
		// Fetch available years from API
		fetchAvailableYears();
		
		// Initialize Preline UI
		setTimeout(() => {
			if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);
	});
</script>

<svelte:head>
	<title>Sales Report - {data.merchant.name}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex justify-between items-start mb-6">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Sales Report</h1>
					<p class="text-gray-600 mt-2">View detailed sales data and export reports</p>
				</div>
				
				<!-- Export Buttons -->
				<div class="flex gap-3">
					<button
						onclick={exportToExcel}
						disabled={isExporting || data.salesReport.length === 0}
						class="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
					>
						{#if isExporting}
							<span class="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent rounded-full" role="status" aria-label="loading"></span>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
								<polyline points="14 2 14 8 20 8"/>
								<path d="M12 18v-6"/>
								<path d="m9 15 3 3 3-3"/>
							</svg>
						{/if}
						Export to Excel
					</button>
					
					<button
						onclick={exportToPDF}
						disabled={isExporting || data.salesReport.length === 0}
						class="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none"
						style="background-color: {secondaryColor}; color: {secondaryTextColor};"
					>
						{#if isExporting}
							<span class="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent rounded-full" role="status" aria-label="loading"></span>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
								<polyline points="14 2 14 8 20 8"/>
								<path d="M12 12v6"/>
								<path d="m9 15 3-3 3 3"/>
							</svg>
						{/if}
						Export to PDF
					</button>
				</div>
			</div>

			<!-- Filter Controls -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<div class="flex items-end gap-4">
					<div class="flex-1">
						<label for="monthSelect" class="block text-sm font-medium text-gray-700 mb-2">
							Month
						</label>
						<select
							id="monthSelect"
							onchange={handleFilterChange}
							class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
						>
							{#each months as month}
								<option value={month.value} selected={month.value === data.selectedMonth}>
									{month.label}
								</option>
							{/each}
						</select>
					</div>

					<div class="flex-1">
						<label for="yearSelect" class="block text-sm font-medium text-gray-700 mb-2">
							Year
						</label>
						<select
							id="yearSelect"
							onchange={handleFilterChange}
							disabled={isLoadingYears || availableYears.length === 0}
							class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
						>
							{#if isLoadingYears}
								<option>Loading...</option>
							{:else if availableYears.length === 0}
								<option>No data available</option>
							{:else}
								{#each availableYears as year}
									<option value={year} selected={year === data.selectedYear}>
										{year}
									</option>
								{/each}
							{/if}
						</select>
					</div>

					<div class="flex-1">
						<!-- Spacer for alignment -->
					</div>
				</div>
			</div>

			<!-- Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="p-3 rounded-full" style="background-color: {secondaryColor}20;">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{secondaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="12" x2="12" y1="2" y2="22"/>
								<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-600">Total Revenue</p>
							<p class="text-2xl font-bold text-gray-900">{formatCurrency(data.summary.totalRevenue)}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="p-3 rounded-full bg-blue-100">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z"/>
								<path d="M8 11V6a4 4 0 0 1 8 0v5"/>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-600">Total Orders</p>
							<p class="text-2xl font-bold text-gray-900">{data.summary.totalOrders}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="p-3 rounded-full bg-green-100">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M2 6h4"/>
								<path d="M2 10h4"/>
								<path d="M2 14h4"/>
								<path d="M2 18h4"/>
								<rect width="16" height="20" x="4" y="2" rx="2"/>
								<path d="M9.5 8h5"/>
								<path d="M9.5 12H16"/>
								<path d="M9.5 16H14"/>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-600">Total Items Sold</p>
							<p class="text-2xl font-bold text-gray-900">{data.summary.totalItems}</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Sales Report Table -->
		<div class="bg-white rounded-lg shadow overflow-hidden">
			{#if data.salesReport.length === 0}
				<div class="p-12 text-center">
					<div class="flex justify-center mb-4">
						<svg class="w-16 h-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-gray-700 mb-2">No sales data</h3>
					<p class="text-gray-500">No sales recorded for the selected period</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50 border-b">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									No
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Product Name
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Category
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Barcode
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Unit Price
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Qty Sold
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Total Revenue
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Orders
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each data.salesReport as item, index}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{index + 1}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">{item.productName}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
											{item.categoryName}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{item.productBarcode}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
										{formatCurrency(item.productPrice)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
										{item.totalQuantity}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right" style="color: {secondaryColor};">
										{formatCurrency(item.totalRevenue)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
										{item.orderCount}
									</td>
								</tr>
							{/each}
							<!-- Total Row -->
							<tr class="bg-gray-100 font-bold">
								<td colspan="5" class="px-6 py-4 text-right text-sm text-gray-900">
									TOTAL
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
									{data.summary.totalItems}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-right" style="color: {secondaryColor};">
									{formatCurrency(data.summary.totalRevenue)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
									{data.summary.totalOrders}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
