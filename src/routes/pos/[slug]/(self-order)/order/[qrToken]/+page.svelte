<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	let { data } = $props();
	const { slug, qrToken } = data;
	
	let loading = $state(true);
	let error = $state('');
	let merchant = $state<any>(null);
	let table = $state<any>(null);
	let categories = $state<any[]>([]);
	let products = $state<any[]>([]);
	
	let searchQuery = $state('');
	let selectedCategory = $state<number | null>(null);
	let cart = $state<any[]>([]);
	let showCart = $state(false);
	let selectedProduct = $state<any>(null); // For variant selection modal
	let selectedVariants = $state<Record<string, any>>({}); // { variantName: variantObject }
	let modalQuantity = $state(1); // Quantity in variant modal
	
	let customerName = $state('');
	let customerPhone = $state('');
	let paymentMethod = $state<'qris' | 'cash'>('qris');
	let placingOrder = $state(false);
	
	// Computed filtered products
	let filteredProducts = $derived(() => {
		let result = products;
		
		if (selectedCategory) {
			result = result.filter(p => p.categoryId === selectedCategory);
		}
		
		if (searchQuery) {
			result = result.filter(p => 
				p.name.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
		
		return result;
	});
	
	// Cart totals
	let cartItemCount = $derived(cart.reduce((sum, item) => sum + item.quantity, 0));
	let cartTotal = $derived(cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0));
	
	// LocalStorage key for cart persistence
	const CART_STORAGE_KEY = `cart_${qrToken}`;
	
	onMount(async () => {
		// Load cart from localStorage
		const savedCart = localStorage.getItem(CART_STORAGE_KEY);
		if (savedCart) {
			try {
				cart = JSON.parse(savedCart);
			} catch (e) {
				console.error('Failed to parse saved cart:', e);
			}
		}
		
		await loadMenu();
	});
	
	// Save cart to localStorage whenever it changes
	$effect(() => {
		if (cart.length > 0) {
			localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
		} else {
			localStorage.removeItem(CART_STORAGE_KEY);
		}
	});
	
	async function loadMenu() {
		try {
			loading = true;
			const response = await fetch(`/api/menu?qrToken=${qrToken}`);
			const result = await response.json();
			
			if (!result.success) {
				error = result.error || 'Failed to load menu';
				return;
			}
			
			merchant = result.data.merchant;
			table = result.data.table;
			categories = result.data.categories;
			products = result.data.products;
		} catch (err) {
			error = 'Network error. Please try again.';
			console.error(err);
		} finally {
			loading = false;
		}
	}
	
	function addToCart(product: any, quantity: number = 1, selectedVariantsList: any[] = []) {
		// Generate unique cart key based on product and variants
		const variantKey = selectedVariantsList.map(v => v.id).sort().join('-');
		const cartKey = variantKey ? `${product.id}-${variantKey}` : `${product.id}`;
		const existingItem = cart.find(item => item.cartKey === cartKey);
		
		if (existingItem) {
			existingItem.quantity += quantity;
		} else {
			// Create variant display string (e.g., "Size: Large, Hot/Cold: Hot")
			const variantDisplay = selectedVariantsList.map(v => `${v.variantName}: ${v.variantValue}`).join(', ');
			
			cart.push({
				cartKey,
				productId: product.id,
				productName: product.name,
				unitPrice: product.price,
				quantity: quantity,
				// For API compatibility (single variant fields)
				variantId: selectedVariantsList[0]?.id || null,
				variantName: selectedVariantsList[0]?.variantName || null,
				variantValue: selectedVariantsList[0]?.variantValue || null,
				// For display (all variants)
				variantDisplay: variantDisplay || null,
				allVariants: selectedVariantsList
			});
		}
		
		cart = [...cart];
		// Close variant modal if open
		selectedProduct = null;
		selectedVariants = {};
		modalQuantity = 1;
	}
	
	function handleProductClick(product: any) {
		// If product has variants, show variant selection
		if (product.variants && product.variants.length > 0) {
			selectedProduct = product;
			selectedVariants = {};
			modalQuantity = 1;
		} else {
			// Add directly to cart with quantity 1
			addToCart(product, 1, []);
		}
	}
	
	function updateQuantity(cartKey: string, change: number) {
		const item = cart.find(i => i.cartKey === cartKey);
		if (!item) return;
		
		item.quantity += change;
		
		if (item.quantity <= 0) {
			cart = cart.filter(i => i.cartKey !== cartKey);
		} else {
			cart = [...cart];
		}
	}
	
	function formatPrice(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}
	
	async function placeOrder() {
		if (!customerName.trim()) {
			alert('Please enter your name');
			return;
		}
		
		if (cart.length === 0) {
			alert('Your cart is empty');
			return;
		}

		// Validate payment method based on table settings
		if (paymentMethod === 'cash' && !table.allowPayAtCashier) {
			alert('This table requires payment before ordering. Please use QRIS.');
			return;
		}
		
		try {
			placingOrder = true;
			
			const response = await fetch(`/api/place-order`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					qrToken,
					customerName,
					customerPhone,
					items: cart,
					paymentMethod
				})
			});
			
			const result = await response.json();
			
			if (!result.success) {
				alert(result.error || 'Failed to place order');
				return;
			}
			
			// Clear cart from localStorage after successful order
			localStorage.removeItem(CART_STORAGE_KEY);
			cart = [];
			
			// If QRIS, redirect to payment page, otherwise go to tracking
			if (paymentMethod === 'qris') {
				window.location.href = result.data.paymentUrl || result.data.trackingUrl;
			} else {
				window.location.href = result.data.trackingUrl;
			}
		} catch (err) {
			alert('Network error. Please try again.');
			console.error(err);
		} finally {
			placingOrder = false;
		}
	}
