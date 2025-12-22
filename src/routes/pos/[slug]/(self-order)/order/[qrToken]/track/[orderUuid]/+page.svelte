<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	let { data } = $props();
	const { slug, qrToken, orderUuid } = data;

	let loading = $state(true);
	let error = $state("");
	let orderData = $state<any>(null);
	let merchant = $state<any>(null);
	let table = $state<any>(null);
	let items = $state<any[]>([]);

	let refreshInterval: any;

	const statusSteps = [
		{ key: "new", label: "Order Received", icon: "📝" },
		{ key: "preparing", label: "Preparing", icon: "👨‍🍳" },
		{ key: "ready", label: "Ready", icon: "✅" },
		{ key: "served", label: "Served", icon: "🍽️" },
		{ key: "completed", label: "Completed", icon: "🎉" }
	];

	let currentStepIndex = $derived(() => {
		if (!orderData) return 0;
		const index = statusSteps.findIndex((s) => s.key === orderData.processingStatus);
		// If status is 'completed', all steps should be marked as completed
		return index >= 0 ? index : statusSteps.length - 1;
	});

	onMount(async () => {
		await loadOrder();

		// Auto refresh every 10 seconds
		refreshInterval = setInterval(async () => {
			await loadOrder();
		}, 10000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	async function loadOrder() {
		try {
			loading = true;
			const response = await fetch(`/api/track?orderUuid=${orderUuid}`);
			const result = await response.json();

			if (!result.success) {
				error = result.error || "Failed to load order";
				return;
			}

			orderData = result.data.order;
			items = result.data.items;
			table = result.data.table;
			merchant = result.data.merchant;

			if (orderData.processingStatus === "completed" && refreshInterval) {
				clearInterval(refreshInterval);
				refreshInterval = null;
				console.log("Order completed - polling stopped");
			}
		} catch (err) {
			error = "Network error. Please try again.";
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function formatPrice(amount: number) {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(date: string) {
		return new Date(date).toLocaleString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	}

	async function shareTracking() {
		if (!orderData || !merchant) return;

		const url = window.location.href;
		try {
			console.log(navigator.share);
			if (navigator.share) {
				await navigator.share({
					title: `Order ${orderData.orderNumber}`,
					text: `Track my order at ${merchant.name}`,
					url
				});
			} else {
				await navigator.clipboard.writeText(url);
				alert("Tracking link copied to clipboard!");
			}
		} catch (err) {
			// User cancelled share or clipboard failed
			console.error("Share failed:", err);
		}
	}
</script>

<svelte:head>
	<title>Track Order - {orderData?.orderNumber}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

{#if loading && !orderData}
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<div
				class="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4"
				style="border-color: {merchant?.primaryColor || '#3b82f6'}"
			></div>
			<p class="text-gray-600">Loading order...</p>
		</div>
	</div>
{:else if error}
	<div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
		<div class="text-center">
			<div class="text-red-500 text-5xl mb-4">⚠️</div>
			<h2 class="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
			<p class="text-gray-600 mb-4">{error}</p>
			<button
				onclick={() => window.location.reload()}
				class="px-4 py-2 rounded-lg text-white font-medium"
				style="background-color: {merchant?.primaryColor || '#3b82f6'}"
			>
				Try Again
			</button>
		</div>
	</div>
{:else if orderData}
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<div class="bg-white shadow-sm sticky top-0 z-10">
			<div
				class="p-4 border-b"
				style="background: linear-gradient(135deg, {merchant.primaryColor}15, {merchant.secondaryColor}15)"
			>
				<div class="flex items-center gap-3 mb-2">
					{#if merchant.logo}
						<img src={merchant.logo} alt={merchant.name} class="w-12 h-12 rounded-lg object-cover" />
					{/if}
					<div class="flex-1">
						<h1 class="text-lg font-bold text-gray-900">{merchant.name}</h1>
						<p class="text-sm text-gray-600">Table {table?.name}</p>
					</div>
					<button
						onclick={shareTracking}
						disabled={!orderData || !merchant}
						class="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Share tracking link"
					>
						<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
							/>
						</svg>
					</button>
				</div>
				<div class="text-center">
					<p class="text-sm text-gray-500">Order Number</p>
					<p class="text-lg font-bold text-gray-900">{orderData.orderNumber}</p>
				</div>
			</div>
		</div>

		<div class="p-4 space-y-4">
			<!-- Status Progress -->
			<div class="bg-white rounded-2xl p-6 shadow-sm">
				<h2 class="text-lg font-bold text-gray-900 mb-6">Order Status</h2>

				{#if orderData.processingStatus === "completed"}
					<!-- All Completed State -->
					<div class="text-center py-4 mb-6">
						<div class="text-6xl mb-3">🎉</div>
						<h3 class="text-xl font-bold text-gray-900 mb-2">Order Completed!</h3>
						<p class="text-gray-600">Thank you for your order</p>
					</div>
				{/if}

				<div class="relative">
					{#each statusSteps as step, index}
						{@const isCompleted =
							index < currentStepIndex() ||
							(orderData.processingStatus === "completed" && index < statusSteps.length - 1)}
						{@const isCurrent = index === currentStepIndex() && orderData.processingStatus !== "completed"}
						{@const isPending = index > currentStepIndex() && orderData.processingStatus !== "completed"}
						{@const isLastAndCompleted = orderData.processingStatus === "completed" && index === statusSteps.length - 1}

						<div class="flex items-center gap-4 mb-6 last:mb-0">
							<!-- Icon/Checkmark Circle -->
							<div
								class="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all"
								class:ring-4={isCurrent}
								style={isCompleted || isLastAndCompleted
									? `background-color: ${merchant.secondaryColor}; color: ${merchant.secondaryTextColor || "#FFFFFF"}`
									: isCurrent
										? `background-color: ${merchant.secondaryColor}; color: ${merchant.secondaryTextColor || "#FFFFFF"}; border: 3px solid ${merchant.secondaryColor}; box-shadow: 0 0 0 4px ${merchant.secondaryColor}30`
										: "background-color: #e5e7eb; color: #9ca3af"}
							>
								{#if isCompleted || isLastAndCompleted}
									<!-- Checkmark for completed steps -->
									<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{:else}
									<!-- Icon for current and pending -->
									<span class="text-2xl">{step.icon}</span>
								{/if}
							</div>

							<!-- Label -->
							<div class="flex-1">
								<p
									class="font-bold text-base"
									class:text-gray-900={isCompleted || isCurrent || isLastAndCompleted}
									class:text-gray-400={isPending}
								>
									{step.label}
								</p>
								{#if isCompleted || isLastAndCompleted}
									<p class="text-sm text-gray-500 flex items-center gap-1 mt-1">
										<svg
											class="w-4 h-4"
											style="color: {merchant.secondaryColor}"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clip-rule="evenodd"
											/>
										</svg>
										Completed
									</p>
								{:else if isCurrent}
									<p class="text-sm font-medium mt-1" style="color: {merchant.secondaryColor}">⏳ In progress...</p>
								{/if}
							</div>
						</div>

						<!-- Connector Line -->
						{#if index < statusSteps.length - 1}
							<div
								class="ml-7 w-1 h-8 -my-4 rounded-full transition-all"
								style={isCompleted || orderData.processingStatus === "completed"
									? `background-color: ${merchant.secondaryColor}`
									: "background-color: #e5e7eb"}
							></div>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Order Details -->
			<div class="bg-white rounded-2xl p-6 shadow-sm">
				<h2 class="text-lg font-bold text-gray-900 mb-4">Order Details</h2>

				<div class="space-y-3">
					{#each items as item}
						<div class="flex gap-3">
							<div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
								{#if item.productImage}
									<img src={item.productImage} alt={item.productName} class="w-full h-full object-cover" />
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium text-gray-900">{item.productName}</p>
								<p class="text-sm text-gray-500">{item.quantity}x {formatPrice(item.unitPrice)}</p>
							</div>
							<p class="font-medium text-gray-900">{formatPrice(item.subtotal)}</p>
						</div>
					{/each}
				</div>

				<div class="border-t mt-4 pt-4">
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Total</span>
						<span class="text-xl font-bold text-gray-900">{formatPrice(orderData.total)}</span>
					</div>
				</div>
			</div>

			<!-- Customer Info -->
			<div class="bg-white rounded-2xl p-6 shadow-sm">
				<h2 class="text-lg font-bold text-gray-900 mb-4">Customer Info</h2>
				<div class="space-y-2">
					<div class="flex justify-between">
						<span class="text-gray-600">Name</span>
						<span class="font-medium text-gray-900">{orderData.customerName}</span>
					</div>
					{#if orderData.customerPhone}
						<div class="flex justify-between">
							<span class="text-gray-600">Phone</span>
							<span class="font-medium text-gray-900">{orderData.customerPhone}</span>
						</div>
					{/if}
					<div class="flex justify-between">
						<span class="text-gray-600">Order Time</span>
						<span class="font-medium text-gray-900">{formatDate(orderData.createdAt)}</span>
					</div>
				</div>
			</div>

			<!-- Payment Info -->
			<div class="bg-white rounded-2xl p-6 shadow-sm">
				<h2 class="text-lg font-bold text-gray-900 mb-4">Payment Info</h2>

				<div class="space-y-3">
					<!-- Payment Method -->
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Payment Method</span>
						<span class="font-medium text-gray-900">
							{#if orderData.paymentMethod === "qris"}
								<svg width="38" viewBox="0 0 84 33" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M8.9663 5.75562H4.58141C4.43753 5.75561 4.29507 5.78399 4.16218 5.83912C4.02928 5.89425 3.90857 5.97505 3.80694 6.07689C3.70531 6.17873 3.62477 6.29962 3.56992 6.43263C3.51508 6.56564 3.487 6.70816 3.48731 6.85203V26.2115C3.48751 26.5016 3.60285 26.7798 3.80799 26.9849C4.01313 27.1901 4.2913 27.3054 4.58141 27.3056H17.0458V21.8614H8.9663V5.75562Z"
										fill="black"
									/>
									<path
										d="M23.9361 5.75562H11.6084V11.1366H19.7088V19.2191H25.0325V6.85203C25.0329 6.70796 25.0047 6.56525 24.9497 6.43209C24.8947 6.29893 24.814 6.17794 24.7121 6.07607C24.6102 5.9742 24.4892 5.89345 24.3561 5.83846C24.2229 5.78346 24.0802 5.75531 23.9361 5.75562Z"
										fill="black"
									/>
									<path d="M19.6855 27.3056H19.6871V32.4031H25.0325V21.8613H19.6855V27.3056Z" fill="black" />
									<path d="M56.2166 5.65674H51.2588V27.1396H56.2166V5.65674Z" fill="black" />
									<path
										d="M79.809 25.9242V22.0397V18.7527V16.3738V13.7949H65.7077V10.6153H79.809V5.65674H58.3262V7.50752V10.6153V13.7949V17.0579V18.7527H72.4267V22.0397H58.3262V26.9982H79.809V25.9242Z"
										fill="black"
									/>
									<path
										d="M11.5947 19.0668H17.0575V13.604H11.5947V19.0668ZM13.2517 15.2618H15.3998V17.4098H13.2517V15.2618Z"
										fill="black"
									/>
									<path
										d="M27.3314 10.6153H43.1167V13.7988H32.2684H28.705H27.3105V27.1812H32.2684V18.7751L41.1385 27.2121H48.8659L39.6151 18.7566H48.8968V18.1899V13.7988V10.6153V7.25195V5.65674H27.3314V10.6153Z"
										fill="black"
									/>
									<path
										d="M82.0641 21.9609V30.672C82.0639 30.7901 82.0169 30.9033 81.9334 30.9868C81.8499 31.0704 81.7367 31.1174 81.6186 31.1176H72.7832V32.4433H81.6186C82.088 32.4421 82.5378 32.2551 82.8697 31.9232C83.2016 31.5912 83.3886 31.1414 83.3899 30.672V21.9609H82.0641Z"
										fill="black"
									/>
									<path
										d="M10.6067 0.443359H1.77125C1.30186 0.444582 0.852048 0.631589 0.520139 0.963498C0.188229 1.29541 0.00122291 1.74522 0 2.21461L0 10.9257H1.32574V2.21461C1.32574 2.09645 1.37268 1.98314 1.45623 1.89959C1.53978 1.81603 1.65309 1.7691 1.77125 1.7691H10.6067V0.443359Z"
										fill="black"
									/>
								</svg> 
							{:else if orderData.paymentMethod === "cash"}
								💵 Cash
							{:else}
								{orderData.paymentMethod}
							{/if}
						</span>
					</div>

					<!-- Payment Status -->
					<div class="flex justify-between items-center">
						<span class="text-gray-600">Payment Status</span>
						<div
							class="px-3 py-1.5 rounded-full text-xs font-semibold"
							style={orderData.paymentStatus === "paid"
								? `background-color: ${merchant.secondaryColor}20; color: ${merchant.secondaryColor}`
								: "background-color: #fef3c7; color: #92400e"}
						>
							{#if orderData.paymentStatus === "paid"}
								PAID
							{:else if orderData.paymentStatus === "unpaid"}
								{#if orderData.paymentMethod === "cash"}
									⏳ PAY AT CASHIER
								{:else}
									⏳ PENDING
								{/if}
							{:else}
								{orderData.paymentStatus.toUpperCase()}
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Refresh Notice -->
			{#if orderData.processingStatus !== "completed"}
				<p class="text-center text-sm text-gray-500">⟳ Auto-refreshing every 10 seconds</p>
			{:else}
				<p class="text-center text-sm font-medium" style="color: {merchant.secondaryColor}">
					✓ Order completed - Have a great day!
				</p>
			{/if}
		</div>
	</div>
{/if}
