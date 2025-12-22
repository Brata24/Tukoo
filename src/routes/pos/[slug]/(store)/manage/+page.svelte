<script lang="ts">
	let { data } = $props();

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusBadge(status: string) {
		const badges: Record<string, string> = {
			pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
			paid: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
			cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
		};
		return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
	}

	function getProcessingBadge(status: string) {
		const badges: Record<string, string> = {
			new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
			preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
			ready: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
			served: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
			completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
		};
		return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
	}

	const statusMap: Record<string, string> = {
		new: 'New',
		preparing: 'Preparing',
		ready: 'Ready',
		served: 'Served',
		completed: 'Completed'
	};
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
			{data.merchant.name} - Dashboard
		</h1>
		<p class="text-gray-600 dark:text-gray-400">Overview of your store performance</p>
	</div>

	<!-- Main Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<!-- Today's Revenue -->
		<div
			class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white"
		>
			<div class="flex items-center justify-between mb-2">
				<div class="text-green-100 text-sm font-medium">Today's Revenue</div>
				<svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<div class="text-3xl font-bold mb-1">{formatCurrency(data.stats.revenue.today)}</div>
			<div class="text-green-100 text-xs">{data.stats.orders.today} orders today</div>
		</div>

		<!-- Total Revenue -->
		<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
			<div class="flex items-center justify-between mb-2">
				<div class="text-blue-100 text-sm font-medium">Total Revenue</div>
				<svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
			</div>
			<div class="text-3xl font-bold mb-1">{formatCurrency(data.stats.revenue.total)}</div>
			<div class="text-blue-100 text-xs">{data.stats.orders.total} total orders</div>
		</div>

		<!-- Products -->
		<div
			class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white"
		>
			<div class="flex items-center justify-between mb-2">
				<div class="text-purple-100 text-sm font-medium">Products</div>
				<svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
					/>
				</svg>
			</div>
			<div class="text-3xl font-bold mb-1">{data.stats.products.total}</div>
			<div class="text-purple-100 text-xs">
				{data.stats.products.active} active • {data.stats.products.lowStock} low stock
			</div>
		</div>

		<!-- Resources -->
		<div
			class="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white"
		>
			<div class="flex items-center justify-between mb-2">
				<div class="text-orange-100 text-sm font-medium">Resources</div>
				<svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
					/>
				</svg>
			</div>
			<div class="text-3xl font-bold mb-1">
				{data.stats.tables + data.stats.staff + data.stats.categories}
			</div>
			<div class="text-orange-100 text-xs">
				{data.stats.tables} tables • {data.stats.staff} staff • {data.stats.categories} categories
			</div>
		</div>
	</div>

	<!-- Order Status Cards -->
	{#if data.ordersByStatus.length > 0}
		<div class="mb-8">
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Active Orders</h2>
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
				{#each data.ordersByStatus as statusData}
					<div
						class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 {getProcessingBadge(
							statusData.status
						).includes('blue')
							? 'border-blue-500'
							: getProcessingBadge(statusData.status).includes('orange')
								? 'border-orange-500'
								: getProcessingBadge(statusData.status).includes('purple')
									? 'border-purple-500'
									: getProcessingBadge(statusData.status).includes('teal')
										? 'border-teal-500'
										: 'border-green-500'}"
					>
						<div class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
							{statusData.count}
						</div>
						<div class="text-sm text-gray-600 dark:text-gray-400">
							{statusMap[statusData.status] || statusData.status}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Recent Orders -->
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
			<div class="space-y-3">
				{#if data.recentOrders.length === 0}
					<div class="text-center py-8 text-gray-500 dark:text-gray-400">
						<svg
							class="w-12 h-12 mx-auto mb-2 opacity-50"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<p>No orders yet</p>
					</div>
				{:else}
					{#each data.recentOrders as order}
						<div
							class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow"
						>
							<div class="flex items-center justify-between mb-2">
								<div class="font-semibold text-gray-900 dark:text-white text-sm">
									{order.orderNumber}
								</div>
								<div class="font-bold text-gray-900 dark:text-white">
									{formatCurrency(order.total)}
								</div>
							</div>
							<div class="flex items-center gap-2 mb-2">
								<span class="px-2 py-0.5 rounded-full text-xs font-medium {getStatusBadge(order.status)}">
									{order.status}
								</span>
								<span
									class="px-2 py-0.5 rounded-full text-xs font-medium {getProcessingBadge(
										order.processingStatus
									)}"
								>
									{order.processingStatus}
								</span>
							</div>
							<div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
								<div class="flex items-center gap-2">
									{#if order.tableName}
										<span>{order.tableName}</span>
									{/if}
									{#if order.userPosName}
										<span>• {order.userPosName}</span>
									{/if}
								</div>
								<span>{formatDate(order.createdAt)}</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Top Products -->
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Selling Products</h2>
			<div class="space-y-4">
				{#if data.topProducts.length === 0}
					<div class="text-center py-8 text-gray-500 dark:text-gray-400">
						<svg
							class="w-12 h-12 mx-auto mb-2 opacity-50"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
							/>
						</svg>
						<p>No sales data yet</p>
					</div>
				{:else}
					{#each data.topProducts as product}
						<div
							class="flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow"
						>
							{#if product.photo}
								<img
									src={product.photo}
									alt={product.productName}
									class="w-12 h-12 rounded-lg object-cover"
								/>
							{:else}
								<div
									class="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-lg font-bold"
								>
									{product.productName.charAt(0)}
								</div>
							{/if}
							<div class="flex-1 min-w-0">
								<div class="font-semibold text-gray-900 dark:text-white text-sm truncate">
									{product.productName}
								</div>
								<div class="text-xs text-gray-600 dark:text-gray-400">
									{formatCurrency(product.price)} • {product.totalQuantity} sold
								</div>
								<div class="text-xs font-semibold text-green-600 dark:text-green-400">
									{formatCurrency(product.totalRevenue)} revenue
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- Active Staff Today -->
	{#if data.activeStaff.length > 0}
		<div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Staff Performance Today</h2>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-200 dark:border-gray-700">
							<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
								Staff
							</th>
							<th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
								Last Login
							</th>
							<th class="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
								Orders
							</th>
							<th class="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
								Revenue
							</th>
						</tr>
					</thead>
					<tbody>
						{#each data.activeStaff as staff}
							<tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
								<td class="py-3 px-4">
									<div class="text-sm font-medium text-gray-900 dark:text-white">
										{staff.name}
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
										@{staff.username}
									</div>
								</td>
								<td class="py-3 px-4">
									{#if staff.lastLogin}
										<div class="text-sm text-gray-900 dark:text-white">
											{new Date(staff.lastLogin).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric'
											})}
										</div>
										<div class="text-xs text-gray-500 dark:text-gray-400">
											{new Date(staff.lastLogin).toLocaleTimeString('en-US', {
												hour: '2-digit',
												minute: '2-digit'
											})}
										</div>
									{:else}
										<span class="text-xs text-gray-400 dark:text-gray-500">Never</span>
									{/if}
								</td>
								<td class="py-3 px-4 text-right text-sm text-gray-900 dark:text-white">
									{staff.orderCount}
								</td>
								<td class="py-3 px-4 text-right text-sm font-medium text-gray-900 dark:text-white">
									{formatCurrency(Number(staff.totalRevenue || 0))}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- Low Stock Alert -->
	{#if data.lowStockProducts.length > 0}
		<div class="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded-lg">
			<div class="flex items-start">
				<div class="flex-shrink-0">
					<svg
						class="h-6 w-6 text-yellow-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div class="ml-3 flex-1">
					<h3 class="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
						Low Stock Alert
					</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each data.lowStockProducts as product}
							<div class="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
								<div class="flex items-center gap-3">
									{#if product.photo}
										<img
											src={product.photo}
											alt={product.name}
											class="w-10 h-10 rounded object-cover"
										/>
									{:else}
										<div
											class="w-10 h-10 rounded bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-sm font-bold"
										>
											{product.name.charAt(0)}
										</div>
									{/if}
									<div class="flex-1 min-w-0">
										<div class="font-medium text-gray-900 dark:text-white text-sm truncate">
											{product.name}
										</div>
										<div class="text-xs text-red-600 dark:text-red-400 font-semibold">
											Only {product.stock} left
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>