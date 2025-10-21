<script lang="ts">
	let { data, children } = $props();
	
</script>

<svelte:head>
	<title>Tukoo Sign Systems</title>
</svelte:head>

<div class="flex flex-col lg:flex-row w-full h-full min-h-screen">
	<!-- Left side - Banner Image (hidden on mobile, visible on lg+) -->
	<div class="hidden lg:flex w-full h-full min-h-screen lg:flex-1 relative">
		<!-- cover img -->
		<img src="/banner-tukoo2.jpg" alt="Tukoo POS Banner" class="w-full h-full object-cover absolute top-0 left-0" />
		<div class="absolute top-0 left-0 w-full h-full bg-black/20"></div>
		<div class="absolute bottom-0 left-0 p-6 lg:p-10">
			<p class="text-xl lg:text-2xl text-white font-semibold italic">"Best POS we've used for our small cafe. Quick transactions, integrated receipts, and sales analytics that actually make sense."</p>
			<p class="text-lg lg:text-xl text-white mt-2">- Joko Tingkir</p>
		</div>
	</div>
	
	<!-- Right side - Auth Forms -->
	<div class="w-full h-full lg:flex-1 min-h-screen flex flex-col justify-center items-start">
		{@render children?.()}
	</div>
</div>


