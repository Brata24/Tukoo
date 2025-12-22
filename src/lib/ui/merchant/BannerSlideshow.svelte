<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	type Banner = {
		id: number;
		title: string;
		image: string;
		order: number;
	};

	type Props = {
		banners: Banner[];
		autoPlay?: boolean;
		interval?: number;
		showIndicators?: boolean;
		height?: string;
	};

	let { 
		banners, 
		autoPlay = true, 
		interval = 5000, 
		showIndicators = true,
		height = 'h-96'
	}: Props = $props();

	let currentIndex = $state(0);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	function nextSlide() {
		if (banners.length === 0) return;
		currentIndex = (currentIndex + 1) % banners.length;
	}

	function goToSlide(index: number) {
		currentIndex = index;
		// Restart auto-play after manual navigation
		if (autoPlay && intervalId) {
			clearInterval(intervalId);
			startAutoPlay();
		}
	}

	function startAutoPlay() {
		if (autoPlay && banners.length > 1) {
			intervalId = setInterval(nextSlide, interval);
		}
	}

	onMount(() => {
		startAutoPlay();
	});

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});

	let currentBanner = $derived(banners[currentIndex]);
</script>

{#if banners.length === 0}
	<div class="w-full {height} bg-gray-200 rounded-lg flex items-center justify-center">
		<div class="text-center">
			
			<p class="text-gray-500 text-lg">No promotional banners</p>
		</div>
	</div>
{:else}
	<div class="relative w-full {height} rounded-lg overflow-hidden bg-gray-900">
		<!-- Banner Images -->
		{#key currentIndex}
			<div 
				class="absolute inset-0"
				transition:fade={{ duration: 300 }}
			>
				<img
					src={currentBanner.image}
					alt={currentBanner.title}
					class="w-full h-full object-cover"
				/>
				<!-- Optional title overlay -->
				{#if currentBanner.title}
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
						<h3 class="text-white text-2xl font-bold">{currentBanner.title}</h3>
					</div>
				{/if}
			</div>
		{/key}

		<!-- Navigation Indicators -->
		{#if showIndicators && banners.length > 1}
			<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
				{#each banners as banner, index}
					<button
						onclick={() => goToSlide(index)}
						class="w-3 h-3 rounded-full transition-all duration-300 {index === currentIndex
							? 'bg-white scale-125'
							: 'bg-white/50 hover:bg-white/75'}"
						aria-label="Go to slide {index + 1}"
					></button>
				{/each}
			</div>
		{/if}

		<!-- Manual Navigation Arrows (optional) -->
		{#if banners.length > 1}
			<button
				onclick={() => goToSlide((currentIndex - 1 + banners.length) % banners.length)}
				class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all"
				aria-label="Previous slide"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			<button
				onclick={() => goToSlide((currentIndex + 1) % banners.length)}
				class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all"
				aria-label="Next slide"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{/if}
	</div>
{/if}