</script>

<svelte:head>
	<title>{merchant?.name || 'Menu'} - Table {table?.name}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center" style="background-color: {merchant?.primaryColor || '#3b82f6'}10">
		<div class="text-center">
			<div 
				class="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4" 
				style="border-color: {merchant?.primaryColor || '#3b82f6'}; border-top-color: transparent"
			></div>
			<p class="text-gray-700 font-medium">Loading menu...</p>
		</div>
	</div>
{:else if error}
	<div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
		<div class="text-center max-w-md mx-auto">
			<div class="text-red-500 text-6xl mb-4">⚠️</div>
			<h2 class="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
			<p class="text-gray-600 mb-6">{error}</p>
			<button 
				onclick={() => window.location.reload()} 
				class="inline-flex items-center gap-x-2 px-6 py-3 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all"
				style="background-color: {merchant?.primaryColor || '#3b82f6'}"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				Try Again
			</button>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gray-50 pb-24">
		<!-- Header -->
		<div class="sticky top-0 z-40 bg-white shadow-sm">
			<div class="p-4 border-b border-gray-300" style="background-color: {merchant.primaryColor}08">
				<div class="flex items-center gap-3 mb-4">
					{#if merchant.logo}
						<div class="flex-shrink-0">
							<img src={merchant.logo} alt={merchant.name} class="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-md" />
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<h1 class="text-xl font-bold text-gray-900 truncate">{merchant.name}</h1>
						<div class="flex items-center gap-2 mt-1">
							<span 
								class="inline-flex items-center gap-x-1.5 py-1 px-2.5 rounded-full text-xs font-medium"
								style="background-color: {merchant.primaryColor}; color: {merchant.primaryTextColor || '#FFFFFF'}"
							>
								<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
									<circle cx="10" cy="10" r="3"/>
								</svg>
								Table {table.name}
							</span>
						</div>
					</div>
				</div>
				
				<!-- Search -->
				<div class="relative">
					<div class="absolute inset-y-0 left-0 flex items-center pointer-events-none z-20 pl-4">
						<svg class="flex-shrink-0 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search for dishes, drinks..."
						class="py-3 px-4 pl-11 border pr-11 block w-full border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
						style="focus:border-color: {merchant.primaryColor}; focus:ring-color: {merchant.primaryColor}"
					/>
					{#if searchQuery}
						<button 
							onclick={() => searchQuery = ''} 
							class="absolute inset-y-0 right-0 flex items-center z-20 pr-4 hover:text-gray-700"
							aria-label="Clear search"
						>
							<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
			</div>
			
			<!-- Categories -->
			{#if categories.length > 0}
				<div class="px-4 py-3 bg-white border-b border-gray-100">
					<div class="flex gap-2 overflow-x-auto hide-scrollbar">
						<button
							onclick={() => selectedCategory = null}
							class="inline-flex items-center gap-x-2 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-all border border-gray-300"
							style={!selectedCategory 
								? `background-color: ${merchant.primaryColor}; color: ${merchant.primaryTextColor}; border-color: ${merchant.primaryColor}` 
								: 'background-color: white; color: #000000; border-color: #e5e7eb'}
						>
							All Menu
						</button>
						{#each categories as category}
							<button
								onclick={() => selectedCategory = category.id}
								class="inline-flex items-center gap-x-2 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-all border hover:border-gray-300"
								style={selectedCategory === category.id 
									? `background-color: ${merchant.primaryColor}; color: ${merchant.primaryTextColor}; border-color: ${merchant.primaryColor}` 
									: 'background-color: white; color: #000000; border-color: #e5e7eb'}
							>
								{category.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Products Grid -->
		<div class="p-4">
			<div class="grid grid-cols-2 gap-3 sm:gap-4">
				{#each filteredProducts() as product}
					<div class="group flex flex-col bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hover:shadow-lg transition">
						<div class="aspect-square bg-gray-100 relative overflow-hidden">
							{#if product.photo}
								<img src={product.photo} alt={product.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
							{:else}
								<div class="w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
									<svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
								</div>
							{/if}
							{#if !product.isActive}
								<div class="absolute inset-0 bg-black/50  flex items-center justify-center">
									<span class="text-white font-semibold text-sm">Unavailable</span>
								</div>
							{/if}
						</div>
						<div class="p-3 flex flex-col flex-grow">
							<h3 class="font-semibold text-gray-800 mb-1 line-clamp-2 text-sm leading-tight">{product.name}</h3>
							<p class="text-base font-bold mt-auto mb-3 text-black">
								{formatPrice(product.price)}
							</p>
							<button
								onclick={() => handleProductClick(product)}
								class="w-full py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
								style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor}"
								disabled={!product.isActive}
							>
								<span class="inline-flex items-center gap-x-1.5">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
									{product.variants && product.variants.length > 0 ? 'Choose' : 'Add to Cart'}
								</span>
							</button>
						</div>
					</div>
				{/each}
			</div>
			
			{#if filteredProducts().length === 0}
				<div class="text-center py-12">
					<div class="text-gray-300 text-6xl mb-4">🔍</div>
					<p class="text-gray-500">No products found</p>
				</div>
			{/if}
		</div>
		
		<!-- Floating Cart Button -->
		{#if cart.length > 0}
			<div class="fixed bottom-0 left-0 right-0 p-4 pointer-events-none">
				<button
					onclick={() => showCart = true}
					class="w-full py-4 rounded-2xl font-bold shadow-2xl flex items-center justify-between px-6 transition-all active:scale-95 pointer-events-auto"
					style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor}"
				>
					<span class="flex items-center gap-3">
						<span class="flex items-center justify-center w-8 h-8 bg-white bg-opacity-25 rounded-full font-bold text-sm backdrop-blur-sm">
							{cartItemCount}
						</span>
						<span class="flex items-center gap-2">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
							View Cart
						</span>
					</span>
					<span class="text-lg font-bold">{formatPrice(cartTotal)}</span>
				</button>
			</div>
		{/if}
		
		<!-- Cart Slide Panel -->
		{#if showCart}
			<!-- Backdrop -->
			<button
				onclick={() => showCart = false}
				class="fixed inset-0 bg-black/50 bg-opacity-50 z-50 transition-opacity"
				aria-label="Close cart"
			></button>
			
			<!-- Cart Panel -->
			<div class="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up shadow-2xl">
				<!-- Cart Header -->
				<div class="flex items-center justify-between p-4 border-b border-gray-300" style="background-color: {merchant.primaryColor}05">
					<div>
						<h2 class="text-xl font-bold text-gray-900">Your Order</h2>
						<p class="text-sm text-gray-500 mt-0.5">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</p>
					</div>
					<button 
						onclick={() => showCart = false} 
						class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						aria-label="Close cart"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				
				<!-- Cart Items -->
				<div class="flex-1 overflow-y-auto p-4 space-y-3">
					{#each cart as item}
						{@const product = products.find(p => p.id === item.productId)}
						<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition">
							<div class="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0">
								{#if product?.photo}
									<img src={product.photo} alt={item.productName} class="w-full h-full object-cover" />
								{:else}
									<div class="w-full h-full flex items-center justify-center">
										<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									</div>
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{item.productName}</h3>
								{#if item.variantDisplay}
									<p class="text-xs text-gray-500">{item.variantDisplay}</p>
								{/if}
								<p class="text-sm font-bold text-black">{formatPrice(item.unitPrice)}</p>
								<p class="text-xs text-black">Subtotal: {formatPrice(item.unitPrice * item.quantity)}</p>
							</div>
							<div class="flex flex-col items-center gap-2">
								<button
									onclick={() => updateQuantity(item.cartKey, 1)}
									class="w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-sm hover:shadow transition"
									style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor}"
									aria-label="Increase quantity"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
								</button>
								<span class="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
								<button
									onclick={() => updateQuantity(item.cartKey, -1)}
									class="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
									aria-label="Decrease quantity"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
				
				<!-- Customer Info & Checkout -->
				<div class="border-t p-4 space-y-4 bg-gray-50">
					<!-- Customer Name -->
					<div>
						<label for="customer-name" class="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
						<input
							id="customer-name"
							type="text"
							bind:value={customerName}
							placeholder="Enter your name"
							class="py-3 border px-4 block w-full border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
							style="focus:border-color: {merchant.primaryColor}; focus:ring-color: {merchant.primaryColor}"
						/>
					</div>

					<!-- WhatsApp Number -->
					<div>
						<label for="customer-phone" class="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number (optional)</label>
						<input
							id="customer-phone"
							type="tel"
							bind:value={customerPhone}
							placeholder="e.g., 08123456789"
							class="py-3 px-4 block w-full border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
							style="focus:border-color: {merchant.primaryColor}; focus:ring-color: {merchant.primaryColor}"
						/>
						<p class="mt-1 text-xs text-gray-500">Get order updates via WhatsApp</p>
					</div>

					<!-- Payment Method -->
					<div>
						<div class="block text-sm font-semibold text-gray-700 mb-3">Payment Method *</div>
						<div class="grid grid-cols-2 gap-3">
							<!-- QRIS Payment -->
							<button
								type="button"
								onclick={() => paymentMethod = 'qris'}
								class="relative flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all"
								style={paymentMethod === 'qris' 
									? `border-color: ${merchant.primaryColor}; background-color: ${merchant.primaryColor}10` 
									: 'border-color: #e5e7eb; background-color: white'}
							>
								{#if paymentMethod === 'qris'}
									<div class="absolute top-2 right-2" style="color: {merchant.primaryColor}">
										<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
										</svg>
									</div>
								{/if}
								<svg class="w-8 h-8" style="color: {paymentMethod === 'qris' ? merchant.primaryColor : '#9ca3af'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
								</svg>
								<span class="text-sm font-semibold" style="color: {paymentMethod === 'qris' ? merchant.primaryColor : '#6b7280'}">QRIS</span>
								<span class="text-xs text-gray-500">Scan & Pay</span>
							</button>

							<!-- Cash Payment -->
							<button
								type="button"
								onclick={() => paymentMethod = 'cash'}
								class="relative flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all"
								style={paymentMethod === 'cash' 
									? `border-color: ${merchant.secondaryColor}; background-color: ${merchant.secondaryColor}10` 
									: 'border-color: #e5e7eb; background-color: white'}
								disabled={!table.allowPayAtCashier}
							>
								{#if paymentMethod === 'cash'}
									<div class="absolute top-2 right-2" style="color: {merchant.secondaryColor}">
										<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
										</svg>
									</div>
								{/if}
								<svg class="w-8 h-8" style="color: {paymentMethod === 'cash' ? merchant.secondaryColor : '#9ca3af'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
								<span class="text-sm font-semibold" style="color: {paymentMethod === 'cash' ? merchant.secondaryColor : '#6b7280'}">Cash</span>
								<span class="text-xs text-gray-500">Pay at Cashier</span>
								{#if !table.allowPayAtCashier}
									<div class="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center">
										<span class="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Not Allowed</span>
									</div>
								{/if}
							</button>
						</div>
						{#if !table.allowPayAtCashier && paymentMethod === 'cash'}
							<p class="mt-2 text-xs text-red-600">⚠️ This table requires payment before ordering. Please use QRIS.</p>
						{/if}
					</div>
					
					<!-- Total -->
					<div class="flex items-center justify-between py-3 border-t border-gray-200">
						<span class="text-base font-semibold text-gray-700">Total Payment</span>
						<span class="text-2xl font-bold text-black">{formatPrice(cartTotal)}</span>
					</div>
					
					<!-- Place Order Button -->
					<button
						onclick={placeOrder}
						disabled={placingOrder || !customerName.trim()}
						class="w-full py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
						style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor || '#FFFFFF'}"
					>
						{#if placingOrder}
							<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Placing Order...
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Place Order
						{/if}
					</button>
				</div>
			</div>
		{/if}
		
		<!-- Variant Selection Modal -->
		{#if selectedProduct}
			<!-- Backdrop -->
			<button
				onclick={() => selectedProduct = null}
				class="fixed inset-0 bg-black/50 bg-opacity-30 z-50 transition-opacity"
				aria-label="Close variant modal"
			></button>
			
			<!-- Modal Panel (Full Height Slide Up - Like Cart) -->
			<div class="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up shadow-2xl">
				<!-- Modal Header -->
				<div class="flex items-center justify-between p-4 border-b border-gray-300" style="background-color: {merchant.secondaryColor}05">
					<div>
						<h3 class="text-lg font-bold text-gray-900">{selectedProduct.name}</h3>
						<p class="text-sm text-gray-500 mt-0.5">Customize your order</p>
					</div>
					<button 
						onclick={() => selectedProduct = null}
						class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						aria-label="Close"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				
				<!-- Scrollable Content -->
				<div class="flex-1 overflow-y-auto">
					<!-- Product Image -->
					{#if selectedProduct.photo}
						<div class="p-4">
							<img src={selectedProduct.photo} alt={selectedProduct.name} class="w-full h-48 object-cover rounded-xl" />
						</div>
					{/if}
					
					<!-- Price -->
					<div class="px-4 pb-4">
						<p class="text-2xl font-bold text-black">
							{formatPrice(selectedProduct.price)}
						</p>
					</div>
					
					<!-- Variants Grouped by Name -->
					<div class="px-4 pb-4 space-y-5">
						{#each Object.entries(selectedProduct.variants.reduce((acc: any, v: any) => {
							if (!acc[v.variantName]) acc[v.variantName] = [];
							acc[v.variantName].push(v);
							return acc;
						}, {})) as [variantName, variants]}
							{@const variantList = variants as any[]}
							<div>
								<p class="text-sm font-bold text-gray-900 mb-3">{variantName} <span class="text-red-500">*</span></p>
								<div class="flex flex-wrap gap-2">
									{#each variantList as variant}
										<button
											onclick={() => selectedVariants[variantName] = variant}
											class="px-4 py-2.5 rounded-lg font-medium text-sm transition-all active:scale-95"
											style={selectedVariants[variantName]?.id === variant.id 
												? `background-color: ${merchant.secondaryColor}; color: ${merchant.secondaryTextColor || '#FFFFFF'}; box-shadow: 0 2px 8px ${merchant.secondaryColor}40` 
												: 'background-color: #f3f4f6; color: #374151; border: 1px solid #e5e7eb'}
										>
											{variant.variantValue}
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
					
					<!-- Quantity Selector -->
					<div class="px-4 pb-6">
						<p class="text-sm font-bold text-gray-900 mb-3">Quantity</p>
						<div class="flex items-center justify-center gap-4">
							<button
								onclick={() => modalQuantity = Math.max(1, modalQuantity - 1)}
								class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition active:scale-95"
								aria-label="Decrease quantity"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
								</svg>
							</button>
							<div class="w-16 text-center">
								<span class="text-3xl font-bold text-gray-900">{modalQuantity}</span>
							</div>
							<button
								onclick={() => modalQuantity++}
								class="w-10 h-10 rounded-full flex items-center justify-center font-bold transition active:scale-95"
								style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor || '#FFFFFF'}"
								aria-label="Increase quantity"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
							</button>
						</div>
					</div>
				</div>
				
				<!-- Add to Cart Button (Fixed at Bottom) -->
				<div class="border-t p-4 bg-gray-50">
					<button
						onclick={() => {
							// Get unique variant names from product
							const variantNames = [...new Set(selectedProduct.variants.map((v: any) => v.variantName))] as string[];
							
							// Check if all variant types are selected
							if (variantNames.some((name: string) => !selectedVariants[name])) {
								alert('Please select all options');
								return;
							}
							
							// Convert selected variants object to array
							const selectedVariantsList = Object.values(selectedVariants);
							addToCart(selectedProduct, modalQuantity, selectedVariantsList);
						}}
						disabled={Object.keys(selectedVariants).length === 0}
						class="w-full py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
						style="background-color: {merchant.secondaryColor}; color: {merchant.secondaryTextColor || '#FFFFFF'}"
					>
						Add {modalQuantity} to Cart • {formatPrice(selectedProduct.price * modalQuantity)}
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	
	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
	
	/* Prevent body scroll when cart is open */
	:global(body:has(.animate-slide-up)) {
		overflow: hidden;
	}
</style>
