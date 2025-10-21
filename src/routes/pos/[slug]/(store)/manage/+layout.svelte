<script lang="ts">
	import Sidebar from "$lib/ui/merchant/manage/sidebar.svelte";

	import Header from "$lib/ui/merchant/manage/header.svelte";
	import type { PageData } from "./$types";
	interface Props {
		data: PageData;
		children?: any;
	}
	let { data, children }: Props = $props();
</script>

<svelte:head>
	<title>Dashboard Manajer - POS {data?.merchant?.name ?? ''}</title>
</svelte:head>
<Header nama={data?.user?.name ?? ''}  />
<Sidebar primaryColor={data?.merchant?.primaryColor ?? ''} logo={data?.merchant?.logo ?? ''} secondaryColor={data?.merchant?.secondaryColor ?? ''} primaryTextColor={data?.merchant?.primaryTextColor ?? ''} secondaryTextColor={data?.merchant?.secondaryTextColor ?? ''} />
<div class="sm:hs-overlay-layout-open:ms-64 min-h-160 transition-all duration-300 dark:bg-neutral-800">
	
	{@render children?.()}
</div>
