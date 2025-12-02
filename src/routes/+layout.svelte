<script lang="ts">
	import { afterNavigate } from "$app/navigation";
	import { toast } from "$lib/stores/toast";
	import { onMount } from "svelte";
	let { data, children } = $props();
	import "../app.css";

	afterNavigate(() => {
		if (typeof window !== 'undefined' && window.HSStaticMethods?.autoInit) {
			window.HSStaticMethods.autoInit();
		}
	});

	// Example: Show a welcome toast on page load
	
</script>

<svelte:head>
	<title>Test Svelte</title>
</svelte:head>




{@render children?.()}
