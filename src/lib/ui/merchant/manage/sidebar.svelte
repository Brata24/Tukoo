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
	logo = "/storage/profile/default.jpg"
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

	// Helper function to check if path is active
	function isActive(path: string): boolean {
		const currentPath = $page.url.pathname;
		// Match exact path or any sub-path
		if (path === "/") {
			// For dashboard, match exactly the manage root or base
			return currentPath.endsWith("/manage") || currentPath === path;
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
								href="/manage/category"
								class="sidebar-link {isActive('/manage/category')
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
										d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z"
									/><path
										d="m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845"
									/></svg
								>
								Category
							</a>
						</li>

						<li>
							<a
								href="/manage/table"
								class="sidebar-link {isActive('/manage/table')
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
									><path d="M12 3v18" /><path d="M3 12h18" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg
								>
								Table Management
							</a>
						</li>

						<li class="hs-accordion" id="products-accordion">
							<button
								type="button"
								class=" hs-accordion-toggle w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm sidebar-link {isActive(
									'/manage/products'
								)
									? 'active'
									: ''} rounded-lg"
								aria-expanded="true"
								aria-controls="users-accordion-collapse-1"
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
									class="size-4 sidebar-link"
									><path
										d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
									/><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg
								>

								Products

								<svg
									class="hs-accordion-active:block ms-auto hidden size-4 sidebar-link"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"><path d="m18 15-6-6-6 6" /></svg
								>

								<svg
									class="hs-accordion-active:hidden ms-auto block size-4 sidebar-link"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
								>
							</button>

							<div
								id="users-accordion-collapse-1"
								class="hs-accordion-content w-full overflow-hidden transition-[height] duration-300 hidden"
								role="region"
								aria-labelledby="users-accordion"
							>
								<ul class="hs-accordion-group pt-1 ps-7 space-y-1" data-hs-accordion-always-open>
									<li>
										<a
											class="flex items-center gap-x-3.5 py-2 px-2.5 text-sm sidebar-link {isActive(
												'/manage/products/add'
											)
												? 'active'
												: ''} rounded-lg"
											href="/manage/products/add"
										>
											Add Product
										</a>
									</li>
									<li>
										<a
											class="flex items-center gap-x-3.5 py-2 px-2.5 text-sm sidebar-link {isActive(
												'/manage/products'
											) && !isActive('/manage/products/add')
												? 'active'
												: ''} rounded-lg"
											href="/manage/products"
										>
											List Products
										</a>
									</li>
								</ul>
							</div>
						</li>

						<li>
							<a
								href="/manage/banner"
								class="sidebar-link {isActive('/manage/banner')
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
									><path d="M3 2h18" /><rect width="18" height="12" x="3" y="6" rx="2" /><path d="M3 22h18" /></svg
								>
								Banner Settings
							</a>
						</li>

						<li>
							<a
								href="/manage/report"
								class="sidebar-link {isActive('/manage/report')
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
									><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path
										d="M14 2v4a2 2 0 0 0 2 2h4"
									/><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg
								>
								Report
							</a>
						</li>

						<li>
							<a
								class="sidebar-link {isActive('/manage/settings')
									? 'active'
									: ''} w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg"
								href="/manage/settings"
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
