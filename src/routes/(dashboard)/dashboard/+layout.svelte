<script lang="ts">
	import Sidebar from "$lib/ui/sidebar.svelte";

	import Header from "$lib/ui/header.svelte";
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
<Sidebar username={data.user.username} email={data.user.email} profile_picture={data.user.profile_picture} />
<div class="sm:hs-overlay-layout-open:ms-72 min-h-160 transition-all duration-300 dark:bg-neutral-800">
	
	{@render children?.()}
</div>
