<script lang="ts">
	import { onMount } from 'svelte';
	
	type Plan = {
		id: number;
		name: string;
		slug: string;
		price: number;
		duration: number;
		maxStores: number;
		description: string | null;
		isActive: number;
	};

	let { data } = $props();
	let plans = $state<Plan[]>([]);
	let loading = $state(true);
	let creatingPayment = $state(false);

	onMount(async () => {
		try {
			const response = await fetch('/api/subscription/plans');
			const result = await response.json();
			if (result.success) {
				plans = result.data;
			}
		} catch (error) {
			console.error('Error loading plans:', error);
		} finally {
			loading = false;
		}
	});

	const subscribeToPlan = async (planId: number, planPrice: number) => {
		if (planPrice === 0) {
			// Free plan - just activate
			alert('Free plan activated!');
			return;
		}

		try {
			creatingPayment = true;
			const response = await fetch('/api/subscription/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ planId })
			});

			const result = await response.json();
			if (result.success && result.data.paymentId) {
				// Redirect to payment page
				window.location.href = `/dashboard/subscription/payment/${result.data.paymentId}`;
			} else {
				alert('Error creating payment: ' + (result.error || 'Unknown error'));
			}
		} catch (error) {
			alert('Error: ' + error);
		} finally {
			creatingPayment = false;
		}
	};

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	};
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Pending Payment Alert -->
	{#if data.pendingPayment}
		<div class="bg-white dark:bg-neutral-800 border-2 border-amber-400 dark:border-amber-600 rounded-xl shadow-lg p-6 mb-6">
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0">
					<div class="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
						<svg class="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
				</div>
				<div class="flex-1 min-w-0">
					<div class="mb-4">
						<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Pending Payment Detected</h3>
						<p class="text-sm text-gray-600 dark:text-neutral-400">
							You have an incomplete subscription payment that needs to be completed
						</p>
					</div>
					<div class="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-neutral-700">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-xs text-gray-500 dark:text-neutral-500 mb-1">Plan</p>
								<p class="font-semibold text-gray-900 dark:text-white">{data.pendingPayment.planName}</p>
							</div>
							<div>
								<p class="text-xs text-gray-500 dark:text-neutral-500 mb-1">Amount</p>
								<p class="font-semibold text-gray-900 dark:text-white">{formatPrice(data.pendingPayment.amount)}</p>
							</div>
							<div>
								<p class="text-xs text-gray-500 dark:text-neutral-500 mb-1">Payment ID</p>
								<p class="font-mono text-xs text-gray-700 dark:text-neutral-300">{data.pendingPayment.paymentRequestId}</p>
							</div>
							<div>
								<p class="text-xs text-gray-500 dark:text-neutral-500 mb-1">Status</p>
								<span class="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded">
									<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
									</svg>
									Pending
								</span>
							</div>
						</div>
					</div>
					<a
						href="/dashboard/subscription/payment/{data.pendingPayment.paymentRequestId}"
						class="inline-flex items-center gap-x-2 px-6 py-3 bg-amber-600 dark:bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors shadow-sm"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
						</svg>
						Complete Payment Now
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			</div>
		</div>
	{/if}

	<!-- Current Subscription Card -->
	<div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-8 text-white">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold mb-2">Current Plan: {data.currentSubscription.planName}</h2>
				<p class="text-blue-100">
					Using {data.currentSubscription.currentStores} of {data.currentSubscription.maxStores} stores
				</p>
				{#if data.currentSubscription.endDate}
					<p class="text-sm text-blue-200 mt-1">
						Expires: {new Date(data.currentSubscription.endDate).toLocaleDateString()}
					</p>
				{/if}
			</div>
			<div class="text-right">
				<div class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
						<path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
					</svg>
					<span class="font-semibold">Active</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Pricing Plans -->
	<div class="mb-8">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
			<p class="text-gray-600">Select the perfect plan for your business needs</p>
		</div>

		{#if loading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each plans as plan}
					<div class="bg-white border-2 {plan.slug === data.currentSubscription.planSlug ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'} rounded-xl shadow-sm hover:shadow-lg transition-all p-6">
						{#if plan.slug === data.currentSubscription.planSlug}
							<div class="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3">
								Current Plan
							</div>
						{/if}
						
						<h3 class="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
						<div class="mb-4">
							<span class="text-4xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
							<span class="text-gray-600">/{plan.duration} days</span>
						</div>

						<ul class="space-y-3 mb-6">
							<li class="flex items-start gap-2">
								<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
								</svg>
								<span class="text-gray-700">
									{plan.maxStores === 999 ? 'Unlimited' : plan.maxStores} {plan.maxStores === 1 ? 'store' : 'stores'}
								</span>
							</li>
							{#if plan.description}
								{#each plan.description.split(',') as feature}
									<li class="flex items-start gap-2">
										<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
										</svg>
										<span class="text-gray-700">{feature.trim()}</span>
									</li>
								{/each}
							{/if}
						</ul>

						<button
							onclick={() => subscribeToPlan(plan.id, plan.price)}
							disabled={creatingPayment || plan.slug === data.currentSubscription.planSlug}
							class="w-full py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed {plan.slug === data.currentSubscription.planSlug ? 'bg-gray-100 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}"
						>
							{#if creatingPayment}
								Processing...
							{:else if plan.slug === data.currentSubscription.planSlug}
								Current Plan
							{:else if plan.price === 0}
								Activate Free
							{:else}
								Subscribe Now
							{/if}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Features Comparison -->
	<div class="bg-gray-50 rounded-xl p-6">
		<h2 class="text-2xl font-bold text-gray-900 mb-4">Why Upgrade?</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
					</svg>
				</div>
				<div>
					<h3 class="font-semibold text-gray-900 mb-1">Scale Your Business</h3>
					<p class="text-sm text-gray-600">Create multiple stores to expand your reach and serve more customers</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
					</svg>
				</div>
				<div>
					<h3 class="font-semibold text-gray-900 mb-1">Priority Support</h3>
					<p class="text-sm text-gray-600">Get dedicated support to help you succeed faster</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
					</svg>
				</div>
				<div>
					<h3 class="font-semibold text-gray-900 mb-1">Advanced Analytics</h3>
					<p class="text-sm text-gray-600">Make data-driven decisions with detailed insights</p>
				</div>
			</div>
		</div>
	</div>
</div>
