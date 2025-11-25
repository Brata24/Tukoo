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

	function getProcessingStatusBadge(status: string) {
		const badges: Record<string, string> = {
			new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
			preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
			ready: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
			served: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
			completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
		};
		return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
	}
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-4 mb-4">
			{#if data.merchant.logo}
				<img
					src={data.merchant.logo}
					alt={data.merchant.name}
					class="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
				/>
			{:else}
				<div
					class="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold"
				>
					{data.merchant.name.charAt(0)}
				</div>
			{/if}
			<div>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">{data.merchant.name}</h1>
				<p class="text-gray-600 dark:text-gray-400">{data.merchant.slogan || 'No slogan set'}</p>
			</div>
		</div>
		<div class="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
			<span class="flex items-center gap-1">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				{data.merchant.address}
			</span>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<!-- Revenue Card -->
		<div
			class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white"
		>
			<div class="flex items-center justify-between mb-2">
				<div class="text-green-100 text-sm font-medium">Total Revenue</div>
				<svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<div class="text-3xl font-bold mb-1">{formatCurrency(data.stats.revenue)}</div>
			<div class="text-green-100 text-xs">From {data.stats.orderCount} orders</div>
		</div>

		<!-- Products Card -->
		<div
			class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white"
		>
			<div class="flex items-center justify-between mb-2">
				<div class="text-blue-100 text-sm font-medium">Products</div>
				<svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
					/>
				</svg>
			</div>
			<div class="text-3xl font-bold mb-1">{data.stats.productCount}</div>
			<div class="text-blue-100 text-xs">
				{data.stats.categoryCount} categories • {data.stats.variantCount} variants
			</div>
		</div>

		<!-- Orders Card -->
		<div
			class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white"
		>
			<div class="flex items-center justify-between mb-2">
				<div class="text-purple-100 text-sm font-medium">Total Orders</div>
				<svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
			</div>
			<div class="text-3xl font-bold mb-1">{data.stats.orderCount}</div>
			<div class="text-purple-100 text-xs">All time orders</div>
		</div>

		<!-- Resources Card -->
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
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
			</div>
			<div class="text-3xl font-bold mb-1">{data.stats.staffCount + data.stats.tableCount}</div>
			<div class="text-orange-100 text-xs">
				{data.stats.staffCount} staff • {data.stats.tableCount} tables
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Recent Orders -->
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
			<div class="space-y-4">
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
							class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
						>
							<div class="flex items-center justify-between mb-2">
								<div class="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</div>
								<div class="text-lg font-bold text-gray-900 dark:text-white">
									{formatCurrency(order.total)}
								</div>
							</div>
							<div class="flex items-center gap-2 mb-2">
								<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusBadge(order.status)}">
									{order.status}
								</span>
								<span
									class="px-2 py-1 rounded-full text-xs font-medium {getProcessingStatusBadge(
										order.processingStatus
									)}"
								>
									{order.processingStatus}
								</span>
							</div>
							<div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
								<div class="flex items-center gap-4">
									{#if order.tableName}
										<span class="flex items-center gap-1">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
												/>
											</svg>
											{order.tableName}
										</span>
									{/if}
									{#if order.userPosName}
										<span class="flex items-center gap-1">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
												/>
											</svg>
											{order.userPosName}
										</span>
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
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Products</h2>
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
						<p>No products sold yet</p>
					</div>
				{:else}
					{#each data.topProducts as product}
						<div
							class="flex items-center gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
						>
							{#if product.photo}
								<img
									src={product.photo}
									alt={product.productName}
									class="w-16 h-16 rounded-lg object-cover"
								/>
							{:else}
								<div
									class="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xl font-bold"
								>
									{product.productName.charAt(0)}
								</div>
							{/if}
							<div class="flex-1">
								<div class="font-semibold text-gray-900 dark:text-white mb-1">
									{product.productName}
								</div>
								<div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
									{formatCurrency(product.price)}
								</div>
								<div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
									<span class="flex items-center gap-1">
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
											/>
										</svg>
										{product.totalOrders} orders
									</span>
									<span class="flex items-center gap-1">
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
											/>
										</svg>
										{product.totalQuantity} sold
									</span>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>