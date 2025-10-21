<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let payment = $state<any>(null);
	let merchant = $state<any>(null);
	let order = $state<any>(null);
	let loading = $state(true);
	let error = $state('');
	let checkingPayment = $state(false);
	let timeRemaining = $state(0);
	let intervalId: any = null;
	let countdownId: any = null;

	const { slug, qrToken, paymentId } = data;

	// Format currency
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	};

	// Format time remaining as HH:MM:SS
	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Load payment details
	const loadPayment = async () => {
		try {
			loading = true;
			const response = await fetch(`/api/qris/${paymentId}`);
			const result = await response.json();

			if (!result.success) {
				error = result.error || 'Failed to load payment';
				return;
			}

			// Use same structure as sales system, but add amount from order
			payment = {
				status: result.data.status,
				expiresAt: result.data.expires_at,
				qrString: result.data.qrString,
				paymentRequestId: result.data.payment_request_id,
				amount: result.data.payment?.amount || 0
			};
			merchant = result.data.merchant;
			order = result.data.order;

			// Calculate time remaining
			if (payment.expiresAt) {
				const expiresAt = new Date(payment.expiresAt).getTime();
				const now = Date.now();
				timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
			}

			// Check if payment is already completed
			if (payment.status === 'SUCCEEDED') {
				// Redirect to tracking
				goto(`/order/${qrToken}/track/${order.uuid}`);
			} else if (['CANCELED', 'EXPIRED', 'FAILED'].includes(payment.status)) {
				error = `Payment ${payment.status.toLowerCase()}`;
			}

			loading = false;
		} catch (err) {
			console.error('Error loading payment:', err);
			error = 'Failed to load payment details';
			loading = false;
		}
	};

	// Check payment status (polling)
	const checkPaymentStatus = async () => {
		if (checkingPayment) return;

		try {
			checkingPayment = true;
			const response = await fetch(`/api/qris/${paymentId}`);
			const result = await response.json();

			if (result.success) {
				// Use same structure as sales system, but add amount from order
				payment = {
					status: result.data.status,
					expiresAt: result.data.expires_at,
					qrString: result.data.qrString,
					paymentRequestId: result.data.payment_request_id,
					amount: result.data.payment?.amount || result.data.order?.total || 0
				};

				// If payment succeeded, redirect to tracking
				if (payment.status === 'SUCCEEDED') {
					clearInterval(intervalId);
					clearInterval(countdownId);
					goto(`/order/${qrToken}/track/${order.uuid}`);
				} else if (['CANCELED', 'EXPIRED', 'FAILED'].includes(payment.status)) {
					clearInterval(intervalId);
					clearInterval(countdownId);
					error = `Payment ${payment.status.toLowerCase()}`;
				}
			}

			checkingPayment = false;
		} catch (err) {
			console.error('Error checking payment:', err);
			checkingPayment = false;
		}
	};

	// Countdown timer
	const startCountdown = () => {
		// Only start countdown if we have a valid expiration time
		if (timeRemaining <= 0) {
			return;
		}
		
		countdownId = setInterval(() => {
			if (timeRemaining > 0) {
				timeRemaining--;
			} else {
				clearInterval(countdownId);
				// Only set error if payment is still pending (not already succeeded/failed)
				if (payment && !['SUCCEEDED', 'CANCELED', 'FAILED', 'EXPIRED'].includes(payment.status)) {
					error = 'Payment expired';
				}
			}
		}, 1000);
	};

	onMount(async () => {
		await loadPayment();

		// Poll payment status every 5 seconds
		intervalId = setInterval(checkPaymentStatus, 5000);

		// Start countdown after payment data is loaded
		startCountdown();
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
		if (countdownId) clearInterval(countdownId);
	});
</script>

