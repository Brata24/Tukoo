<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	};

	const shouldShowUpgrade = data.subscription.planSlug === 'free' || (data.subscription.currentStores >= data.subscription.maxStores && data.subscription.maxStores !== 999);
</script>

<div class="p-4 sm:p-6 space-y-6">
	<!-- Pending Payment Alert -->
	{#if data.pendingPayment}
		<div class="bg-white dark:bg-neutral-800 border-l-4 border-amber-500 rounded-lg shadow-md p-5">
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0">
					<div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
				</div>
				<div class="flex-1 min-w-0">
					<div class="flex items-start justify-between gap-4 mb-3">
						<div>
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Pending Subscription Payment</h3>
							<p class="text-sm text-gray-600 dark:text-neutral-400">
								You have an incomplete payment for <span class="font-semibold text-gray-900 dark:text-white">{data.pendingPayment.planName}</span> plan
							</p>
						</div>
						<div class="text-right">
							<p class="text-xs text-gray-500 dark:text-neutral-500 mb-1">Amount</p>
							<p class="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(data.pendingPayment.amount)}</p>
						</div>
					</div>
					<div class="flex flex-wrap items-center gap-3">
						<a
							href="/dashboard/subscription/payment/{data.pendingPayment.paymentRequestId}"
							class="inline-flex items-center gap-x-2 px-4 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
							</svg>
							Complete Payment
						</a>
						<a
							href="/dashboard/subscription"
							class="text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white font-medium"
						>
							View all plans →
						</a>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Welcome Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-neutral-200">
        
				Welcome back, {data.user.username || 'User'}! 👋
			</h1>
			<p class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
				Here's what's happening with your business today
			</p>
		</div>
		<a
			href="/dashboard/merchant"
			class="inline-flex items-center gap-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 transition-colors"
		>
			<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
			</svg>
			Manage Stores
		</a>
	</div>

	<!-- Upgrade Promotion Banner (if needed) -->
	{#if shouldShowUpgrade}
		<div class="relative overflow-hidden">
			<div class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 sm:p-8">
				<div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div class="flex-1">
						<div class="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-3">
							<svg class="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
							<span class="text-xs font-semibold text-white uppercase tracking-wide">Limited Offer</span>
						</div>
						<h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">
							{#if data.subscription.planSlug === 'free'}
								Unlock Your Business Potential 🚀
							{:else}
								Expand Your Store Limit 📈
							{/if}
						</h2>
						<p class="text-white/90 text-sm sm:text-base mb-4 max-w-2xl">
							{#if data.subscription.planSlug === 'free'}
								Upgrade to a premium plan and get unlimited features, priority support, and advanced analytics to grow your business faster.
							{:else}
								You've reached your store limit. Upgrade now to create more stores and scale your business without restrictions.
							{/if}
						</p>
						<div class="flex flex-wrap items-center gap-3">
							<a
								href="/dashboard/subscription"
								class="inline-flex items-center gap-x-2 px-5 py-2.5 bg-white text-purple-600 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
								</svg>
								Upgrade Now
							</a>
							<a
								href="/dashboard/subscription"
								class="inline-flex items-center gap-x-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
							>
								View Plans
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						</div>
					</div>
					<div class="hidden sm:block">
						<div class="relative">
							<div class="absolute inset-0 bg-white/10 rounded-full blur-3xl"></div>
							<svg class="relative w-32 h-32 text-white/20" fill="currentColor" viewBox="0 0 20 20">
								<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
							</svg>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
		<!-- Total Stores -->
		<div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 dark:bg-neutral-800 dark:border-neutral-700">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
					</svg>
				</div>
				<span class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Stores</span>
			</div>
			<div class="space-y-1">
				<h3 class="text-3xl font-bold text-gray-900 dark:text-neutral-100">
					{data.stats.totalMerchants}
				</h3>
				<p class="text-xs text-gray-600 dark:text-neutral-400">
					{data.subscription.currentStores}/{data.subscription.maxStores === 999 ? '∞' : data.subscription.maxStores} used • {data.subscription.planName}
				</p>
			</div>
		</div>

		<!-- Total Revenue -->
		<div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 dark:bg-neutral-800 dark:border-neutral-700">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<span class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Revenue</span>
			</div>
			<div class="space-y-1">
				<h3 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
					{formatCurrency(data.stats.totalRevenue)}
				</h3>
				<p class="text-xs text-gray-600 dark:text-neutral-400">
					All time earnings
				</p>
			</div>
		</div>

		<!-- Total Orders -->
		<div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 dark:bg-neutral-800 dark:border-neutral-700">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
					</svg>
				</div>
				<span class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Orders</span>
			</div>
			<div class="space-y-1">
				<h3 class="text-3xl font-bold text-gray-900 dark:text-neutral-100">
					{data.stats.totalOrders}
				</h3>
				<p class="text-xs text-gray-600 dark:text-neutral-400">
					Total completed orders
				</p>
			</div>
		</div>

		<!-- Recent Revenue (30 days) -->
		<div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 dark:bg-neutral-800 dark:border-neutral-700">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
					</svg>
				</div>
				<span class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">30 Days</span>
			</div>
			<div class="space-y-1">
				<h3 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
					{formatCurrency(data.stats.recentRevenue)}
				</h3>
				<p class="text-xs text-gray-600 dark:text-neutral-400">
					{data.stats.recentOrders} orders this month
				</p>
			</div>
		</div>
	</div>

	<!-- Quick Actions & Merchants -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Quick Actions -->
		<div class="lg:col-span-1">
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-neutral-800 dark:border-neutral-700">
				<h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200 mb-4">Quick Actions</h3>
				<div class="space-y-3">
					<a
						href="/dashboard/merchant/add"
						class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group dark:border-neutral-700 dark:hover:bg-blue-900/10"
					>
						<div class="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg group-hover:bg-blue-600 transition-colors dark:bg-blue-900/30">
							<svg class="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900 dark:text-neutral-100">Add New Store</p>
							<p class="text-xs text-gray-500 dark:text-neutral-400">Create another merchant</p>
						</div>
					</a>

					<a
						href="/dashboard/subscription"
						class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group dark:border-neutral-700 dark:hover:bg-purple-900/10"
					>
						<div class="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg group-hover:bg-purple-600 transition-colors dark:bg-purple-900/30">
							<svg class="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
							</svg>
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900 dark:text-neutral-100">View Plans</p>
							<p class="text-xs text-gray-500 dark:text-neutral-400">Upgrade subscription</p>
						</div>
					</a>

					<a
						href="/dashboard/settings"
						class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-500 hover:bg-gray-50 transition-all group dark:border-neutral-700 dark:hover:bg-neutral-700"
					>
						<div class="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg group-hover:bg-gray-600 transition-colors dark:bg-neutral-700">
							<svg class="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900 dark:text-neutral-100">Settings</p>
							<p class="text-xs text-gray-500 dark:text-neutral-400">Account preferences</p>
						</div>
					</a>
				</div>
			</div>
		</div>

		<!-- Your Stores -->
		<div class="lg:col-span-2">
			<div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-neutral-800 dark:border-neutral-700">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">Your Stores</h3>
					<a href="/dashboard/merchant" class="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
						View All →
					</a>
				</div>
				{#if data.merchants.length > 0}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{#each data.merchants.slice(0, 4) as merchant}
							<a
								href="/dashboard/merchant/{merchant.uuid}"
								class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group dark:border-neutral-700"
							>
								{#if merchant.logo}
									<img src={merchant.logo} alt={merchant.name} class="w-12 h-12 rounded-lg object-cover" />
								{:else}
									<div class="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
										<span class="text-white font-bold text-lg">{merchant.name.charAt(0).toUpperCase()}</span>
									</div>
								{/if}
								<div class="flex-1 min-w-0">
									<p class="text-sm font-semibold text-gray-900 dark:text-neutral-100 truncate group-hover:text-blue-600 transition-colors">
										{merchant.name}
									</p>
									<p class="text-xs text-gray-500 dark:text-neutral-400 truncate">
										{merchant.slug}.tukoo.web.id
									</p>
								</div>
								<svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						{/each}
					</div>
				{:else}
					<div class="text-center py-12">
						<div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center dark:bg-neutral-700">
							<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</div>
						<h4 class="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">No stores yet</h4>
						<p class="text-sm text-gray-600 dark:text-neutral-400 mb-4">
							Create your first store to start selling
						</p>
						<a
							href="/dashboard/merchant/add"
							class="inline-flex items-center gap-x-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Create Store
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

	

