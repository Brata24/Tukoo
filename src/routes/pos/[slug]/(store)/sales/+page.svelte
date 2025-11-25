<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from "./$types";
	import LockScreen from "$lib/ui/merchant/sales/lockscreen.svelte";

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let isLocked = $state(data.isLocked);

	// Sync with server data when it changes
	$effect(() => {
		isLocked = data.isLocked;
	});

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	};

	const formatNumber = (num: number) => {
		return new Intl.NumberFormat('id-ID').format(num);
	};

	const formatShortDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'short'
		}).format(date);
	};


</script>

<svelte:head>
	<title>Sales Dashboard - {data.merchant.name}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-neutral-900">
	<div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-neutral-200">
					Sales Analytics
				</h1>
				<p class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
					Track your sales performance and insights
				</p>
			</div>
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
			<!-- Total Revenue -->
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 dark:bg-neutral-800 dark:border-neutral-700">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<span class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">All Time</span>
				</div>
				<div class="space-y-1">
					<h3 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
						{formatCurrency(data.stats.totalRevenue)}
					</h3>
					<p class="text-xs text-gray-600 dark:text-neutral-400">
						Total revenue
					</p>
				</div>
			</div>

			<!-- Total Orders -->
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 dark:bg-neutral-800 dark:border-neutral-700">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
						</svg>
					</div>
					<span class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Orders</span>
				</div>
				<div class="space-y-1">
					<h3 class="text-3xl font-bold text-gray-900 dark:text-neutral-100">
						{formatNumber(data.stats.totalOrders)}
					</h3>
					<p class="text-xs text-gray-600 dark:text-neutral-400">
						Total orders
					</p>
				</div>
			</div>

			<!-- Average Order Value -->
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 dark:bg-neutral-800 dark:border-neutral-700">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
						</svg>
					</div>
					<span class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Average</span>
				</div>
				<div class="space-y-1">
					<h3 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
						{formatCurrency(data.stats.averageOrderValue)}
					</h3>
					<p class="text-xs text-gray-600 dark:text-neutral-400">
						Per order
					</p>
				</div>
			</div>

			<!-- Today's Sales -->
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 dark:bg-neutral-800 dark:border-neutral-700">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
						</svg>
					</div>
					<span class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Today</span>
				</div>
				<div class="space-y-1">
					<h3 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
						{formatCurrency(data.stats.todayRevenue)}
					</h3>
					<p class="text-xs text-gray-600 dark:text-neutral-400">
						{formatNumber(data.stats.todayOrders)} orders
					</p>
				</div>
			</div>
		</div>

		<!-- Period Stats -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- 7 Days Stats -->
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-neutral-800 dark:border-neutral-700">
				<div class="flex items-center gap-3 mb-4">
					<div class="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg dark:bg-blue-900/30">
						<svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">Last 7 Days</h3>
				</div>
				<div class="space-y-3">
					<div>
						<p class="text-sm text-gray-600 dark:text-neutral-400 mb-1">Revenue</p>
						<p class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
							{formatCurrency(data.stats.weekRevenue)}
						</p>
					</div>
					<div>
						<p class="text-sm text-gray-600 dark:text-neutral-400 mb-1">Orders</p>
						<p class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
							{formatNumber(data.stats.weekOrders)}
						</p>
					</div>
				</div>
			</div>

			<!-- 30 Days Stats -->
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-neutral-800 dark:border-neutral-700">
				<div class="flex items-center gap-3 mb-4">
					<div class="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg dark:bg-purple-900/30">
						<svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">Last 30 Days</h3>
				</div>
				<div class="space-y-3">
					<div>
						<p class="text-sm text-gray-600 dark:text-neutral-400 mb-1">Revenue</p>
						<p class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
							{formatCurrency(data.stats.monthRevenue)}
						</p>
					</div>
					<div>
						<p class="text-sm text-gray-600 dark:text-neutral-400 mb-1">Orders</p>
						<p class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
							{formatNumber(data.stats.monthOrders)}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Daily Sales Chart (Last 7 Days) -->
		{#if data.dailySales.length > 0}
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-neutral-800 dark:border-neutral-700">
				<h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200 mb-4">Daily Sales Trend</h3>
				<div class="space-y-3">
					{#each data.dailySales as day}
						{@const maxRevenue = Math.max(...data.dailySales.map(d => d.revenue))}
						{@const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0}
						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-sm font-medium text-gray-700 dark:text-neutral-300">
									{formatShortDate(day.date)}
								</span>
								<div class="text-right">
									<span class="text-sm font-bold text-gray-900 dark:text-neutral-100">
										{formatCurrency(day.revenue)}
									</span>
									<span class="text-xs text-gray-500 dark:text-neutral-400 ml-2">
										({day.orders} orders)
									</span>
								</div>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-neutral-700">
								<div
									class="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all"
									style="width: {percentage}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Top Products & Sales by Category -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Top Products -->
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
				<div class="p-6 border-b border-gray-200 dark:border-neutral-700">
					<h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">Top Selling Products</h3>
				</div>
				<div class="p-6">
					{#if data.topProducts.length > 0}
						<div class="space-y-4">
							{#each data.topProducts as product, index}
								<div class="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
									<div class="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
										{index + 1}
									</div>
									{#if product.productPhoto}
										<img src={product.productPhoto} alt={product.productName} class="w-12 h-12 rounded-lg object-cover" />
									{:else}
										<div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-neutral-700">
											<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
											</svg>
										</div>
									{/if}
									<div class="flex-1 min-w-0">
										<p class="text-sm font-semibold text-gray-900 dark:text-neutral-100 truncate">
											{product.productName}
										</p>
										<p class="text-xs text-gray-500 dark:text-neutral-400">
											{formatNumber(product.totalQuantity)} sold • {formatCurrency(product.productPrice)} each
										</p>
									</div>
									<div class="text-right">
										<p class="text-sm font-bold text-gray-900 dark:text-neutral-100">
											{formatCurrency(product.totalRevenue)}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8">
							<p class="text-sm text-gray-500 dark:text-neutral-400">No products sold yet</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Sales by Category -->
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
				<div class="p-6 border-b border-gray-200 dark:border-neutral-700">
					<h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">Sales by Category</h3>
				</div>
				<div class="p-6">
					{#if data.salesByCategory.length > 0}
						<div class="space-y-4">
							{#each data.salesByCategory as cat}
								{@const maxRevenue = Math.max(...data.salesByCategory.map(c => c.totalRevenue))}
								{@const percentage = maxRevenue > 0 ? (cat.totalRevenue / maxRevenue) * 100 : 0}
								<div>
									<div class="flex items-center justify-between mb-2">
										<div class="flex-1">
											<p class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
												{cat.categoryName}
											</p>
											<p class="text-xs text-gray-500 dark:text-neutral-400">
												{formatNumber(cat.totalQuantity)} items sold
											</p>
										</div>
										<p class="text-sm font-bold text-gray-900 dark:text-neutral-100">
											{formatCurrency(cat.totalRevenue)}
										</p>
									</div>
									<div class="w-full bg-gray-200 rounded-full h-2 dark:bg-neutral-700">
										<div
											class="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
											style="width: {percentage}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8">
							<p class="text-sm text-gray-500 dark:text-neutral-400">No category data yet</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Recent Orders -->
		<div class="bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
			<div class="p-6 border-b border-gray-200 dark:border-neutral-700">
				<h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">Recent Orders</h3>
			</div>
			<div class="overflow-x-auto">
				{#if data.recentOrders.length > 0}
					<table class="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
						<thead class="bg-gray-50 dark:bg-neutral-800">
							<tr>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-neutral-400">
									Order #
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-neutral-400">
									Customer
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-neutral-400">
									Type
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-neutral-400">
									Date
								</th>
								<th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-neutral-400">
									Amount
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200 dark:bg-neutral-800 dark:divide-neutral-700">
							{#each data.recentOrders as order}
								<tr class="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900 dark:text-neutral-100">
											#{order.orderNumber}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900 dark:text-neutral-100">
											{order.customerName || '-'}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
											{order.diningOption || 'N/A'}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
										{formatDate(order.createdAt)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-neutral-100">
										{formatCurrency(order.total)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<div class="text-center py-12">
						<p class="text-sm text-gray-500 dark:text-neutral-400">No orders yet</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