<div class="min-h-screen bg-gray-50">
	{#if loading}
		<!-- Loading State -->
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
				<p class="text-gray-600">Loading payment...</p>
			</div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="flex items-center justify-center min-h-screen p-4">
			<div class="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
				<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>
				<h2 class="text-xl font-bold text-gray-900 mb-2">Payment Error</h2>
				<p class="text-gray-600 mb-6">{error}</p>
				<button
					onclick={() => goto(`/order/${qrToken}`)}
					class="w-full py-3 px-4 rounded-xl font-semibold transition hover:opacity-90"
					style="background-color: {merchant?.secondaryColor || '#3b82f6'}; color: {merchant?.secondaryTextColor || '#FFFFFF'}"
				>
					Back to Menu
				</button>
			</div>
		</div>
	{:else if payment && merchant}
		<!-- Payment Page -->
		<div class="max-w-lg mx-auto">
			<!-- Header -->
			<div class="bg-white border-b sticky top-0 z-10">
				<div class="p-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							{#if merchant.logo}
								<img src={merchant.logo} alt={merchant.name} class="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100" />
							{/if}
							<div>
								<h1 class="font-bold text-gray-900">{merchant.name}</h1>
								<p class="text-xs text-gray-500">Order #{order?.orderNumber}</p>
							</div>
						</div>
						{#if timeRemaining > 0}
							<div class="text-right">
								<p class="text-xs text-gray-500">Expires in</p>
								<p class="text-lg font-bold" style="color: {timeRemaining < 60 ? '#ef4444' : merchant.secondaryColor}">
									{formatTime(timeRemaining)}
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- QR Code Section -->
			<div class="p-6">
				<div class="bg-white rounded-2xl shadow-lg p-6 text-center">
					<h2 class="text-xl font-bold text-gray-900 mb-2">Scan to Pay</h2>
					<p class="text-sm text-gray-600 mb-6">Use any e-wallet app that supports QRIS</p>

					<!-- QR Code -->
					{#if payment.qrString}
						<div class="bg-white p-4 rounded-xl border-2 inline-block mb-6" style="border-color: {merchant.secondaryColor}">
							<img 
								src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payment.qrString)}`} 
								alt="QRIS QR Code"
								class="w-64 h-64"
							/>
						</div>
					{/if}

					<!-- Payment Amount -->
					<div class="bg-gray-50 rounded-xl p-4 mb-4">
						<p class="text-sm text-gray-600 mb-1">Total Payment</p>
						<p class="text-3xl font-bold text-black">
							{formatPrice(payment.amount)}
						</p>
					</div>

					<!-- Instructions -->
					<div class="text-left space-y-3 mb-6">
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor || '#FFFFFF'}">1</div>
							<p class="text-sm text-gray-600">Open your e-wallet app (GoPay, OVO, Dana, etc.)</p>
						</div>
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor || '#FFFFFF'}">2</div>
							<p class="text-sm text-gray-600">Scan the QR code above</p>
						</div>
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor || '#FFFFFF'}">3</div>
							<p class="text-sm text-gray-600">Confirm payment in your app</p>
						</div>
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor || '#FFFFFF'}">4</div>
							<p class="text-sm text-gray-600">You'll be automatically redirected after successful payment</p>
						</div>
					</div>

					<!-- Checking Status -->
					{#if checkingPayment}
						<div class="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
							<div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
							<span>Checking payment status...</span>
						</div>
					{/if}

					<!-- Cancel Button -->
					<button
						onclick={() => {
							if (confirm('Are you sure you want to cancel this payment?')) {
								goto(`/order/${qrToken}`);
							}
						}}
						class="w-full py-3 px-4 rounded-xl font-semibold transition hover:opacity-90"
						style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor || '#FFFFFF'}"
					>
						Cancel Payment
					</button>
				</div>

				<!-- Payment Status Info -->
				<div class="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
					<div class="flex items-start gap-3">
						<svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div class="text-sm text-blue-800">
							<p class="font-semibold mb-1">Payment Status: {payment.status}</p>
							<p>We're automatically checking your payment status every 5 seconds. Please complete the payment in your e-wallet app.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
