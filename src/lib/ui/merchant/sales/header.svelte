<script lang="ts">
	interface Props {
		nama: string;
		handleLock?: () => void;
	}

	let { nama, handleLock }: Props = $props();
	
	
	

	
</script>

<header
	
	class=" z-50 top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap w-full text-sm py-4.5 dark:bg-neutral-800 dark:border-neutral-700"
>
	<nav class="px-4 sm:px-6 flex basis-full items-center w-full mx-auto">
		<div class="flex items-center gap-x-2 me-5 lg:me-0 lg:hidden">
			<div class="lg:hidden">
				<button
					type="button"
					class="flex justify-center items-center size-10 text-xl text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
					aria-haspopup="dialog"
					aria-expanded="false"
					aria-controls="hs-sidebar-content-push"
					aria-label="Toggle navigation"
					data-hs-overlay="#hs-sidebar-content-push"
				>
					<svg
						class="sm:hidden shrink-0 size-4"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M15 3v18" /><path d="m8 9 3 3-3 3" /></svg
					>
					<svg
						class="hidden sm:block shrink-0 size-4"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M15 3v18" /><path d="m10 15-3-3 3-3" /></svg
					>
					<span class="sr-only">Navigation Toggle</span>
				</button>
			</div>
			<a
				class="flex-none font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400 tracking-tight"
				href="/"
				aria-label="Brand"><img src="/tukoo.svg" class="w-24" alt="" srcset=""></a
			>
			<!-- End Logo -->

			<div class="lg:hidden ms-1"></div>
		</div>

		<div class="w-full flex items-center justify-end ms-auto gap-x-1 md:gap-x-3">
			{#if handleLock}
				<button
					onclick={handleLock}
					class="inline-flex items-center gap-x-2 px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					<span class="hidden sm:inline">Lock</span>
				</button>
			{/if}
			
			<div class="flex flex-row items-center justify-between gap-1 space-x-2">
				<p>Hallo, {nama}</p>

				<img
					class="inline-block object-cover object-center shrink-0 size-8 rounded-full"
					src={"/storage/profile/default.jpg"}
					alt="Avatar"
				/>
			</div>
		</div>
	</nav>
</header>
