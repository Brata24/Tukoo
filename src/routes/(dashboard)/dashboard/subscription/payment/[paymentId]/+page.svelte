<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let loading = $state(false);
	let error = $state('');
	let timeRemaining = $state(0);
	let intervalId: any = null;
	let countdownId: any = null;

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	};

	// Format time remaining as HH:MM:SS
	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Calculate initial time remaining
	const calculateTimeRemaining = () => {
		if (data.payment.expiresAt) {
			const expiresAt = new Date(data.payment.expiresAt).getTime();
			const now = Date.now();
			timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
		}
	};

	// Check payment status (polling)
	const checkPaymentStatus = async (forceCheck = false) => {
		if (loading) return;

		try {
			loading = true;
			const url = forceCheck 
				? `/api/subscription/status/${data.payment.paymentRequestId}?forceCheck=true`
				: `/api/subscription/status/${data.payment.paymentRequestId}`;
			const response = await fetch(url);
			const result = await response.json();

			if (result.success) {
				if (result.data.status === 'paid') {
					// Redirect to success page
					clearInterval(intervalId);
					clearInterval(countdownId);
					goto('/dashboard/subscription?success=true');
				} else if (['cancelled', 'expired', 'failed'].includes(result.data.status)) {
					error = `Payment ${result.data.status}`;
					clearInterval(intervalId);
					clearInterval(countdownId);
				}
			}
		} catch (err) {
			console.error('Error checking payment status:', err);
		} finally {
			loading = false;
		}
	};

	// Copy QR string to clipboard
	const copyQrString = async () => {
		try {
			await navigator.clipboard.writeText(data.payment.qrString || '');
			alert('QRIS code copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy:', err);
			alert('Failed to copy QRIS code');
		}
	};

	onMount(() => {
		// Calculate initial time
		calculateTimeRemaining();

		// Check if already paid
		if (data.payment.status === 'paid') {
			goto('/dashboard/subscription?success=true');
			return;
		}

		// Start polling every 5 seconds
		intervalId = setInterval(checkPaymentStatus, 5000);

		// Start countdown timer
		countdownId = setInterval(() => {
			if (timeRemaining > 0) {
				timeRemaining--;
			} else {
				error = 'Payment expired';
				clearInterval(intervalId);
				clearInterval(countdownId);
			}
		}, 1000);

		// Initial check
		checkPaymentStatus();
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
		if (countdownId) clearInterval(countdownId);
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-8 px-4">
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<a href="/dashboard/subscription" class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-200 mb-4">
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Subscriptions
			</a>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
				Complete Your Payment
			</h1>
			<p class="text-gray-600 dark:text-neutral-400">
				Scan the QR code below to pay with any QRIS-supported app
			</p>
		</div>

		<!-- Payment Card -->
		<div class="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 mb-6">
			<!-- Plan Info -->
			<div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h2 class="text-2xl font-bold">{data.plan.name}</h2>
						<p class="text-blue-100 text-sm">{data.plan.duration} days subscription</p>
					</div>
					<div class="text-right">
						<p class="text-blue-100 text-sm">Amount</p>
						<p class="text-3xl font-bold">{formatCurrency(data.payment.amount)}</p>
					</div>
				</div>
				<div class="flex items-center gap-4 text-sm text-blue-100">
					<div class="flex items-center gap-2">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
							<path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
						</svg>
						Up to {data.plan.maxStores === 999 ? '∞' : data.plan.maxStores} stores
					</div>
				</div>
			</div>

			{#if error}
				<!-- Error State -->
				<div class="text-center py-8">
					<div class="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900/30">
						<svg class="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{error}</h3>
					<p class="text-gray-600 dark:text-neutral-400 mb-6">
						Please try creating a new subscription payment
					</p>
					<a
						href="/dashboard/subscription"
						class="inline-flex items-center gap-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
					>
						Back to Plans
					</a>
				</div>
			{:else if data.payment.status === 'paid'}
				<!-- Success State -->
				<div class="text-center py-8">
					<div class="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900/30">
						<svg class="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Payment Successful!</h3>
					<p class="text-gray-600 dark:text-neutral-400">
						Your subscription is now active
					</p>
				</div>
			{:else}
				<!-- QR Code Display -->
				<div class="space-y-6">
					<!-- Timer -->
					{#if timeRemaining > 0}
						<div class="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<div>
										<p class="text-sm font-medium text-gray-900 dark:text-white">Time Remaining</p>
										<p class="text-xs text-gray-600 dark:text-neutral-400">Complete payment before expiry</p>
									</div>
								</div>
								<div class="text-right">
									<p class="text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
										{formatTime(timeRemaining)}
									</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- QR Code -->
					<div class="text-center">
						<div class="inline-block p-4 bg-white dark:bg-neutral-900 rounded-xl shadow-lg">
							{#if data.payment.qrString}
								<img
									src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.payment.qrString)}`}
									alt="QRIS Payment"
									class="w-64 h-64 mx-auto"
								/>
							{:else}
								<div class="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-neutral-800 rounded-lg">
									<p class="text-gray-500 dark:text-neutral-400">QR Code not available</p>
								</div>
							{/if}
						</div>
					</div>

					<!-- Action Buttons -->
					{#if data.payment.qrString}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<button
								onclick={copyQrString}
								class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
								Copy QRIS Code
							</button>
							<button
								onclick={() => checkPaymentStatus(true)}
								disabled={loading}
								class="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
							>
								{#if loading}
									<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
								{:else}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
									</svg>
								{/if}
								Check Status
							</button>
						</div>
					{/if}

					<!-- Instructions -->
					<div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
						<h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
							<svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
							</svg>
							How to Pay
						</h3>
						<ol class="space-y-2 text-sm text-gray-700 dark:text-neutral-300">
							<li class="flex items-start gap-2">
								<span class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
								<span>Open your e-wallet app (GoPay, OVO, Dana, ShopeePay, LinkAja, etc.)</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
								<span>Scan the QR code above or copy and paste the QRIS code</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
								<span>Confirm the payment amount</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
								<span>Complete the payment - this page will auto-update</span>
							</li>
						</ol>
					</div>

					<!-- Status Indicator -->
					<div class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
						<div class="relative">
							<div class="w-2 h-2 bg-blue-600 rounded-full animate-ping absolute"></div>
							<div class="w-2 h-2 bg-blue-600 rounded-full"></div>
						</div>
						{loading ? 'Checking payment status...' : 'Waiting for payment...'}
					</div>
				</div>
			{/if}
		</div>

		<!-- Payment Info -->
		<div class="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
			<h3 class="font-semibold text-gray-900 dark:text-white mb-4">Payment Information</h3>
			<div class="space-y-3 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-neutral-400">Payment ID</span>
					<span class="font-medium text-gray-900 dark:text-white">{data.payment.paymentRequestId}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-neutral-400">Status</span>
					<span class="font-medium capitalize {data.payment.status === 'paid' ? 'text-green-600' : 'text-orange-600'}">
						{data.payment.status}
					</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-neutral-400">Method</span>
					<span class="font-medium text-gray-900 dark:text-white uppercase">{data.payment.paymentMethod}</span>
				</div>
			</div>
		</div>
	</div>
</div>
