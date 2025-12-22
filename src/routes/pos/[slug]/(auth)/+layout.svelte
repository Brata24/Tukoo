<script lang="ts">
	let { data, children } = $props();
	
</script>

<svelte:head>
	<title>Tukoo Sign Systems</title>
</svelte:head>

<div class="flex w-full h-full min-h-screen ">
	<div class="w-full h-full min-h-screen  flex-1 relative">
		<!-- cover img -->
		<img src="/banner-tukoo2.jpg" alt="" class="w-full h-full object-cover absolute top-0 left-0" />
		<div class="absolute top-0 left-0 w-full h-full bg-black/20 bg-opacity-20"></div>
		<div class="absolute bottom-0 left-0 p-10">
			<p class=" text-2xl text-white font-semibold italic">"Best POS we’ve used for our small cafe. Quick transactions, integrated receipts, and sales analytics that actually make sense."</p>
			<p class="text-xl text-white">- Joko Tingkir</p>
		</div>
	</div>
	<div class="w-full h-full flex-1 min-h-screen flex flex-col justify-center items-start">
		{@render children?.()}
	</div>
</div>


