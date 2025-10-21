<script lang="ts">
	import Sidebar from "$lib/ui/merchant/sidebar.svelte";

	import Header from "$lib/ui/merchant/header.svelte";
	import type { PageData } from "./$types";
	interface Props {
		data: PageData;
		children?: any;
	}
	let { data, children }: Props = $props();
</script>

<svelte:head>
	<title>Dashboard - Tukoo POS SYSTEM</title>
</svelte:head>
<Header /> 
<Sidebar username={data.user.username} merchant_uuid={data.merchant.uuid} email={data.user.email} profile_picture={data.user.profile_picture} merchant_name={data.merchant.name} merchant_logo={data.merchant.logo} merchant_slogan={data.merchant.slogan} />
<div class="sm:hs-overlay-layout-open:ms-72 min-h-160 transition-all duration-300 dark:bg-neutral-800">
	
	{@render children?.()}
</div>
