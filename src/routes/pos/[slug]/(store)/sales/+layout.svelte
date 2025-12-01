<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Sidebar from "$lib/ui/merchant/sales/sidebar.svelte";
	import Header from "$lib/ui/merchant/sales/header.svelte";
	import LockScreen from "$lib/ui/merchant/sales/lockscreen.svelte";
	import type { LayoutData } from "./$types";
	
	interface Props {
		data: LayoutData;
		children?: any;
	}
	
	let { data, children }: Props = $props();
	
	let merchant = $derived(data?.merchant as any);
	let isLocked = $state(data.isLocked);

	// Sync with server data when it changes
	$effect(() => {
		isLocked = data.isLocked;
	});

	const handleLock = async () => {
		try {
			const response = await fetch(`/sales/lock`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ action: 'lock' })
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Lock error:', error);
		}
	};

	const handleUnlock = async () => {
		await invalidateAll();
	};
</script>

<svelte:head>
	<title>Dashboard Manajer - POS {data?.merchant?.name ?? ''}</title>
</svelte:head>

{#if isLocked}
	<!-- Lock Screen Overlay - Blocks all routes under /sales -->
	<LockScreen 
		merchantSlug={data.merchant.slug}
		merchantName={data.merchant.name}
		merchantLogo={data.merchant.logo}
		userName={data.user.name}
		primaryColor={data.merchant.primaryColor}
		secondaryColor={data.merchant.secondaryColor}
		onUnlock={handleUnlock}
	/>
{:else}
	<Header 
		nama={data?.user?.name ?? ''} 
		{handleLock}
		primaryColor={data.merchant.primaryColor}
		secondaryColor={data.merchant.secondaryColor}
	/>
	<Sidebar primaryColor={merchant?.primaryColor ?? ''} logo={merchant?.logo ?? ''} secondaryColor={merchant?.secondaryColor ?? ''} primaryTextColor={merchant?.primaryTextColor ?? ''} secondaryTextColor={merchant?.secondaryTextColor ?? ''} />

	<div class="sm:hs-overlay-layout-open:ms-64 min-h-160 transition-all duration-300 dark:bg-neutral-800">
		{@render children?.()}
	</div>
{/if}
