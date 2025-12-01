<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { io, type Socket } from 'socket.io-client';
	import BannerSlideshow from '$lib/ui/merchant/BannerSlideshow.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	interface CartItem {
		id: string;
		productId: number;
		productName: string;
		variantId: number | null;
		variantName: string | null;
		variantValue: string | null;
		unitPrice: number;
		qty: number;
		subtotal: number;
	}

	let currentItems = $state<CartItem[]>([]);
	let socket: Socket | null = null;
	let isConnected = $state(false);
	// Use cashier user ID as session identifier
	const cashierSessionId = `cashier-${data.cashier.id}`;
	
	// Payment state
	let paymentMethod = $state<'cash' | 'qris' | null>(null);
	let qrisQrUrl = $state<string | null>(null);
	let qrisAmount = $state<number>(0);
	let showOrderComplete = $state(false);
	
	// Order details
	let orderSubtotal = $state<number>(0);
	let orderTaxEnabled = $state<boolean>(false);
	let orderTaxPercentage = $state<number>(0);
	let orderTaxAmount = $state<number>(0);
	let orderTipEnabled = $state<boolean>(false);
	let orderTipAmount = $state<number>(0);

	// Fullscreen state
	let isFullscreen = $state(false);

	const toggleFullscreen = () => {
		if (typeof document === 'undefined') return;
		
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().then(() => {
				isFullscreen = true;
			}).catch((err) => {
				console.error(`Error attempting to enable fullscreen: ${err.message}`);
			});
		} else {
			document.exitFullscreen().then(() => {
				isFullscreen = false;
			});
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	};

	const calculateTotal = () => {
		return currentItems.reduce((sum, item) => sum + item.subtotal, 0);
	};

	onMount(() => {
		// Listen for fullscreen changes
		const handleFullscreenChange = () => {
			isFullscreen = !!document.fullscreenElement;
		};
		
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		
		// Connect to Socket.IO server
		socket = io({
			path: '/socket.io'
		});

		socket.on('connect', () => {
			console.log('Front view connected to Socket.IO server');
			isConnected = true;
			// Join merchant-specific room
			socket?.emit('join-merchant', data.merchant.id);
			// Join this cashier's specific room
			socket?.emit('join-frontview', data.merchant.id, cashierSessionId);
			// Request current cart state from cashier
			socket?.emit('request-cart-state', cashierSessionId);
		});

		// Listen for initial cart state (on refresh/reconnect)
		socket.on('cart-state', (items: CartItem[], payment?: any) => {
			console.log('Received current cart state:', items, payment);
			currentItems = items;
			
			// Handle payment info if present
			if (payment) {
				paymentMethod = payment.method;
				qrisQrUrl = payment.qrisQrUrl || null;
				qrisAmount = payment.qrisAmount || 0;
				showOrderComplete = true;
				
				orderSubtotal = payment.subtotal || 0;
				orderTaxEnabled = payment.taxEnabled || false;
				orderTaxPercentage = payment.taxPercentage || 0;
				orderTaxAmount = payment.taxAmount || 0;
				orderTipEnabled = payment.tipEnabled || false;
				orderTipAmount = payment.tipAmount || 0;
			}
		});
		
		// Listen for cart updates
		socket.on('cart-updated', (items: CartItem[], payment?: any) => {
			console.log('Cart updated:', items, payment);
			currentItems = items;
			
			// Handle payment info
			if (payment) {
				// Check if this is a payment completion (has method) or just cart update with tax/tip
				if (payment.method) {
					// This is a payment completion event
					paymentMethod = payment.method;
					qrisQrUrl = payment.qrisQrUrl || null;
					qrisAmount = payment.qrisAmount || 0;
					showOrderComplete = true;
				}
				
				// Always update order details (tax/tip info)
				orderSubtotal = payment.subtotal || 0;
				orderTaxEnabled = payment.taxEnabled || false;
				orderTaxPercentage = payment.taxPercentage || 0;
				orderTaxAmount = payment.taxAmount || 0;
				orderTipEnabled = payment.tipEnabled || false;
				orderTipAmount = payment.tipAmount || 0;
			} else {
				// Reset if cart is cleared without payment
				if (items.length === 0) {
					paymentMethod = null;
					qrisQrUrl = null;
					qrisAmount = 0;
					showOrderComplete = false;
					orderSubtotal = 0;
					orderTaxEnabled = false;
					orderTaxPercentage = 0;
					orderTaxAmount = 0;
					orderTipEnabled = false;
					orderTipAmount = 0;
				}
			}
		});

		socket.on('disconnect', () => {
			console.log('Front view disconnected from Socket.IO server');
			isConnected = false;
		});
	});

	onDestroy(() => {
		if (socket) {
			socket.disconnect();
		}
		
		// Remove fullscreen event listener
		if (typeof document !== 'undefined') {
			document.removeEventListener('fullscreenchange', () => {
				isFullscreen = !!document.fullscreenElement;
			});
		}
	});
