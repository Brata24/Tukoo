<script lang="ts">
	import { onMount } from "svelte";
	import { fly, slide } from "svelte/transition";
	import { toast } from "$lib/stores/toast";
	import QRCode from "qrcode";

	// Props from page data
	let { data, form } = $props();

	// Cart state
	type CartItem = {
		id: string;
		productId: number;
		productName: string;
		variantId: number | null;
		variantName: string | null;
		variantValue: string | null;
		unitPrice: number;
		qty: number;
		subtotal: number;
	};

	let cart = $state<CartItem[]>([]);
	let diningOption = $state<"pickup" | "dinein">("pickup");
	let selectedTableId = $state<number | null>(null);

	// Tax and Tip state
	let taxEnabled = $state(false);
	let taxPercentage = $state(11); // 11% default
	let tipEnabled = $state(false);
	let tipAmount = $state(0); // in cents

	// Customer state
	let customerName = $state("");
	let customerPhone = $state("");
	let customerSuggestions = $state<any[]>([]);
	let showCustomerSuggestions = $state(false);
	let customerNameError = $state("");

	// Filter state
	let searchQuery = $state("");
	let selectedCategoryId = $state<number | null>(null);

	// Products from API
	let products = $state<any[]>([]);
	let loading = $state(false);

	// Merchant colors
	let secondaryColor = $state(data.merchant?.secondaryColor || "#3b82f6");
	let secondaryTextColor = $state(data.merchant?.secondaryTextColor || "#ffffff");
	let primaryColor = $state(data.merchant?.primaryColor || "#1e40af");
	let primaryTextColor = $state(data.merchant?.primaryTextColor || "#ffffff");

	// Modal state
	let showVariantModal = $state(false);
	let selectedProduct = $state<any>(null);
	let selectedVariantsByGroup = $state<Record<string, any>>({});
	let quantity = $state(1);
	let paymentMethod = $state<"cash" | "qris">("cash");
	let orderNotes = $state("");

	// Modal state
	let showPaymentModal = $state(false); // Payment form (customer info + notes + payment method)
	let showQrisModal = $state(false);
	let showSuccessModal = $state(false);

	// QRIS state
	let qrisInvoiceUrl = $state<string | null>(null);
	let qrisQrString = $state<string | null>(null);
	let qrisQrImgUrl = $state<string | null>(null);
	let qrisPaymentRequestId = $state<string | null>(null);
	let qrisExpiresAt = $state<string | null>(null);
	let qrisStatus = $state<string | null>(null);
	let qrisAmount = $state<number>(0);
	let qrisTimeRemaining = $state<string>("");
	let qrisPollingInterval: ReturnType<typeof setInterval> | null = null;
	let qrisCountdownInterval: ReturnType<typeof setInterval> | null = null;

	// Success modal state
	let createdOrderId = $state<number | null>(null);
	let createdOrderDetails = $state<any>(null);

	// Computed totals
	let subtotal = $derived(cart.reduce((sum, item) => sum + item.subtotal, 0));
	let tax = $derived(taxEnabled ? Math.round(subtotal * (taxPercentage / 100)) : 0);
	let tip = $derived(tipEnabled ? tipAmount : 0);
	let total = $derived(subtotal + tax + tip);

	// Group variants by variant name
	let groupedVariants = $derived.by(() => {
		if (!selectedProduct || !selectedProduct.variants) return {};

		const groups: Record<string, any[]> = {};
		selectedProduct.variants.forEach((variant: any) => {
			const groupName = variant.variantName || "Options";
			if (!groups[groupName]) {
				groups[groupName] = [];
			}
			groups[groupName].push(variant);
		});

		return groups;
	});

	// Manual check QRIS payment status (force check via button)
	async function manualCheckQris() {
		if (!qrisPaymentRequestId) return;
		try {
			const r = await fetch(`/api/qris/${qrisPaymentRequestId}?forceCheck=true`);
			const j = await r.json();
			if (j?.data) {
				qrisStatus = j.data.status;
				if (qrisStatus === 'SUCCEEDED' || qrisStatus === 'completed') {
					showQrisModal = false;
					if (createdOrderId) {
						await fetchOrderDetails(createdOrderId);
					}
					showSuccessModal = true;
				} else {
					toast.info(`Payment status: ${qrisStatus}`);
				}
			}
		} catch (e) {
			console.error('Manual check error:', e);
			toast.error('Failed to check payment status');
		}
	}

	// Show notification
	// Customer autocomplete functions	// Fetch products from API
	async function fetchProducts() {
		loading = true;
		try {
			let url = "/api/products?page=1&limit=100";

			if (selectedCategoryId) {
				url += `&categoryId=${selectedCategoryId}`;
			}

			if (searchQuery.trim()) {
				url += `&search=${encodeURIComponent(searchQuery.trim())}`;
			}

			const response = await fetch(url);
			const result = await response.json();

			if (result.success) {
				products = result.products;
			}
		} catch (error) {
			console.error("Error fetching products:", error);
		} finally {
			loading = false;
		}
	}

	// Handle category filter
	function filterByCategory(categoryId: number | null) {
		selectedCategoryId = categoryId;
		fetchProducts();
	}

	// Handle search with debounce
	let searchTimeout: any;
	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			fetchProducts();
		}, 300);
	}

	// Search customers with debounce
	let customerSearchTimeout: any;
	async function searchCustomers() {
		clearTimeout(customerSearchTimeout);
		customerSearchTimeout = setTimeout(async () => {
			if (customerPhone.length < 3 && customerName.length < 3) {
				customerSuggestions = [];
				showCustomerSuggestions = false;
				return;
			}

			try {
				const query = customerPhone || customerName;
				const response = await fetch(`/api/customers?q=${encodeURIComponent(query)}`);
				const result = await response.json();

				if (result.success) {
					customerSuggestions = result.customers;
					showCustomerSuggestions = result.customers.length > 0;
				}
			} catch (error) {
				console.error("Error searching customers:", error);
			}
		}, 300);
	}

	// Select customer from suggestions
	function selectCustomer(customer: any) {
		customerName = customer.customerName || "";
		customerPhone = customer.customerPhone || "";
		showCustomerSuggestions = false;
	}

	// Open variant modal when product is clicked
	function openProductModal(product: any) {
		selectedProduct = product;
		selectedVariantsByGroup = {};

		// Pre-select first variant in each group
		if (product.variants && product.variants.length > 0) {
			const groups: Record<string, any[]> = {};
			product.variants.forEach((variant: any) => {
				const groupName = variant.variantName || "Options";
				if (!groups[groupName]) {
					groups[groupName] = [];
				}
				groups[groupName].push(variant);
			});

			// Select first variant in each group
			Object.keys(groups).forEach((groupName) => {
				selectedVariantsByGroup[groupName] = groups[groupName][0];
			});
		}

		quantity = 1;
		showVariantModal = true;
	}

	function closeQrisModal() {
		stopQrisPolling();
		showQrisModal = false;
		
		// Reset body overflow after modal animation completes
		setTimeout(() => {
			document.body.style.overflow = '';
			document.body.style.removeProperty('overflow');
		}, 300);
	}

	function closeSuccessModal() {
		showSuccessModal = false;
		
		// Reset body overflow after modal animation completes
		setTimeout(() => {
			document.body.style.overflow = '';
			document.body.style.removeProperty('overflow');
		}, 300);
	}

	// Add to cart
	function addToCart() {
		if (!selectedProduct) return;

		// Build variant identifier from all selected variants
		const selectedVariants = Object.values(selectedVariantsByGroup);
		const variantNames = selectedVariants.map((v: any) => v.variantName).join(", ");
		const variantValues = selectedVariants.map((v: any) => v.variantValue).join(", ");

		// Use first variant ID for identification (since DB only stores one variantId)
		const firstVariant = selectedVariants[0] as any;
		const variantId = firstVariant?.id || null;

		// Create unique ID based on product and variant combination
		const itemId = `${selectedProduct.id}-${variantId || 0}-${variantValues}`;

		// Check if this exact item already exists in cart
		const existingItem = cart.find(
			(item) =>
				item.productId === selectedProduct.id && item.variantId === variantId && item.variantValue === variantValues
		);

		if (existingItem) {
			// Update existing item quantity
			existingItem.qty += quantity;
			existingItem.subtotal = existingItem.qty * existingItem.unitPrice;
			cart = [...cart]; // Trigger reactivity with new array reference
		} else {
			// Add new item to cart
			cart = [
				...cart,
				{
					id: itemId,
					productId: selectedProduct.id,
					productName: selectedProduct.name,
					variantId: variantId,
					variantName: variantNames || null,
					variantValue: variantValues || null,
					unitPrice: selectedProduct.price,
					qty: quantity,
					subtotal: selectedProduct.price * quantity
				}
			];
		}

		showVariantModal = false;
	}

	// Update cart item quantity
	function updateQuantity(itemId: string, newQty: number) {
		if (newQty <= 0) {
			removeFromCart(itemId);
			return;
		}
		const item = cart.find((i) => i.id === itemId);
		if (item) {
			item.qty = newQty;
			item.subtotal = item.qty * item.unitPrice;
			cart = [...cart]; // Trigger reactivity with new array reference
		}
	}

	// Remove from cart
	function removeFromCart(itemId: string) {
		const newCart = cart.filter((item) => item.id !== itemId);
		cart = newCart;
	}

	// Proceed to payment
	function proceedToPayment() {
		if (cart.length === 0) {
			toast.error("Cart is empty!");
			return;
		}

		if (!customerName.trim()) {
			customerNameError = "Please enter customer name";
			toast.error("Please enter customer name");
			return;
		}

		if (diningOption === "dinein" && !selectedTableId) {
			toast.error("Please select a table for dine-in");
			return;
		}

		showPaymentModal = true;
	}

	// Submit order
	let isSubmitting = $state(false);

	function stopQrisPolling() {
		if (qrisPollingInterval) {
			clearInterval(qrisPollingInterval);
			qrisPollingInterval = null;
		}
		if (qrisCountdownInterval) {
			clearInterval(qrisCountdownInterval);
			qrisCountdownInterval = null;
		}
	}

	function startQrisCountdown() {
		if (!qrisExpiresAt) return;
		
		// Stop any existing countdown
		if (qrisCountdownInterval) {
			clearInterval(qrisCountdownInterval);
		}

		// Update countdown every second
		qrisCountdownInterval = setInterval(() => {
			if (!qrisExpiresAt) {
				qrisTimeRemaining = "";
				return;
			}

			const now = new Date().getTime();
			const expiry = new Date(qrisExpiresAt).getTime();
			const diff = expiry - now;

			if (diff <= 0) {
				qrisTimeRemaining = "Expired";
				clearInterval(qrisCountdownInterval!);
				qrisCountdownInterval = null;
				qrisStatus = 'EXPIRED';
				return;
			}

			const minutes = Math.floor(diff / 60000);
			const seconds = Math.floor((diff % 60000) / 1000);
			qrisTimeRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		}, 1000);
	}
	
	function sendToWhatsApp() {
		toast.success('WhatsApp message sent!');
	}
	
	function printReceipt() {
		if (!createdOrderDetails) {
			toast.error('Order details not available');
			return;
		}

		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		const order = createdOrderDetails.order;
		const items = createdOrderDetails.items;
		const table = createdOrderDetails.table;

		// Prepare cart items HTML - Thermal printer style
		const cartItemsHtml = items.map((orderItem: any) => `
			<div class="item">
				<div class="item-name">${orderItem.productName}</div>
				${orderItem.variantValue ? `<div class="item-variant">${orderItem.variantValue}</div>` : ''}
				<div class="item-details">
					<span>${orderItem.quantity} x ${formatRupiah(orderItem.unitPrice)}</span>
					<span>${formatRupiah(orderItem.subtotal)}</span>
				</div>
			</div>
		`).join('');

		const receiptHtml = `
			<html>
				<head>
					<title>Receipt - ${order.orderNumber}</title>
					<style>
						@media print {
							@page { 
								size: 80mm auto;
								margin: 0mm;
							}
							body { 
								margin: 0mm;
								padding: 2mm;
							}
						}
						body {
							font-family: 'Courier New', 'Courier', monospace;
							width: 80mm;
							max-width: 80mm;
							margin: 0 auto;
							padding: 5mm;
							font-size: 12px;
							line-height: 1.4;
							color: #000;
						}
						.header {
							text-align: center;
							margin-bottom: 10px;
							padding-bottom: 8px;
							border-bottom: 1px dashed #000;
						}
						.merchant-logo {
							width: 60px;
							height: 60px;
							margin: 0 auto 8px;
							filter: grayscale(100%);
							object-fit: contain;
						}
						.merchant-name {
							font-size: 16px;
							font-weight: bold;
							margin-bottom: 4px;
							text-transform: uppercase;
						}
						.merchant-info {
							font-size: 10px;
							line-height: 1.3;
						}
						.separator {
							border-bottom: 1px dashed #000;
							margin: 8px 0;
						}
						.order-info {
							font-size: 11px;
							margin: 8px 0;
						}
						.order-info div {
							display: flex;
							justify-content: space-between;
							margin: 3px 0;
						}
						.items-section {
							margin: 10px 0;
							border-top: 1px dashed #000;
							border-bottom: 1px dashed #000;
							padding: 8px 0;
						}
						.item {
							margin: 8px 0;
							font-size: 11px;
						}
						.item-name {
							font-weight: bold;
							margin-bottom: 2px;
						}
						.item-variant {
							font-size: 10px;
							color: #333;
							margin-bottom: 3px;
							padding-left: 8px;
						}
						.item-details {
							display: flex;
							justify-content: space-between;
							font-size: 11px;
						}
						.totals {
							margin-top: 10px;
							font-size: 11px;
						}
						.totals div {
							display: flex;
							justify-content: space-between;
							margin: 5px 0;
						}
						.total-line {
							font-size: 14px;
							font-weight: bold;
							padding-top: 8px;
							margin-top: 8px;
							border-top: 1px solid #000;
						}
						.footer {
							text-align: center;
							margin-top: 15px;
							padding-top: 10px;
							border-top: 1px dashed #000;
							font-size: 10px;
						}
						.footer p {
							margin: 5px 0;
						}
					</style>
				</head>
				<body>
					<div class="header">
						${data.merchant?.logo ? `
							<img src="${data.merchant.logo}" alt="Logo" class="merchant-logo" />
						` : ''}
						<div class="merchant-name">${data.merchant?.name || 'TUKOO POS'}</div>
						<div class="merchant-info">
							${data.merchant?.address || ''}
						</div>
					</div>

					<div class="order-info">
						<div>
							<span>No:</span>
							<strong>${order.orderNumber}</strong>
						</div>
						<div>
							<span>Tanggal:</span>
							<span>${new Date(order.createdAt).toLocaleDateString('id-ID', { 
								day: '2-digit',
								month: '2-digit', 
								year: 'numeric'
							})} ${new Date(order.createdAt).toLocaleTimeString('id-ID', {
								hour: '2-digit',
								minute: '2-digit'
							})}</span>
						</div>
						<div>
							<span>Kasir:</span>
							<span>${data.userPos?.name || 'Staff'}</span>
						</div>
						<div>
							<span>Customer:</span>
							<span>${order.customerName}</span>
						</div>
						${order.customerPhone ? `
						<div>
							<span>Telp:</span>
							<span>+62${order.customerPhone}</span>
						</div>
						` : ''}
						<div>
							<span>Tipe:</span>
							<span>${order.diningOption === 'dinein' ? 'Dine In' : 'Pickup'}${order.diningOption === 'dinein' && table ? ` - ${table.name}` : ''}</span>
						</div>
						<div>
							<span>Pembayaran:</span>
							<span>${order.paymentMethod?.toUpperCase()}</span>
						</div>
					</div>

					<div class="items-section">
						${cartItemsHtml}
					</div>

					<div class="totals">
						<div>
							<span>Subtotal</span>
							<span>${formatRupiah(order.subtotal)}</span>
						</div>
						${order.tax > 0 ? `
						<div>
							<span>PPN 11%</span>
							<span>${formatRupiah(order.tax)}</span>
						</div>
						` : ''}
						${order.tip > 0 ? `
						<div>
							<span>Tip</span>
							<span>${formatRupiah(order.tip)}</span>
						</div>
						` : ''}
						<div class="total-line">
							<span>TOTAL</span>
							<strong>${formatRupiah(order.total)}</strong>
						</div>
					</div>

					<div class="footer">
						<p>Terima kasih atas kunjungan Anda!</p>
						<p>Selamat menikmati!</p>
						<p style="margin-top: 8px; font-size: 9px;">Powered by TUKOO POS</p>
					</div>

					<script type="text/javascript">
						window.onload = function() {
							window.print();
						};
					<\/script>
				</body>
			</html>
		`;

		printWindow.document.write(receiptHtml);
		printWindow.document.close();
	}
	async function submitOrder() {
		if (isSubmitting) return;
		
		isSubmitting = true;
		showPaymentModal = false;

		const requestBody = {
			cart,
			diningOption,
			tableId: selectedTableId ? selectedTableId.toString() : null,
			paymentMethod,
			notes: orderNotes || null,
			tax,
			tip,
			customerName: customerName.trim(),
			customerPhone: customerPhone?.trim() || null
		};

		try {
			const response = await fetch("/api/orders/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody)
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				toast.error(data.error || "Failed to create order");
				return;
			}
			
			// Store order ID to fetch full details later
			createdOrderId = data.orderId;

			// Store the total amount BEFORE clearing cart (since total is derived from cart)
			const orderTotal = total;

			// Clear cart immediately after order is created (prevent duplicates on refresh/close)
			cart = [];
			await clearCartFromDB();

			if (data.paymentMethod === "cash") {
				// Fetch full order details from API
				await fetchOrderDetails(data.orderId);
				showSuccessModal = true;
			} else if (data.paymentMethod === 'qris') {
				// Set QRIS data
				qrisPaymentRequestId = data.payment_request_id;
				qrisExpiresAt = data.expires_at;
				qrisStatus = data.status || 'REQUIRES_ACTION';
				qrisAmount = orderTotal; // Use stored total amount (not the reactive total which is now 0)
				
				// Show modal immediately
				showQrisModal = true;
				
				// Start countdown timer
				startQrisCountdown();
				
				// Generate QR code image
				if (data.qrString) {
					qrisQrString = data.qrString;
					QRCode.toDataURL(data.qrString, { width: 260 })
						.then((url: string) => { qrisQrImgUrl = url; })
						.catch((err: any) => { console.error('QR generation failed:', err); });
				}

				// Start payment status polling
				stopQrisPolling();
				qrisPollingInterval = setInterval(async () => {
					if (!qrisPaymentRequestId) return;
					try {
						const r = await fetch(`/api/qris/${qrisPaymentRequestId}`);
						const j = await r.json();
						if (j?.data) {
							qrisStatus = j.data.status;
							if (qrisStatus === 'SUCCEEDED') {
								closeQrisModal();
								// Fetch full order details from API before showing success modal
								if (createdOrderId) {
									await fetchOrderDetails(createdOrderId);
								}
								showSuccessModal = true;
							} else if (['CANCELED', 'FAILED'].includes(qrisStatus ?? '')) {
								closeQrisModal();
								toast.error('Payment failed or canceled');
							} else if (qrisStatus === 'EXPIRED') {
								// Don't auto-close on expired, let user see the expired status
								stopQrisPolling();
							}
						}
					} catch (e) {
						console.error('QRIS polling error:', e);
					}
				}, 10000); // Poll every 10 seconds (production: webhook updates DB, dev: polls Xendit API)
			} else if (data.paymentMethod === "xendit" && data.xenditInvoiceUrl) {
				window.open(data.xenditInvoiceUrl, "_blank");
				toast.success(`Order ${data.orderNumber} created! Please complete payment.`);
			}
		} catch (e) {
			console.error('Order creation error:', e);
			toast.error("Failed to create order");
		} finally {
			isSubmitting = false;
		}
	}

	// Save cart to database
	async function saveCartToDB() {
		try {
			await fetch(`/api/cart`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ cart })
			});
		} catch (e) {
			console.error("Failed to save cart:", e);
		}
	}

	async function clearCartFromDB() {
		try {
			await fetch(`/api/cart`, {
				method: "DELETE"
			});
		} catch (e) {
			console.error("Failed to clear cart:", e);
		}
	}

	async function fetchOrderDetails(orderId: number) {
		try {
			const response = await fetch(`../../api/orders/${orderId}`);
			const result = await response.json();
			
			if (result.success) {
				createdOrderDetails = {
					order: result.order,
					table: result.table,
					// Extract orderItem from the nested structure
					items: result.items.map((item: any) => item.orderItem)
				};
			} else {
				console.error('Failed to fetch order details:', result.error);
			}
		} catch (error) {
			console.error('Error fetching order details:', error);
		}
	}

	let saveCartTimeout: any;
	$effect(() => {
		const currentCart = cart;

		clearTimeout(saveCartTimeout);
		saveCartTimeout = setTimeout(() => {
			if (currentCart.length > 0) {
				saveCartToDB();
			} else {
				clearCartFromDB();
			}
		}, 500); // 500ms debounce
	});

	function formatRupiah(amount: number): string {
		return `Rp ${amount.toLocaleString("id-ID")}`;
	}

	onMount(() => {
		if (typeof window !== "undefined" && (window as any).HSStaticMethods) {
			(window as any).HSStaticMethods.autoInit();
		}

		fetchProducts();

		if (data.savedCart && data.savedCart.length > 0) {
			const cartMap = new Map();

			data.savedCart.forEach((item: any) => {
				// Create unique key based on product, variant ID, and variant value
				const itemKey = `${item.productId}-${item.variantId || 0}-${item.variantValue || ""}`;

				if (cartMap.has(itemKey)) {
					const existing = cartMap.get(itemKey);
					existing.qty += item.quantity;
					existing.subtotal += item.subtotal;
				} else {
					cartMap.set(itemKey, {
						id: itemKey,
						productId: item.productId,
						productName: item.productName,
						variantId: item.variantId,
						variantName: item.variantName,
						variantValue: item.variantValue,
						unitPrice: item.unitPrice,
						qty: item.quantity,
						subtotal: item.subtotal
					});
				}
			});

			cart = Array.from(cartMap.values());
		}

		
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest(".customer-autocomplete")) {
				showCustomerSuggestions = false;
			}
		};
		document.addEventListener("click", handleClickOutside);

		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	});
