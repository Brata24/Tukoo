<script lang="ts">
	import { page } from "$app/stores";

	interface Props {
		primaryColor?: string;
		secondaryColor?: string;
		primaryTextColor?: string;
		secondaryTextColor?: string;
		logo?: string;
	}

	let {
		primaryColor = "#ffffff",
		secondaryColor = "#f3f4f6",
		primaryTextColor = "#1f2937",
		secondaryTextColor = "#111827",
		logo = "/profile/default.jpg"
	}: Props = $props();

	let bgColor = $state(primaryColor);
	let hoverColor = $state(secondaryColor);
	let textColor = $state(primaryTextColor);
	let hoverTextColor = $state(secondaryTextColor);

	$effect(() => {
		bgColor = primaryColor || "#ffffff";
		hoverColor = secondaryColor || "#f3f4f6";
		textColor = primaryTextColor || "#1f2937";
		hoverTextColor = secondaryTextColor || "#111827";
	});

	
	function isActive(path: string): boolean {
		const currentPath = $page.url.pathname;
	
		if (path === "/") {
			
			return currentPath.endsWith("/sales") || currentPath === path;
		}
		return currentPath.includes(path);
	}
</script>

<div
	id="hs-sidebar-content-push"
	style="background-color: {bgColor}; --hover-color: {hoverColor}; --text-color: {textColor}; --hover-text-color: {hoverTextColor};"
	class="hs-overlay lg:[--overlay-backdrop:false] [--is-layout-affect:true] [--opened:lg] [--auto-close:lg] lg:hs-overlay-layout-open:translate-x-0 lg:block lg:-translate-x-full lg:end-auto lg:bottom-0 w-64 [--body-scroll:true] hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform h-full hidden fixed top-0 start-0 bottom-0 z-60 border-e border-gray-200 dark:bg-neutral-800 dark:border-neutral-700"
	role="dialog"
	tabindex="-1"
	aria-label="Sidebar"
>
	<div class="relative flex flex-col h-full max-h-full">
		<header class=" p-4 flex justify-between items-center gap-x-2">
			<a
				class="flex-none font-semibold text-xl text-black focus:outline-hidden focus:opacity-80 dark:text-white"
				href="/"
				aria-label="Brand"><img src={logo} class="size-16" alt="Logo Merch" /></a
			>

			<div class="lg:hidden -me-2">
				<button
					type="button"
					class="flex justify-center items-center gap-x-3 size-6 bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
					data-hs-overlay="#hs-sidebar-content-push"
				>
					<svg
						class="shrink-0 size-4"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
					>
					<span class="sr-only">Close</span>
				</button>
			</div>
		</header>

		<div class="flex flex-col h-full justify-between">
			<nav
				class="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
			>
				<div class="hs-accordion-group pb-0 px-2 w-full flex flex-col flex-wrap" data-hs-accordion-always-open>
					<ul class="space-y-1">
						<li>
							<a
								class="sidebar-link {isActive('/')
									? 'active'
									: ''} flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg"
								href="/"
							>
								<svg
									class="size-4"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline
										points="9 22 9 12 15 12 15 22"
									/></svg
								>
								Dashboard
							</a>
						</li>

						<li>
							<a
								href="/sales/menu"
								class="sidebar-link {isActive('/sales/menu')
									? 'active'
									: ''} w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg"
								><svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="size-4"
									><path d="M2 6h4" /><path d="M2 10h4" /><path d="M2 14h4" /><path d="M2 18h4" /><rect
										width="16"
										height="20"
										x="4"
										y="2"
										rx="2"
									/><path d="M9.5 8h5" /><path d="M9.5 12H16" /><path d="M9.5 16H14" /></svg
								>
								Menu
							</a>
						</li>

						<li>
							<a
								href="/sales/order"
								class="sidebar-link {isActive('/sales/order')
									? 'active'
									: ''} w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="size-4"
									><path
										d="M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z"
									/><path d="M8 11V6a4 4 0 0 1 8 0v5" /></svg
								>
								Order
							</a>
						</li>

						<li>
							<a
								class="sidebar-link {isActive('/sales/settings')
									? 'active'
									: ''} w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg"
								href="/sales/settings"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="size-4"
									><path
										d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
									/><circle cx="12" cy="12" r="3" /></svg
								>
								Settings
							</a>
						</li>
					</ul>
				</div>
			</nav>
		</div>

		<!-- End Body -->

		<form method="POST" class="m-2">
			<button
				class=" w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-red-700 rounded-lg bg-red-50 hover:bg-red-100 focus:outline-hidden focus:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:text-neutral-200"
				formaction="/manage?/logout"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="size-4"
					><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg
				>
				Sign Out
			</button>
		</form>
	</div>
</div>

<!-- End Sidebar -->

<style>
	.sidebar-link {
		color: var(--text-color) !important;
	}

	.sidebar-link:hover,
	.sidebar-link:focus {
		background-color: var(--hover-color) !important;
		color: var(--hover-text-color) !important;
	}

	.sidebar-link.active {
		background-color: var(--hover-color) !important;
		color: var(--hover-text-color) !important;
	}
</style>