</script>

<svelte:head>
	<title>Customer Display - {data.merchant.name}</title>
</svelte:head>

<div class="fixed inset-0 flex bg-gray-50 overflow-hidden">
	<!-- Left Side: Banner Slideshow (Full Height) -->
	<div class="w-1/2 h-full">
		<BannerSlideshow 
			banners={data.banners}
			autoPlay={true}
			interval={5000}
			showIndicators={true}
			height="h-full"
		/>
	</div>

	<!-- Right Side: Cart with Header and Footer -->
	<div class="w-1/2 h-full flex flex-col bg-white">
		<!-- Header -->
		<header class="border-b-2 p-6" style="border-color: {data.merchant.primaryColor};">
			<div class="flex items-center justify-between mb-4">
				{#if data.merchant.logo}
					<img src={data.merchant.logo} alt={data.merchant.name} class="h-16 object-contain" />
				{/if}
				<div class="flex items-center gap-3">
					<!-- Fullscreen Button -->
					<button
						onclick={toggleFullscreen}
						class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
						title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
					>
						{#if isFullscreen}
							<!-- Exit Fullscreen Icon -->
							<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
							</svg>
						{:else}
							<!-- Enter Fullscreen Icon -->
							<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
							</svg>
						{/if}
					</button>
					
					<!-- Connection Status -->
					{#if isConnected}
						<span class="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
							<span class="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
							Live
						</span>
					{:else}
						<span class="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
							<span class="w-2 h-2 bg-red-600 rounded-full"></span>
							Disconnected
						</span>
					{/if}
				</div>
			</div>
			<h1 class="text-3xl font-bold mb-1" style="color: {data.merchant.primaryColor};">
				{data.merchant.name}
			</h1>
			<p class="text-gray-600">Your Current Order</p>
		</header>

		<!-- Cart Content (Scrollable) -->
		<div class="flex-1 overflow-y-auto p-6">
				{#if showOrderComplete && paymentMethod === 'qris' && qrisQrUrl}
					<!-- QRIS Payment Display -->
					<div class="h-full flex flex-col items-center justify-center text-center">
						<div class="bg-white p-6 rounded-xl shadow-lg">
							<h3 class="text-2xl font-bold mb-4" style="color: {data.merchant.primaryColor};">
								Scan QR Code to Pay
							</h3>
							<div class="bg-gray-50 p-4 rounded-lg mb-4">
								<img src={qrisQrUrl} alt="QRIS QR Code" class="w-64 h-64 mx-auto" />
							</div>
							
							<!-- Order breakdown -->
							<div class="bg-gray-50 p-4 rounded-lg mb-4 text-left">
								<div class="space-y-2 mb-3">
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">Subtotal</span>
										<span class="font-medium">{formatCurrency(orderSubtotal)}</span>
									</div>
									{#if orderTaxEnabled && orderTaxAmount > 0}
										<div class="flex justify-between text-sm">
											<span class="text-gray-600">Tax ({orderTaxPercentage}%)</span>
											<span class="font-medium">{formatCurrency(orderTaxAmount)}</span>
										</div>
									{/if}
									{#if orderTipEnabled && orderTipAmount > 0}
										<div class="flex justify-between text-sm">
											<span class="text-gray-600">Tip</span>
											<span class="font-medium">{formatCurrency(orderTipAmount)}</span>
										</div>
									{/if}
								</div>
								<div class="border-t-2 pt-2" style="border-color: {data.merchant.primaryColor};">
									<div class="flex justify-between items-center">
										<span class="text-base font-bold">TOTAL</span>
										<span class="text-2xl font-bold" style="color: {data.merchant.primaryColor};">
											{formatCurrency(qrisAmount)}
										</span>
									</div>
								</div>
							</div>
							
							<p class="text-sm text-gray-600">Please scan with any QRIS-enabled app</p>
						</div>
					</div>
				{:else if showOrderComplete && paymentMethod === 'cash'}
					<!-- Order Complete Display for Cash -->
					<div class="h-full flex flex-col items-center justify-center text-center">
						<div class="mb-6">
							<div class="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" 
								style="background-color: {data.merchant.primaryColor};">
								<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<h3 class="text-3xl font-bold mb-2" style="color: {data.merchant.primaryColor};">
								Order Complete!
							</h3>
							<p class="text-lg text-gray-600">Thank you for your purchase</p>
						</div>
						<div class="bg-gray-50 p-6 rounded-lg w-full max-w-md">
							<div class="space-y-2 mb-4">
								<div class="flex justify-between text-base">
									<span class="text-gray-600">Subtotal</span>
									<span class="font-medium">{formatCurrency(orderSubtotal)}</span>
								</div>
							{#if orderTaxEnabled && orderTaxAmount > 0}
								<div class="flex justify-between text-base">
									<span class="text-gray-600">Tax ({orderTaxPercentage}%)</span>
									<span class="font-medium">{formatCurrency(orderTaxAmount)}</span>
								</div>
							{/if}
							{#if orderTipEnabled && orderTipAmount > 0}
								<div class="flex justify-between text-base">
									<span class="text-gray-600">Tip</span>
									<span class="font-medium">{formatCurrency(orderTipAmount)}</span>
								</div>
							{/if}
							</div>
							<div class="border-t-2 pt-3" style="border-color: {data.merchant.primaryColor};">
								<div class="flex justify-between items-center">
									<span class="text-xl font-bold">TOTAL</span>
									<span class="text-4xl font-bold" style="color: {data.merchant.primaryColor};">
										{formatCurrency(qrisAmount)}
									</span>
								</div>
							</div>
						</div>
					</div>
				{:else if currentItems.length > 0}
					<!-- Cart Items -->
					<div class="space-y-3 mb-6">
						{#each currentItems as item (item.id)}
							<div class="bg-white rounded-xl shadow-sm border-2 p-4 animate-fade-in hover:shadow-md transition-shadow" style="border-color: {data.merchant.primaryColor}20;">
								<div class="flex items-start gap-4">
									<!-- Quantity Badge -->
									<div class="flex items-center justify-center w-12 h-12 rounded-xl font-bold text-white flex-shrink-0" 
										style="background-color: {data.merchant.primaryColor};">
										<span class="text-lg">{item.qty}</span>
									</div>
									
									<!-- Product Info -->
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-base text-gray-900 truncate">{item.productName}</h3>
										{#if item.variantValue}
											<p class="text-sm text-gray-500 mt-0.5">{item.variantName}: {item.variantValue}</p>
										{/if}
										<p class="text-sm text-gray-600 mt-1">{formatCurrency(item.unitPrice)} × {item.qty}</p>
									</div>
									
									<!-- Price -->
									<div class="text-right flex-shrink-0">
										<p class="font-bold text-lg" style="color: {data.merchant.primaryColor};">
											{formatCurrency(item.subtotal)}
										</p>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Total -->
					<div class="border-t-2 pt-3" style="border-color: {data.merchant.primaryColor};">
						<div class="space-y-2">
							<div class="flex justify-between text-base">
								<span class="text-gray-600">Subtotal</span>
								<span class="font-medium">{formatCurrency(orderSubtotal || calculateTotal())}</span>
							</div>
							{#if orderTaxEnabled && orderTaxAmount > 0}
								<div class="flex justify-between text-base">
									<span class="text-gray-600">Tax ({orderTaxPercentage}%)</span>
									<span class="font-medium">{formatCurrency(orderTaxAmount)}</span>
								</div>
							{/if}
							{#if orderTipEnabled && orderTipAmount > 0}
								<div class="flex justify-between text-base">
									<span class="text-gray-600">Tip</span>
									<span class="font-medium">{formatCurrency(orderTipAmount)}</span>
								</div>
							{/if}
						</div>
						<div class="flex items-center justify-between mt-3 pt-3 border-t">
							<span class="text-xl font-bold">TOTAL</span>
							<span class="text-2xl font-bold" style="color: {data.merchant.primaryColor};">
								{formatCurrency((orderSubtotal || calculateTotal()) + (orderTaxAmount || 0) + (orderTipAmount || 0))}
							</span>
						</div>
					</div>
				{:else}
					<div class="h-full flex flex-col items-center justify-center text-center">
						<svg class="w-24 h-24 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
						</svg>
						<p class="text-xl text-gray-400 mb-2">No items in cart</p>
						<p class="text-sm text-gray-500">Items will appear here when cashier adds them</p>
					</div>
				{/if}
		</div>

		<!-- Footer -->
		<footer class="border-t-2 py-4 text-center bg-gray-50" style="border-color: {data.merchant.primaryColor};">
			<p class="text-lg font-medium" style="color: {data.merchant.primaryColor};">
				Thank you for choosing {data.merchant.name}!
			</p>
			
		</footer>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fadeIn 0.5s ease-out;
	}

	/* Hide scrollbar but keep functionality */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}

	.overflow-y-auto::-webkit-scrollbar-track {
		background: transparent;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: #cbd5e0;
		border-radius: 3px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: #a0aec0;
	}
</style>