</script>

<div class="flex h-screen bg-gray-50">
	<!-- Main content: Product grid -->
	<div class="flex-1 overflow-y-auto p-6">
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-gray-800">Menu</h1>
			<p class="text-gray-600">Select items to add to cart</p>
		</div>

		<!-- Filters -->
		<div class="mb-6 space-y-4">
			<!-- Search bar -->
			<div class="relative">
				<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
					<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						></path>
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					oninput={handleSearch}
					placeholder="Search products..."
					class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			<!-- Category filter as tabs -->
			<div class="border-b border-gray-200">
				<nav class="flex gap-x-5 overflow-x-auto">
					<button
						type="button"
						onclick={() => filterByCategory(null)}
						class="py-4 px-1 inline-flex items-center gap-2 border-b-2 whitespace-nowrap text-sm transition-colors"
						style={selectedCategoryId === null
							? `border-color: ${secondaryColor}; color: ${secondaryColor}; font-weight: 600;`
							: "border-color: transparent; color: #6b7280;"}
					>
						All
					</button>
					{#each data.categories as category}
						<button
							type="button"
							onclick={() => filterByCategory(category.id)}
							class="py-4 px-1 inline-flex items-center gap-2 border-b-2 whitespace-nowrap text-sm transition-colors"
							style={selectedCategoryId === category.id
								? `border-color: ${secondaryColor}; color: ${secondaryColor}; font-weight: 600;`
								: "border-color: transparent; color: #6b7280;"}
						>
							{category.name}
						</button>
					{/each}
				</nav>
			</div>
		</div>

		<!-- Products count -->
		<div class="mb-4 text-sm text-gray-600">
			{#if loading}
				Loading products...
			{:else}
				Showing {products.length} product{products.length !== 1 ? "s" : ""}
			{/if}
		</div>

		{#if loading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2" style="border-color: {secondaryColor};"></div>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each products as product}
					<button
						type="button"
						class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 text-left"
						onclick={() => openProductModal(product)}
					>
						{#if product.photo}
							<div class="aspect-square bg-gray-200 rounded-lg mb-3 overflow-hidden">
								<img src={product.photo} alt={product.name} class="w-full h-full object-cover" />
							</div>
						{:else}
							<div class="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
								<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									></path>
								</svg>
							</div>
						{/if}

						<h3 class="font-semibold text-gray-800 mb-1">{product.name}</h3>
						<p class="text-sm text-gray-500 mb-2">{product.categoryName || "Uncategorized"}</p>
						<div class="flex items-center justify-between">
							<span class="text-lg font-bold" style="color: {secondaryColor};">{formatRupiah(product.price)}</span>
							{#if !product.infiniteStock && product.stock < 10}
								<span class="text-xs text-orange-600">Stock: {product.stock}</span>
							{/if}
						</div>
						<div class="mt-2 text-xs text-gray-500">
							{product.variants.length} variant(s)
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if cart.length > 0}
		<aside
			class="w-96 rounded-xl mx-4 my-2 bg-white border border-gray-200 flex flex-col"
			transition:fly={{ x: 200, duration: 500 }}
		>
			<div class="p-4 border-b border-gray-200">
				<h2 class="text-xl font-bold text-gray-800">Cart</h2>
			</div>

			<div class="flex-1 overflow-y-auto p-4">
				{#if cart.length === 0}
					<div class="text-center py-12">
						<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
							></path>
						</svg>
						<p class="mt-2 text-gray-500">Cart is empty</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each cart as item}
							<div class="bg-gray-50 rounded-lg p-3">
								<div class="flex justify-between items-start mb-2">
									<div class="flex-1">
										<h4 class="font-semibold text-gray-800">{item.productName}</h4>
										{#if item.variantName && item.variantValue}
											<p class="text-sm text-gray-600">{item.variantName}: {item.variantValue}</p>
										{/if}
										<p class="text-sm text-gray-500">{formatRupiah(item.unitPrice)} × {item.qty}</p>
									</div>
									<button type="button" class="text-red-600 hover:text-red-800" aria-label="Remove from cart" onclick={() => removeFromCart(item.id)}>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											></path>
										</svg>
									</button>
								</div>

								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<button
											type="button"
											class="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
											onclick={() => updateQuantity(item.id, item.qty - 1)}>−</button
										>
										<span class="w-8 text-center font-medium">{item.qty}</span>
										<button
											type="button"
											class="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
											onclick={() => updateQuantity(item.id, item.qty + 1)}>+</button
										>
									</div>
									<span class="font-bold text-gray-800">{formatRupiah(item.subtotal)}</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="p-4 border-t border-gray-200 space-y-4">
				<!-- Customer Information (Optional) -->
				<div>
					<div class="block text-sm font-medium text-gray-700 mb-2">Customer Info</div>
					<div class="space-y-2 relative customer-autocomplete">
						<div class="relative">
							<input
								type="text"
								bind:value={customerName}
								oninput={() => {
									customerNameError = "";
									searchCustomers();
								}}
								onfocus={() => {
									if (customerSuggestions.length > 0) showCustomerSuggestions = true;
								}}
								placeholder="Customer name (optional)"
								class="py-2 px-3 block border w-full border-gray-300 rounded-lg text-sm focus:ring-2"
								style="border-color: {customerNameError ? '#ef4444' : customerName ? secondaryColor : '#d1d5db'};"
							/>
							{#if customerNameError}
								<p class="text-xs text-red-600 mt-1" transition:slide>{customerNameError}</p>
							{/if}
							{#if showCustomerSuggestions && customerSuggestions.length > 0}
								<div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
									{#each customerSuggestions as suggestion}
										<button
											type="button"
											class="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
											onclick={() => selectCustomer(suggestion)}
										>
											<div class="font-medium text-sm text-gray-800">{suggestion.customerName || "No name"}</div>
											<div class="text-xs text-gray-500">{suggestion.customerPhone || "No phone"}</div>
										</button>
									{/each}
								</div>
							{/if}
						</div>
						<div class="flex rounded-lg">
							<div class="px-4 inline-flex items-center min-w-fit rounded-s-md border border-e-0 border-gray-200 bg-gray-50">
								<span class="text-sm text-gray-500">+62</span>
							</div>
							<input
								type="tel"
								bind:value={customerPhone}
								oninput={searchCustomers}
								onfocus={() => {
									if (customerSuggestions.length > 0) showCustomerSuggestions = true;
								}}
								placeholder="Phone (optional)"
								class="py-2 border-r border-b border-t px-3 block w-full border-gray-300 rounded-r-lg text-sm focus:ring-2"
								style="border-color: {customerPhone ? secondaryColor : '#d1d5db'};"
							/>
						</div>
					</div>
				</div>

				<!-- Totals -->
				<div class="space-y-2 pt-2 border-t border-gray-200">
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Subtotal</span>
						<span class="font-medium">{formatRupiah(subtotal)}</span>
					</div>

					<!-- Tax Toggle -->
					<div
						class="flex justify-between items-center text-sm py-2 px-3 rounded-lg"
						style="background-color: {taxEnabled ? `${secondaryColor}10` : 'transparent'}; border: 1px solid {taxEnabled ? secondaryColor : '#e5e7eb'};"
					>
						<div class="flex items-center gap-2">
							<label class="relative inline-flex items-center cursor-pointer">
								<input type="checkbox" bind:checked={taxEnabled} class="sr-only peer" />
								<div
									class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"
									style={taxEnabled ? `background-color: ${secondaryColor};` : ""}
								></div>
							</label>
							<span class="text-gray-700 font-medium">PPN 11%</span>
						</div>
						{#if taxEnabled}
							<span class="font-semibold" style="color: {secondaryColor};">{formatRupiah(tax)}</span>
						{:else}
							<span class="font-medium text-gray-400">{formatRupiah(0)}</span>
						{/if}
					</div>

					<!-- Tip Toggle -->
					<div
						class="flex justify-between items-center text-sm py-2 px-3 rounded-lg"
						style="background-color: {tipEnabled ? `${secondaryColor}10` : 'transparent'}; border: 1px solid {tipEnabled ? secondaryColor : '#e5e7eb'};"
					>
						<div class="flex items-center gap-2">
							<label class="relative inline-flex items-center cursor-pointer">
								<input type="checkbox" bind:checked={tipEnabled} class="sr-only peer" />
								<div
									class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"
									style={tipEnabled ? `background-color: ${secondaryColor};` : ""}
								></div>
							</label>
							<span class="text-gray-700 font-medium">Tip</span>
						</div>
						{#if tipEnabled}
							<div class="flex items-center gap-1">
								<span class="text-xs text-gray-500">Rp</span>
								<input
									type="number"
									bind:value={tipAmount}
									min="0"
									step="1000"
									class="w-16 px-2 py-1 text-xs border rounded text-right focus:outline-none focus:ring-2"
									style="border-color: {secondaryColor};"
								/>
							</div>
						{:else}
							<span class="font-medium text-gray-400">{formatRupiah(0)}</span>
						{/if}
					</div>

					<div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
						<span>Total</span>
						<span style="color: {secondaryColor};">{formatRupiah(total)}</span>
					</div>
				</div>

				<!-- Checkout Button -->
				<button
					type="button"
					onclick={() => {
						if (!customerName || !customerName.trim()) {
							customerNameError = "Customer name is required";
						} else {
							showPaymentModal = true;
						}
					}}
					class="w-full py-3 px-4 rounded-lg font-semibold text-white transition-opacity"
					style="background-color: {secondaryColor};"
					disabled={cart.length === 0}
				>
					Checkout
				</button>
			</div>
		</aside>
	{/if}
</div>

<!-- Payment Form Modal -->
{#if showPaymentModal}
	<div
		class="hs-overlay fixed size-full top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto bg-black/50 flex items-center justify-center"
	>
		<div class="bg-white rounded-xl shadow-lg w-full max-w-lg m-3">
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200">
				<h3 class="font-bold text-gray-800">Payment Details</h3>
				<button
					type="button"
					aria-label="Close payment form"
					class="rounded-full p-2 inline-flex justify-center items-center hover:bg-gray-100"
					onclick={() => (showPaymentModal = false)}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<div class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
				<!-- Payment Method -->
				<div>
					<div class="block text-sm font-medium text-gray-700 mb-2">Payment Method</div>
					<div class="space-y-2">
						<!-- Cash Option -->
						<label
							class="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
							style={paymentMethod === "cash"
								? `border-color: ${secondaryColor}; background-color: ${secondaryColor}15;`
								: "border-color: #d1d5db;"}
						>
							<input type="radio" name="payment" value="cash" bind:group={paymentMethod} class="sr-only" />
							<div class="flex items-center gap-3 w-full">
								<svg class="w-5 h-5" style="color: {secondaryColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
								</svg>
								<div class="flex-1">
									<div class="font-medium text-gray-800">Cash</div>
									<div class="text-xs text-gray-500">Pay at cashier</div>
								</div>
							</div>
						</label>

						<!-- QRIS Option -->
						<label
							class="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
							style={paymentMethod === "qris"
								? `border-color: ${secondaryColor}; background-color: ${secondaryColor}15;`
								: "border-color: #d1d5db;"}
						>
							<input type="radio" name="payment" value="qris" bind:group={paymentMethod} class="sr-only" />
							<div class="flex items-center gap-3 w-full">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" style="color: {secondaryColor};" viewBox="0 0 84 33" fill="none">
									<path d="M8.9663 5.75562H4.58141C4.43753 5.75561 4.29507 5.78399 4.16218 5.83912C4.02928 5.89425 3.90857 5.97505 3.80694 6.07689C3.70531 6.17873 3.62477 6.29962 3.56992 6.43263C3.51508 6.56564 3.487 6.70816 3.48731 6.85203V26.2115C3.48751 26.5016 3.60285 26.7798 3.80799 26.9849C4.01313 27.1901 4.2913 27.3054 4.58141 27.3056H17.0458V21.8614H8.9663V5.75562Z" fill="black"/>
									<path d="M23.9361 5.75562H11.6084V11.1366H19.7088V19.2191H25.0325V6.85203C25.0329 6.70796 25.0047 6.56525 24.9497 6.43209C24.8947 6.29893 24.814 6.17794 24.7121 6.07607C24.6102 5.9742 24.4892 5.89345 24.3561 5.83846C24.2229 5.78346 24.0802 5.75531 23.9361 5.75562Z" fill="black"/>
									<path d="M19.6855 27.3056H19.6871V32.4031H25.0325V21.8613H19.6855V27.3056Z" fill="black"/>
									<path d="M56.2166 5.65674H51.2588V27.1396H56.2166V5.65674Z" fill="black"/>
									<path d="M79.809 25.9242V22.0397V18.7527V16.3738V13.7949H65.7077V10.6153H79.809V5.65674H58.3262V7.50752V10.6153V13.7949V17.0579V18.7527H72.4267V22.0397H58.3262V26.9982H79.809V25.9242Z" fill="black"/>
									<path d="M11.5947 19.0668H17.0575V13.604H11.5947V19.0668ZM13.2517 15.2618H15.3998V17.4098H13.2517V15.2618Z" fill="black"/>
									<path d="M27.3314 10.6153H43.1167V13.7988H32.2684H28.705H27.3105V27.1812H32.2684V18.7751L41.1385 27.2121H48.8659L39.6151 18.7566H48.8968V18.1899V13.7988V10.6153V7.25195V5.65674H27.3314V10.6153Z" fill="black"/>
									<path d="M82.0641 21.9609V30.672C82.0639 30.7901 82.0169 30.9033 81.9334 30.9868C81.8499 31.0704 81.7367 31.1174 81.6186 31.1176H72.7832V32.4433H81.6186C82.088 32.4421 82.5378 32.2551 82.8697 31.9232C83.2016 31.5912 83.3886 31.1414 83.3899 30.672V21.9609H82.0641Z" fill="black"/>
									<path d="M10.6067 0.443359H1.77125C1.30186 0.444582 0.852048 0.631589 0.520139 0.963498C0.188229 1.29541 0.00122291 1.74522 0 2.21461L0 10.9257H1.32574V2.21461C1.32574 2.09645 1.37268 1.98314 1.45623 1.89959C1.53978 1.81603 1.65309 1.7691 1.77125 1.7691H10.6067V0.443359Z" fill="black"/>
								</svg>
								<div class="flex-1">
									<div class="font-medium text-gray-800">QRIS</div>
									<div class="text-xs text-gray-500">Scan QR code to pay</div>
								</div>
							</div>
						</label>
					</div>
				</div>

				<!-- Dining Option -->
				<div>
					<div class="block text-sm font-medium text-gray-700 mb-2">Order Type</div>
					<div class="grid grid-cols-2 gap-2">
						<!-- Pickup Option -->
						<label
							class="flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
							style={diningOption === "pickup"
								? `border-color: ${secondaryColor}; background-color: ${secondaryColor}15;`
								: "border-color: #d1d5db;"}
						>
							<input type="radio" name="diningOption" value="pickup" bind:group={diningOption} class="sr-only" />
							<div class="flex flex-col items-center gap-2">
								<svg class="w-5 h-5" style="color: {secondaryColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
								</svg>
								<span class="font-medium text-gray-800 text-sm">Pickup</span>
							</div>
						</label>

						<!-- Dine In Option -->
						<label
							class="flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
							style={diningOption === "dinein"
								? `border-color: ${secondaryColor}; background-color: ${secondaryColor}15;`
								: "border-color: #d1d5db;"}
						>
							<input type="radio" name="diningOption" value="dinein" bind:group={diningOption} class="sr-only" />
							<div class="flex flex-col items-center gap-2">
								<svg class="w-5 h-5" style="color: {secondaryColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
								</svg>
								<span class="font-medium text-gray-800 text-sm">Dine In</span>
							</div>
						</label>
					</div>
				</div>

				<!-- Table Selection (only for Dine In) -->
				{#if diningOption === "dinein"}
					<div transition:slide>
						<label for="table-select" class="block text-sm font-medium text-gray-700 mb-2">Select Table</label>
						<select
							id="table-select"
							bind:value={selectedTableId}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
							style="border-color: {selectedTableId ? secondaryColor : '#d1d5db'};"
						>
							<option value={null}>Select a table...</option>
							{#each data.tables as table}
								<option value={table.id}>{table.name}</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- Order Notes -->
				<div>
					<label for="order-notes" class="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
					<textarea
						id="order-notes"
						bind:value={orderNotes}
						rows="3"
						placeholder="Any special requests or instructions..."
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
						style="focus:ring-color: {secondaryColor};"
					></textarea>
				</div>

				<!-- Order Summary -->
				<div class="bg-gray-50 rounded-lg p-3 space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Items</span>
						<span class="font-medium">{cart.length}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Subtotal</span>
						<span class="font-medium">{formatRupiah(subtotal)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Tax (11%)</span>
						<span class="font-medium">{formatRupiah(tax)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Tip</span>
						<span class="font-medium">{formatRupiah(tip)}</span>
					</div>
					<div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
						<span>Total</span>
						<span style="color: {secondaryColor};">{formatRupiah(total)}</span>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex justify-end items-center gap-2 py-3 px-4 border-t border-gray-200">
				<button
					type="button"
					class="py-2 px-4 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
					onclick={() => (showPaymentModal = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="py-2 px-4 rounded-lg font-semibold text-white disabled:opacity-50"
					style="background-color: {secondaryColor};"
					onclick={submitOrder}
					disabled={isSubmitting || !customerName.trim()}
				>
					{isSubmitting ? "Processing..." : "Confirm Order"}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- QRIS QR Modal -->
{#if showQrisModal}
	<div
		class="hs-overlay fixed size-full top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto bg-black/50 flex items-center justify-center"
		transition:fly={{ y: 20, duration: 200 }}
	>
		<div class="bg-white rounded-xl shadow-lg w-full max-w-lg m-3" transition:fly={{ y: 20, duration: 200 }}>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200">
				<h3 class="font-bold text-gray-800">Scan QR Code to Pay</h3>
				<button
					type="button"
					aria-label="Close modal"
					class="rounded-full p-2 inline-flex justify-center items-center hover:bg-gray-100"
					onclick={closeQrisModal}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<div class="p-6 flex flex-col items-center gap-4">
				<!-- Amount to Pay -->
				<div class="w-full rounded-lg p-4 border-2" style="background-color: {secondaryColor}15; border-color: {secondaryColor};">
					<div class="text-center">
						<p class="text-sm font-medium text-gray-600 mb-1">Total Amount</p>
						<p class="text-3xl font-bold" style="color: {secondaryColor};">{formatRupiah(qrisAmount)}</p>
					</div>
				</div>

				<!-- QR Code -->
				<div class="qris-qr flex items-center justify-center" style="width:260px; height:260px; background-color: #f3f4f6; border-radius: 8px;">
					{#if qrisQrImgUrl}
						<img src={qrisQrImgUrl} alt="QR code" style="width:100%; height:100%; border-radius:8px;" />
					{:else if qrisInvoiceUrl}
						<iframe src={qrisInvoiceUrl} title="QRIS payment" style="width:100%; height:100%; border:0; border-radius:8px;"></iframe>
					{:else}
						<div class="text-center">
							<svg class="w-12 h-12 mx-auto mb-2 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<p class="text-sm text-gray-600 font-medium">Generating QR Code...</p>
						</div>
					{/if}
				</div>

				<!-- Countdown Timer -->
				{#if qrisTimeRemaining}
					<div class="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
						<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<span class="text-sm font-semibold" style="color: {qrisTimeRemaining === 'Expired' ? '#dc2626' : '#d97706'};">
							{qrisTimeRemaining === 'Expired' ? 'QR Code Expired' : `Expires in ${qrisTimeRemaining}`}
						</span>
					</div>
				{/if}

				<!-- Status -->
				<div class="flex items-center gap-2 text-sm font-medium">
					<span class="text-gray-600">Status:</span>
					<span class="px-3 py-1 rounded-full text-xs font-bold" style="
						background-color: {qrisStatus === 'SUCCEEDED' ? '#d1fae5' : qrisStatus === 'EXPIRED' ? '#fee2e2' : '#fef3c7'};
						color: {qrisStatus === 'SUCCEEDED' ? '#065f46' : qrisStatus === 'EXPIRED' ? '#991b1b' : '#92400e'};
					">
						{qrisStatus === 'SUCCEEDED' ? 'Paid' : qrisStatus === 'EXPIRED' ? 'Expired' : qrisStatus === 'REQUIRES_ACTION' ? 'Waiting for Payment' : qrisStatus ?? 'PENDING'}
					</span>
				</div>

				<div class="qris-actions flex gap-2 w-full">
					<button
						class="flex-1 py-2 px-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
						onclick={manualCheckQris}
					>
						Check Payment
					</button>
					<button
						class="flex-1 py-2 px-3 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium"
						onclick={() => {
							qrisInvoiceUrl = null;
							qrisQrString = null;
							qrisQrImgUrl = null;
							qrisPaymentRequestId = null;
							qrisExpiresAt = null;
							qrisStatus = null;
							closeQrisModal();
						}}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Success Modal -->
{#if showSuccessModal && createdOrderDetails}
	<div
		class="hs-overlay fixed size-full top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto bg-black/50 flex items-center justify-center"
	>
		<div class="bg-white rounded-xl shadow-lg w-full max-w-lg m-3">
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200">
				<h3 class="font-bold text-gray-800">Order Created Successfully!</h3>
				<button
					type="button"
					aria-label="Close modal"
					class="rounded-full p-2 inline-flex justify-center items-center hover:bg-gray-100"
					onclick={() => {
						showSuccessModal = false;
						cart = [];
						customerName = '';
						customerPhone = '';
						diningOption = 'pickup';
						selectedTableId = null;
						paymentMethod = 'cash';
						orderNotes = '';
						taxEnabled = false;
						tipEnabled = false;
						createdOrderDetails = null;
					}}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<div class="p-6 flex flex-col items-center gap-4 text-center">
				<div class="flex items-center justify-center w-16 h-16 rounded-full" style="background-color: {secondaryColor}20;">
					<svg class="w-8 h-8" style="color: {secondaryColor};" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
				</div>

				<div class="w-full bg-gray-50 rounded-lg p-4 space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Order Number:</span>
						<span class="font-bold text-gray-800">{createdOrderDetails.order.orderNumber}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Customer:</span>
						<span class="font-semibold text-gray-800">{createdOrderDetails.order.customerName}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Amount:</span>
						<span class="font-bold" style="color: {secondaryColor};">{formatRupiah(createdOrderDetails.order.total)}</span>
					</div>
					<div class="flex justify-between text-sm pt-2 border-t border-gray-200">
						<span class="text-gray-600">Status:</span>
						<span class="font-semibold text-green-600">Paid - Ready to serve</span>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="w-full flex gap-2">
					<button
						type="button"
						onclick={sendToWhatsApp}
						class="flex-1 py-2 px-4 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
						</svg>
						Send to WhatsApp
					</button>
					
					<button
						type="button"
						onclick={printReceipt}
						class="flex-1 py-2 px-4 rounded-lg font-medium border-2 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
						style="background-color: {secondaryColor}; border-color: {secondaryColor};"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
						</svg>
						Print Receipt
					</button>
				</div>

				<button
					type="button"
					onclick={() => {
						cart = [];
						customerName = '';
						customerPhone = '';
						diningOption = 'pickup';
						selectedTableId = null;
						paymentMethod = 'cash';
						orderNotes = '';
						closeSuccessModal();
						taxEnabled = false;
						tipEnabled = false;
					}}
					class="w-full py-2 px-4 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
				>
					New Order
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Variant Selection Modal -->
{#if showVariantModal && selectedProduct}
	<div
		class="hs-overlay fixed size-full top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto bg-black/50 flex items-center justify-center"
	>
		<div class="bg-white rounded-xl shadow-lg w-full max-w-lg m-3">
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200">
				<h3 class="font-bold text-gray-800">{selectedProduct.name}</h3>
				<button
					type="button"
					aria-label="Close modal"
					class="rounded-full p-2 inline-flex justify-center items-center hover:bg-gray-100"
					onclick={() => (showVariantModal = false)}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<div class="p-4 space-y-4">
				<!-- Variant selector grouped by variant name -->
				{#each Object.entries(groupedVariants) as [groupName, variants]}
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-3">{groupName}</div>
						<div class="flex gap-2 flex-wrap">
							{#each variants as variant}
								<button
									type="button"
									onclick={() => (selectedVariantsByGroup[groupName] = variant)}
									class="px-4 py-2 rounded-full border-2 transition-colors"
									style={selectedVariantsByGroup[groupName]?.id === variant.id
										? `background-color: ${secondaryColor}; color: ${secondaryTextColor}; border-color: ${secondaryColor};`
										: `border-color: ${secondaryColor}; color: ${secondaryColor}; background-color: white;`}
								>
									{variant.variantValue}
								</button>
							{/each}
						</div>
					</div>
				{/each}

				<!-- Quantity -->
				<div>
					<div class="block text-sm font-medium text-gray-700 mb-2">Quantity</div>
					<div class="flex items-center gap-3">
						<button
							type="button"
							class="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
							onclick={() => (quantity = Math.max(1, quantity - 1))}>−</button
						>
						<input
							type="number"
							bind:value={quantity}
							min="1"
							class="py-2 px-3 w-20 text-center border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
						/>
						<button
							type="button"
							class="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
							onclick={() => (quantity = quantity + 1)}>+</button
						>
					</div>
				</div>

				<!-- Price -->
				<div class="bg-gray-50 rounded-lg p-3">
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Price</span>
						<span class="text-xl font-bold" style="color: {secondaryColor};"
							>{formatRupiah(selectedProduct.price * quantity)}</span
						>
					</div>
				</div>
			</div>

			<div class="flex justify-end items-center gap-2 py-3 px-4 border-t border-gray-200">
				<button
					type="button"
					class="py-2 px-4 inline-flex items-center gap-2 rounded-lg border font-medium border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
					onclick={() => (showVariantModal = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="py-2 px-4 inline-flex items-center gap-2 rounded-lg border border-transparent font-semibold"
					style="background-color: {secondaryColor}; color: {secondaryTextColor};"
					onclick={addToCart}
				>
					Add to Cart
				</button>
			</div>
		</div>
	</div>
{/if}
