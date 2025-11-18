<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "$lib/stores/toast";
	import type { PageData } from "./$types";

	// Props
	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();

	// Merchant colors
	const primaryColor = data?.merchant?.primaryColor || '#3b82f6';
	const secondaryColor = data?.merchant?.secondaryColor || '#1e40af';
	const primaryTextColor = data?.merchant?.primaryTextColor || '#ffffff';
	const secondaryTextColor = data?.merchant?.secondaryTextColor || '#ffffff';

	// Data state
	let orders = $state<any[]>([]);
	let loading = $state(true);
	let totalOrders = $state(0);
	
	// Pagination state
	let currentPage = $state(1);
	let totalPages = $state(1);
	let pageLimit = $state(20);

	// Filter states
	let statusFilter = $state<string>("all");
	let paymentStatusFilter = $state<string>("all");
	let diningOptionFilter = $state<string>("all");
	let searchQuery = $state("");

	// Modal state
	let selectedOrder = $state<any>(null);
	let orderItems = $state<any[]>([]);
	let loadingDetails = $state(false);
	let updatingStatus = $state(false);

	// QRIS state
	let showQrisModal = $state(false);
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

	function openDetailModal(order: any) {
		selectedOrder = order;
		fetchOrderDetails(order.order.id);
		
		const modalEl = document.getElementById('orderDetailModal');
		if (!modalEl) return;

		if (typeof window !== 'undefined' && (window as any).HSOverlay) {
			try {
				const HSOverlay = (window as any).HSOverlay;
				new HSOverlay(modalEl).open();
			} catch (e) {
				console.error('Error opening modal:', e);
			}
		}
	}

	function closeDetailModal() {
		if (typeof window !== 'undefined' && (window as any).HSOverlay) {
			(window as any).HSOverlay.close('#orderDetailModal');
		}
		
		// Reset body overflow after modal animation completes
		setTimeout(() => {
			document.body.style.overflow = '';
			document.body.style.removeProperty('overflow');
		}, 300);
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

	async function manualCheckQris() {
		if (!qrisPaymentRequestId) return;
		try {
			const r = await fetch(`../../api/qris/${qrisPaymentRequestId}?forceCheck=true`);
			const j = await r.json();
			if (j?.data) {
				qrisStatus = j.data.status;
				if (qrisStatus === 'SUCCEEDED' || qrisStatus === 'completed') {
					toast.success('Payment successful');
					closeQrisModal();
					if (selectedOrder) {
						await updateOrderStatus(selectedOrder.order.id, 'paymentStatus', 'paid');
						await updateOrderStatus(selectedOrder.order.id, 'status', 'paid');
					}
				} else {
					toast.info(`Payment status: ${qrisStatus}`);
				}
			}
		} catch (e) {
			console.error('Manual check error:', e);
			toast.error('Failed to check payment status');
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

	async function showQrisPayment(order: any) {
		try {
			// Fetch payment info from API
			const response = await fetch(`../../api/orders/${order.order.id}/payment`);
			const result = await response.json();
			
			console.log('Payment API response:', result);
			
			if (!result.success || !result.payment) {
				toast.error('QRIS payment information not found');
				console.error('Payment fetch error:', result);
				return;
			}

			const payment = result.payment;
			console.log('Payment object:', {
				paymentRequestId: payment.paymentRequestId,
				qrString: payment.qrString ? 'EXISTS' : 'NULL',
				qrStringLength: payment.qrString?.length || 0,
				expiresAt: payment.expiresAt,
				status: payment.status
			});

			// Check if payment request ID exists
			if (!payment.paymentRequestId) {
				toast.error('QRIS payment ID not found');
				return;
			}

			// Set QRIS data
			qrisPaymentRequestId = payment.paymentRequestId;
			qrisExpiresAt = payment.expiresAt;
			qrisAmount = order.order.total;
			qrisStatus = payment.status || 'REQUIRES_ACTION';
			
			// Show modal
			showQrisModal = true;
			selectedOrder = order;
			
			// Start countdown timer
			startQrisCountdown();
			
			// Generate QR code image if qrString available
			if (payment.qrString) {
				qrisQrString = payment.qrString;
				const QRCode = await import('qrcode');
				QRCode.toDataURL(payment.qrString, { width: 260 })
					.then((url: string) => { qrisQrImgUrl = url; })
					.catch((err: any) => { console.error('QR generation failed:', err); });
			}

			// Start payment status polling
			stopQrisPolling();
			qrisPollingInterval = setInterval(async () => {
				if (!qrisPaymentRequestId) return;
				try {
					const r = await fetch(`../../api/qris/${qrisPaymentRequestId}`);
					const j = await r.json();
					if (j?.data) {
						qrisStatus = j.data.status;
						if (qrisStatus === 'SUCCEEDED') {
							toast.success('Payment successful');
							closeQrisModal();
							
							// Update order status
							if (selectedOrder) {
								await updateOrderStatus(selectedOrder.order.id, 'paymentStatus', 'paid');
								await updateOrderStatus(selectedOrder.order.id, 'status', 'paid');
							}
						} else if (['CANCELED', 'FAILED'].includes(qrisStatus ?? '')) {
							toast.error('Payment failed or canceled');
							closeQrisModal();
						} else if (qrisStatus === 'EXPIRED') {
							// Don't auto-close on expired, let user see the expired status
							stopQrisPolling();
						}
					}
				} catch (e) {
					console.error('QRIS polling error:', e);
				}
			}, 10000); // Poll every 10 seconds
		} catch (error) {
			console.error('Error showing QRIS payment:', error);
			toast.error('Failed to load QRIS payment information');
		}
	}

	function printReceipt() {
		if (!selectedOrder) return;

		const printWindow = window.open('', '_blank');
		if (!printWindow) {
			toast.error('Please allow popups to print receipt');
			return;
		}

		const ord = selectedOrder.order;
		const table = selectedOrder.table;

		// Prepare items HTML - Thermal printer style (no table, just simple divs)
		const cartItemsHtml = orderItems.map((item: any) => `
			<div class="item">
				<div class="item-name">${item.orderItem.productName}</div>
				${item.orderItem.variantName && item.orderItem.variantValue ? `<div class="item-variant">${item.orderItem.variantName}: ${item.orderItem.variantValue}</div>` : ''}
				<div class="item-details">
					<span>${item.orderItem.quantity} x ${formatRupiah(item.orderItem.unitPrice)}</span>
					<span>${formatRupiah(item.orderItem.subtotal)}</span>
				</div>
			</div>
		`).join('');

		const receiptHtml = `
			<html>
				<head>
					<title>Receipt - ${ord.orderNumber}</title>
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
							<strong>${ord.orderNumber}</strong>
						</div>
						<div>
							<span>Tanggal:</span>
							<span>${new Date(ord.createdAt).toLocaleDateString('id-ID', { 
								day: '2-digit',
								month: '2-digit', 
								year: 'numeric'
							})} ${new Date(ord.createdAt).toLocaleTimeString('id-ID', {
								hour: '2-digit',
								minute: '2-digit'
							})}</span>
						</div>
						<div>
							<span>Kasir:</span>
							<span>${data?.userPos?.name || 'Staff'}</span>
						</div>
						<div>
							<span>Customer:</span>
							<span>${ord.customerName}</span>
						</div>
						${ord.customerPhone ? `
						<div>
							<span>Telp:</span>
							<span>+62${ord.customerPhone}</span>
						</div>
						` : ''}
						<div>
							<span>Tipe:</span>
							<span>${ord.diningOption === 'dinein' ? 'Dine In' : 'Pickup'}${ord.diningOption === 'dinein' && table ? ` - ${table.name}` : ''}</span>
						</div>
						<div>
							<span>Pembayaran:</span>
							<span>${ord.paymentMethod?.toUpperCase()}</span>
						</div>
					</div>

					<div class="items-section">
						${cartItemsHtml}
					</div>

					<div class="totals">
						<div>
							<span>Subtotal</span>
							<span>${formatRupiah(ord.subtotal)}</span>
						</div>
						${ord.tax > 0 ? `
						<div>
							<span>PPN 11%</span>
							<span>${formatRupiah(ord.tax)}</span>
						</div>
						` : ''}
						${ord.tip > 0 ? `
						<div>
							<span>Tip</span>
							<span>${formatRupiah(ord.tip)}</span>
						</div>
						` : ''}
						<div class="total-line">
							<span>TOTAL</span>
							<strong>${formatRupiah(ord.total)}</strong>
						</div>
					</div>

					${ord.notes ? `
					<div class="separator"></div>
					<div style="font-size: 10px; margin-top: 8px;">
						<strong>Catatan:</strong><br/>
						${ord.notes}
					</div>
					` : ''}

					<div class="footer">
						<p>Terima kasih atas kunjungan Anda!</p>
						<p>Selamat menikmati!</p>
						<p style="margin-top: 8px; font-size: 9px;">Powered by TUKOO POS</p>
					</div>

					<script type="text/javascript">
						window.onload = function() {
							window.print();
							setTimeout(function() {
								window.close();
							}, 500);
						};
					<\/script>
				</body>
			</html>
		`;

		printWindow.document.write(receiptHtml);
		printWindow.document.close();
	}

	async function fetchOrders() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (statusFilter !== 'all') params.set('status', statusFilter);
			if (paymentStatusFilter !== 'all') params.set('paymentStatus', paymentStatusFilter);
			if (diningOptionFilter !== 'all') params.set('diningOption', diningOptionFilter);
			if (searchQuery.trim()) params.set('search', searchQuery.trim());
			params.set('page', currentPage.toString());
			params.set('limit', pageLimit.toString());

			const response = await fetch(`../../api/orders?${params.toString()}`);
			const result = await response.json();

			if (result.success) {
				orders = result.orders;
				totalOrders = result.pagination.totalOrders;
				totalPages = result.pagination.totalPages;
			} else {
				toast.error('Failed to load orders');
			}
		} catch (error) {
			console.error('Fetch orders error:', error);
			toast.error('Failed to load orders');
		} finally {
			loading = false;
		}
	}

	// Pagination functions
	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			fetchOrders();
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			fetchOrders();
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			fetchOrders();
		}
	}

	// Debounce search
	let searchTimeout: any;
	function handleSearchChange() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			currentPage = 1; // Reset to page 1 on search
			fetchOrders();
		}, 500);
	}

	// Watch filter changes
	$effect(() => {
		const _ = statusFilter; // Trigger on change
		currentPage = 1; // Reset to page 1 on filter change
		fetchOrders();
	});

	$effect(() => {
		const _ = paymentStatusFilter; // Trigger on change
		currentPage = 1; // Reset to page 1 on filter change
		fetchOrders();
	});

	$effect(() => {
		const _ = diningOptionFilter; // Trigger on change
		currentPage = 1; // Reset to page 1 on filter change
		fetchOrders();
	});

	function formatRupiah(amount: number): string {
		return `Rp ${amount.toLocaleString("id-ID")}`;
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatTime(date: Date): string {
		return new Date(date).toLocaleTimeString('id-ID', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			pending: 'bg-yellow-100 text-yellow-800',
			paid: 'bg-green-100 text-green-800',
			cancelled: 'bg-red-100 text-red-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function getPaymentStatusColor(status: string): string {
		const colors: Record<string, string> = {
			unpaid: 'bg-orange-100 text-orange-800',
			paid: 'bg-green-100 text-green-800',
			failed: 'bg-red-100 text-red-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function getProcessingStatusColor(status: string): string {
		const colors: Record<string, string> = {
			new: 'bg-blue-100 text-blue-800',
			preparing: 'bg-purple-100 text-purple-800',
			ready: 'bg-green-100 text-green-800',
			served: 'bg-teal-100 text-teal-800',
			completed: 'bg-gray-100 text-gray-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	async function fetchOrderDetails(orderId: number) {
		loadingDetails = true;
		orderItems = [];
		try {
			const response = await fetch(`../../api/orders/${orderId}`);
			const result = await response.json();

			if (result.success) {
				orderItems = result.items;
			} else {
				toast.error('Failed to load order details');
			}
		} catch (error) {
			console.error('Fetch order details error:', error);
			toast.error('Failed to load order details');
		} finally {
			loadingDetails = false;
		}
	}

	async function updateOrderStatus(orderId: number, field: string, value: string) {
		updatingStatus = true;
		try {
			const response = await fetch(`../../api/orders/${orderId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ field, value })
			});

			const result = await response.json();

			if (!response.ok) {
				toast.error(result.error || 'Failed to update status');
				return;
			}

			toast.success('Status updated successfully');
			
			// Update local data
			if (selectedOrder && selectedOrder.order.id === orderId) {
				selectedOrder.order[field] = value;
			}
			
			// Refresh orders list
			await fetchOrders();
		} catch (error) {
			console.error('Update error:', error);
			toast.error('Failed to update status');
		} finally {
			updatingStatus = false;
		}
	}

	// Load orders on mount
	onMount(() => {
		fetchOrders();

		// Initialize Preline UI
		setTimeout(() => {
			if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);
	});

</script>

<div class="p-3 sm:p-4 md:p-6">
	<div class="mb-4 sm:mb-6">
		<h1 class="text-xl sm:text-2xl font-bold text-gray-800">Orders</h1>
		<p class="text-sm sm:text-base text-gray-600">Manage and track all orders</p>
	</div>

	<!-- Filters -->
	<div class="mb-4 sm:mb-6 bg-white rounded-lg shadow p-3 sm:p-4">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
			<!-- Search -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
				<input
					type="text"
					bind:value={searchQuery}
					oninput={handleSearchChange}
					placeholder="Order number or customer name..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Status Filter -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
				<select
					bind:value={statusFilter}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All Status</option>
					<option value="pending">Pending</option>
					<option value="paid">Paid</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>

			<!-- Payment Status Filter -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Payment</label>
				<select
					bind:value={paymentStatusFilter}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All Payment</option>
					<option value="unpaid">Unpaid</option>
					<option value="paid">Paid</option>
					<option value="failed">Failed</option>
				</select>
			</div>

			<!-- Dining Option Filter -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
				<select
					bind:value={diningOptionFilter}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All Types</option>
					<option value="pickup">Pickup</option>
					<option value="dinein">Dine In</option>
				</select>
			</div>
		</div>

		<div class="mt-3 text-sm text-gray-600">
			{#if loading}
				Loading orders...
			{:else}
				Showing {orders.length} {orders.length === 1 ? 'order' : 'orders'}
			{/if}
		</div>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
		</div>
	{:else}
		<!-- Orders List -->
		<div class="grid grid-cols-1 gap-4">
			{#each orders as orderData}
			{@const { order: ord, table, itemCount } = orderData}
			<div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
				<div class="p-3 sm:p-4">
					<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
						<div class="flex-1 min-w-0">
							<!-- Header with badges -->
							<div class="flex flex-wrap items-center gap-2 mb-3">
								<h3 class="font-bold text-base sm:text-lg text-gray-800">{ord.orderNumber}</h3>
								<span class="px-2 py-1 rounded-full text-xs font-semibold {getStatusColor(ord.status)} whitespace-nowrap">
									{ord.status.toUpperCase()}
								</span>
								<span class="px-2 py-1 rounded-full text-xs font-semibold {getPaymentStatusColor(ord.paymentStatus)} whitespace-nowrap">
									{ord.paymentStatus.toUpperCase()}
								</span>
								<span class="px-2 py-1 rounded-full text-xs font-semibold {getProcessingStatusColor(ord.processingStatus)} whitespace-nowrap">
									{ord.processingStatus.toUpperCase()}
								</span>
							</div>

							<!-- Order Details Grid -->
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
								<div class="truncate">
									<span class="text-gray-600">Customer:</span>
									<span class="font-medium text-gray-800 ml-1">{ord.customerName || '-'}</span>
								</div>
								<div>
									<span class="text-gray-600">Payment:</span>
									<span class="font-medium text-gray-800 ml-1">{ord.paymentMethod?.toUpperCase() || '-'}</span>
								</div>
								<div>
									<span class="text-gray-600">Type:</span>
									<span class="font-medium text-gray-800 ml-1">
										{#if ord.diningOption === 'dinein'}
											<span class="inline-flex items-center gap-1 flex-wrap">
												<span>Dine In</span>
												{#if table}
													<span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold whitespace-nowrap">
														{table.name}
													</span>
												{/if}
											</span>
										{:else}
											Pickup
										{/if}
									</span>
								</div>
								<div>
									<span class="text-gray-600">Items:</span>
									<span class="font-medium text-gray-800 ml-1">{itemCount}</span>
								</div>
							</div>

							<!-- Timestamp -->
							<div class="mt-2 text-xs text-gray-500">
								{formatDate(ord.createdAt)}
							</div>
						</div>

						<!-- Price and Actions -->
						<div class="flex flex-row sm:flex-col lg:flex-col items-center sm:items-end lg:text-right gap-3 sm:gap-2 lg:ml-4 border-t sm:border-t-0 pt-3 sm:pt-0">
							<div class="flex-1 sm:flex-none">
								<div class="text-xl sm:text-2xl font-bold" style="color: {secondaryColor};">{formatRupiah(ord.total)}</div>
							</div>
							<div class="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
								<!-- Show QR button for pending QRIS orders -->
								{#if ord.status === 'pending' && ord.paymentMethod === 'qris' && ord.paymentStatus !== 'paid'}
									<button
										type="button"
										onclick={() => showQrisPayment(orderData)}
										class="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors hover:opacity-90 bg-green-600 text-white whitespace-nowrap"
									>
										<svg class="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
										</svg>
										<span class="hidden sm:inline">Show QR</span>
										<span class="sm:hidden">QR</span>
									</button>
								{/if}
								<button
									type="button"
									onclick={() => openDetailModal(orderData)}
									class="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors hover:opacity-90 whitespace-nowrap"
									style="background-color: {secondaryColor}; color: {secondaryTextColor};"
								>
									<span class="hidden sm:inline">View Details</span>
									<span class="sm:hidden">Details</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="bg-white rounded-lg shadow p-12 text-center">
				<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
				</svg>
				<p class="mt-4 text-gray-600">No orders found</p>
			</div>
		{/each}
		</div>

		<!-- Pagination -->
		{#if !loading && totalPages > 1}
			<div class="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
				<!-- Page Info -->
				<div class="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
					Showing <span class="font-medium">{((currentPage - 1) * pageLimit) + 1}</span> to <span class="font-medium">{Math.min(currentPage * pageLimit, totalOrders)}</span> of <span class="font-medium">{totalOrders}</span> orders
				</div>

				<!-- Pagination Controls -->
				<nav class="flex items-center gap-x-1">
					<!-- Previous Button -->
					<button
						type="button"
						onclick={prevPage}
						disabled={currentPage === 1}
						class="min-h-[34px] sm:min-h-[38px] min-w-[34px] sm:min-w-[38px] py-1.5 sm:py-2 px-2 sm:px-2.5 inline-flex justify-center items-center gap-x-1 sm:gap-x-1.5 text-xs sm:text-sm rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
					>
						<svg class="shrink-0 size-3 sm:size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="m15 18-6-6 6-6"></path>
						</svg>
						<span class="hidden sm:inline">Prev</span>
					</button>

					<!-- Page Numbers -->
					<div class="flex items-center gap-x-1">
						{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
							{#if page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)}
								<button
									type="button"
									onclick={() => goToPage(page)}
									class="min-h-[34px] sm:min-h-[38px] min-w-[34px] sm:min-w-[38px] flex justify-center items-center text-xs sm:text-sm rounded-lg focus:outline-none focus:bg-gray-100 {page === currentPage ? 'text-white font-medium' : 'border border-gray-200 text-gray-800 hover:bg-gray-100'}"
									style={page === currentPage ? `background-color: ${secondaryColor}; color: ${secondaryTextColor};` : ''}
								>
									{page}
								</button>
							{:else if page === currentPage - 2 || page === currentPage + 2}
								<span class="min-h-[34px] sm:min-h-[38px] min-w-[34px] sm:min-w-[38px] flex justify-center items-center text-gray-500 text-xs sm:text-sm">...</span>
							{/if}
						{/each}
					</div>

					<!-- Next Button -->
					<button
						type="button"
						onclick={nextPage}
						disabled={currentPage === totalPages}
						class="min-h-[34px] sm:min-h-[38px] min-w-[34px] sm:min-w-[38px] py-1.5 sm:py-2 px-2 sm:px-2.5 inline-flex justify-center items-center gap-x-1 sm:gap-x-1.5 text-xs sm:text-sm rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
					>
						<span class="hidden sm:inline">Next</span>
						<svg class="shrink-0 size-3 sm:size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="m9 18 6-6-6-6"></path>
						</svg>
					</button>
				</nav>
			</div>
		{/if}
	{/if}
</div>

<!-- Detail Modal -->
<div
	id="orderDetailModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="orderDetailModalLabel"
>
	<div class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-3xl sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center">
		<div class="w-full flex flex-col bg-white shadow-sm rounded-xl pointer-events-auto">
			<!-- Modal Header -->
			<div class="flex justify-between items-center py-3 px-4 border-b" style="background-color: {secondaryColor}; color: {secondaryTextColor};">
				<h3 id="orderDetailModalLabel" class="font-bold text-lg">
					{#if selectedOrder}
						Order Details - {selectedOrder.order.orderNumber}
					{:else}
						Order Details
					{/if}
				</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent hover:opacity-80 focus:outline-none focus:opacity-80 disabled:opacity-50 disabled:pointer-events-none transition-opacity"
					style="color: {secondaryTextColor};"
					aria-label="Close"
					onclick={closeDetailModal}
				>
					<span class="sr-only">Close</span>
					<svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 6 6 18"></path>
						<path d="m6 6 12 12"></path>
					</svg>
				</button>
			</div>

			{#if selectedOrder}
			<div class="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
				<!-- Status Update Section -->
				<div class="mb-6 p-4 rounded-lg border border-gray-200">
					<h4 class="font-semibold mb-4 flex items-center gap-2">
						<svg class="w-5 h-5" style="color: {secondaryColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						Update Status
					</h4>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<!-- Order Status -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
							<select
								value={selectedOrder.order.status}
								onchange={(e) => updateOrderStatus(selectedOrder.order.id, 'status', e.currentTarget.value)}
								disabled={updatingStatus}
								class="py-3 px-4 border block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
							>
								<option value="pending">Pending</option>
								<option value="paid">Paid</option>
								<option value="cancelled">Cancelled</option>
							</select>
						</div>

						<!-- Payment Status -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
							<select
								value={selectedOrder.order.paymentStatus}
								onchange={(e) => updateOrderStatus(selectedOrder.order.id, 'paymentStatus', e.currentTarget.value)}
								disabled={updatingStatus}
								class="py-3 px-4 border block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
							>
								<option value="unpaid">Unpaid</option>
								<option value="paid">Paid</option>
								<option value="failed">Failed</option>
							</select>
						</div>

						<!-- Processing Status -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Processing Status</label>
							<select
								value={selectedOrder.order.processingStatus}
								onchange={(e) => updateOrderStatus(selectedOrder.order.id, 'processingStatus', e.currentTarget.value)}
								disabled={updatingStatus}
								class="py-3 px-4 block border w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
							>
								<option value="new">New</option>
								<option value="preparing">Preparing</option>
								<option value="ready">Ready</option>
								<option value="served">Served</option>
								<option value="completed">Completed</option>
							</select>
						</div>
					</div>
				</div>

				<!-- Order Items Section -->
				<div class="mb-6">
					<h4 class="font-semibold mb-4 flex items-center gap-2">
						<svg class="w-5 h-5" style="color: {secondaryColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
						</svg>
						Order Items
					</h4>
					
					{#if loadingDetails}
						<div class="flex justify-center items-center py-8">
							<div class="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent rounded-full" style="color: {secondaryColor};" role="status" aria-label="loading">
								<span class="sr-only">Loading...</span>
							</div>
						</div>
					{:else if orderItems.length > 0}
						<div class="space-y-3">
							{#each orderItems as item}
								<div class="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
									<div class="flex-1">
										<div class="flex items-start justify-between">
											<div>
												<h5 class="font-medium text-gray-900">{item.orderItem.productName}</h5>
												{#if item.orderItem.variantName && item.orderItem.variantValue}
													<p class="text-xs text-gray-500 mt-0.5">
														{item.orderItem.variantName}: {item.orderItem.variantValue}
													</p>
												{/if}
											</div>
											<div class="text-right ml-4">
												<div class="text-sm text-gray-600">
													{item.orderItem.quantity}x @ {formatRupiah(item.orderItem.unitPrice)}
												</div>
												<div class="font-semibold mt-1" style="color: {secondaryColor};">
													{formatRupiah(item.orderItem.subtotal)}
												</div>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500">
							<svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
							</svg>
							<p>No items found</p>
						</div>
					{/if}
				</div>

				<!-- Order Info -->
				<div class="mb-6 p-4 rounded-lg border border-gray-200">
					<h4 class="font-semibold mb-4 flex items-center gap-2">
						<svg class="w-5 h-5" style="color: {secondaryColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						Order Information
					</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">Customer:</span>
							<span class="font-medium text-gray-900">{selectedOrder.order.customerName || '-'}</span>
						</div>
						{#if selectedOrder.order.customerPhone}
							<div class="flex justify-between">
								<span class="text-gray-600">Phone:</span>
								<span class="font-medium text-gray-900">+62{selectedOrder.order.customerPhone}</span>
							</div>
						{/if}
						<div class="flex justify-between">
							<span class="text-gray-600">Dining Option:</span>
							<span class="font-medium text-gray-900">
								{#if selectedOrder.order.diningOption === 'dinein'}
									Dine In
									{#if selectedOrder.table}
										<span class="inline-flex items-center gap-x-1.5 py-1 px-2 ml-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
											{selectedOrder.table.name}
										</span>
									{/if}
								{:else}
									Pickup
								{/if}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Payment Method:</span>
							<span class="font-medium text-gray-900">{selectedOrder.order.paymentMethod?.toUpperCase() || '-'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Date:</span>
							<span class="font-medium text-gray-900">{formatDate(selectedOrder.order.createdAt)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Time:</span>
							<span class="font-medium text-gray-900">{formatTime(selectedOrder.order.createdAt)}</span>
						</div>
					</div>
					{#if selectedOrder.order.notes}
						<div class="pt-3 mt-3 border-t">
							<span class="text-gray-600 text-sm">Notes:</span>
							<p class="mt-1 text-gray-900 text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200">{selectedOrder.order.notes}</p>
						</div>
					{/if}
				</div>

				<!-- Total Summary -->
				<div class="p-4 rounded-lg" style="background-color: {secondaryColor}10; border: 2px solid {secondaryColor}20;">
					<h4 class="font-semibold mb-3 flex items-center gap-2" style="color: {secondaryColor};">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
						</svg>
						Payment Summary
					</h4>
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-gray-700">Subtotal:</span>
							<span class="font-medium text-gray-900">{formatRupiah(selectedOrder.order.subtotal)}</span>
						</div>
						{#if selectedOrder.order.tax > 0}
							<div class="flex justify-between text-sm">
								<span class="text-gray-700">Tax:</span>
								<span class="font-medium text-gray-900">{formatRupiah(selectedOrder.order.tax)}</span>
							</div>
						{/if}
						{#if selectedOrder.order.tip > 0}
							<div class="flex justify-between text-sm">
								<span class="text-gray-700">Tip:</span>
								<span class="font-medium text-gray-900">{formatRupiah(selectedOrder.order.tip)}</span>
							</div>
						{/if}
						<div class="flex justify-between text-lg font-bold pt-3 mt-3 border-t-2" style="border-color: {secondaryColor};">
							<span style="color: {secondaryColor};">Total:</span>
							<span style="color: {secondaryColor};">{formatRupiah(selectedOrder.order.total)}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200">
				<button
					type="button"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
					onclick={closeDetailModal}
				>
					Close
				</button>
				<button
					type="button"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent shadow-sm hover:opacity-90 focus:outline-none focus:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
					style="background-color: {secondaryColor}; color: {secondaryTextColor};"
					onclick={printReceipt}
				>
					<svg class="shrink-0 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
					</svg>
					Print Receipt
				</button>
			</div>
			{/if}
		</div>
	</div>
</div>

<!-- QRIS Modal -->
{#if showQrisModal}
	<div
		class="hs-overlay fixed size-full top-0 start-0 z-[90] overflow-x-hidden overflow-y-auto bg-black/50 flex items-center justify-center p-3 sm:p-4"
	>
		<div class="bg-white rounded-xl shadow-lg w-full max-w-lg mx-auto my-auto">
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200">
				<h3 class="font-bold text-gray-800 text-base sm:text-lg">Scan QR Code to Pay</h3>
				<button
					type="button"
					aria-label="Close modal"
					class="rounded-full p-2 inline-flex justify-center items-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
					onclick={closeQrisModal}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<div class="p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4">
				<!-- Amount to Pay -->
				<div class="w-full rounded-lg p-3 sm:p-4 border-2" style="background-color: {secondaryColor}15; border-color: {secondaryColor};">
					<div class="text-center">
						<p class="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Amount</p>
						<p class="text-2xl sm:text-3xl font-bold" style="color: {secondaryColor};">{formatRupiah(qrisAmount)}</p>
					</div>
				</div>

				<!-- QR Code -->
				<div class="qris-qr flex items-center justify-center w-full max-w-[260px] aspect-square bg-gray-100 rounded-lg">
					{#if qrisQrImgUrl}
						<img src={qrisQrImgUrl} alt="QR code" class="w-full h-full object-contain rounded-lg" />
					{:else if qrisInvoiceUrl}
						<iframe src={qrisInvoiceUrl} title="QRIS payment" class="w-full h-full border-0 rounded-lg"></iframe>
					{:else}
						<div class="text-center p-4">
							<svg class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<p class="text-xs sm:text-sm text-gray-600 font-medium">Generating QR Code...</p>
						</div>
					{/if}
				</div>

				<!-- Countdown Timer -->
				{#if qrisTimeRemaining}
					<div class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg w-full justify-center">
						<svg class="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<span class="text-xs sm:text-sm font-semibold" style="color: {qrisTimeRemaining === 'Expired' ? '#dc2626' : '#d97706'};">
							{qrisTimeRemaining === 'Expired' ? 'QR Code Expired' : `Expires in ${qrisTimeRemaining}`}
						</span>
					</div>
				{/if}

				<!-- Status -->
				<div class="flex items-center gap-2 text-xs sm:text-sm font-medium flex-wrap justify-center">
					<span class="text-gray-600">Status:</span>
					<span class="px-2 sm:px-3 py-1 rounded-full text-xs font-bold" style="
						background-color: {qrisStatus === 'SUCCEEDED' ? '#d1fae5' : qrisStatus === 'EXPIRED' ? '#fee2e2' : '#fef3c7'};
						color: {qrisStatus === 'SUCCEEDED' ? '#065f46' : qrisStatus === 'EXPIRED' ? '#991b1b' : '#92400e'};
					">
						{qrisStatus === 'SUCCEEDED' ? 'Paid' : qrisStatus === 'EXPIRED' ? 'Expired' : qrisStatus === 'REQUIRES_ACTION' ? 'Waiting for Payment' : qrisStatus ?? 'PENDING'}
					</span>
				</div>

				<!-- Action Buttons -->
				<div class="qris-actions flex flex-col sm:flex-row gap-2 w-full">
					<button
						class="flex-1 py-2 px-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
						onclick={manualCheckQris}
					>
						Check Payment
					</button>
					<button
						class="flex-1 py-2 px-3 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
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
