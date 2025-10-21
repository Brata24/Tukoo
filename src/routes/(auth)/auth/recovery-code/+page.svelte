<script lang="ts">
	import type { PageData } from "./$types";

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<div class="px-12 w-full">
	<h1 class="text-2xl font-bold">Recovery code</h1>
	<p class="mb-4">You can use this recovery code if you lose access to your second factors.</p>

	<p class="mb-2">Your recovery code is: <b class="font-mono">{data.recoveryCode}</b></p>

	
	<a
		href="/"
		class="py-2 justify-center px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#2941cc] text-white hover:bg-[#303a72] focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
	>
		Next
	</a>
</div>
