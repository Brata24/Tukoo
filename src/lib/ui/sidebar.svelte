<script lang="ts">
	import { page } from '$app/stores';

	interface UserData {
		username: string;
		email: string;
		profile_picture: string;
	}

	let userData: UserData = $props();

	// Helper function to check if path is active
	function isActive(path: string): boolean {
		const currentPath = $page.url.pathname;
		if (path === '/dashboard') {
			return currentPath === '/dashboard' || currentPath === '/dashboard/';
		}
		return currentPath.includes(path);
	}
</script>

<!-- Sidebar -->
<div
	id="hs-sidebar-content-push"
	class="hs-overlay [--body-scroll:true] lg:[--overlay-backdrop:false] [--is-layout-affect:true] [--opened:lg] [--auto-close:lg] hs-overlay-open:translate-x-0 lg:hs-overlay-layout-open:translate-x-0 lg:block lg:-translate-x-full lg:end-auto lg:bottom-0 w-72 [--body-scroll:true]
hs-overlay-open:translate-x-0
-translate-x-full transition-all duration-300 transform
h-full
hidden

fixed top-0 start-0 bottom-0 z-60
bg-gradient-to-b from-white to-gray-50 border-e border-gray-200 shadow-xl dark:from-neutral-900 dark:to-neutral-800 dark:border-neutral-700"
	role="dialog"
	tabindex="-1"
	aria-label="Sidebar"
>
	<div class="relative flex flex-col h-full max-h-full">
		<!-- Header -->
		<header
			class="p-5 flex justify-between items-center border-b border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-900"
		>
			<a
				class="flex-none font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400 tracking-tight"
				href="/"
				aria-label="Brand"><img src="/tukoo.svg" class="w-24" alt="" srcset=""></a
			>

			<div class="lg:hidden">
				<!-- Close Button -->
				<button
					type="button"
					class="flex justify-center items-center size-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-400"
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
				<!-- End Close Button -->
			</div>
		</header>
		<!-- End Header -->

		<!-- Body -->
		<div class="flex flex-col h-full justify-between">
			<nav
				class="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600"
			>
				<div class="shrink-0 group block pb-0 px-4 pt-4">
					<div
						class="flex items-center gap-x-3 py-3 px-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30 shadow-sm mb-6 relative"
					>
						<div class="relative">
							<img
								class="inline-block object-cover object-center shrink-0 size-12 rounded-full ring-2 ring-white dark:ring-neutral-800"
								src={userData.profile_picture || "/profile/default.jpg"}
								alt="Avatar"
							/>
							<span class="absolute bottom-0 right-0 block size-3 rounded-full bg-green-400 ring-2 ring-white dark:ring-neutral-800"></span>
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-gray-900 dark:text-white truncate">{userData.username}</h3>
							<p class="text-xs font-medium text-gray-500 dark:text-neutral-400 truncate">{userData.email}</p>
						</div>
					</div>
				</div>

				<div class="hs-accordion-group pb-0 px-4 w-full flex flex-col flex-wrap" data-hs-accordion-always-open>
					<!-- Main Menu Label -->
					<div class="mb-3 mt-2">
						<span class="text-xs font-semibold uppercase text-gray-400 dark:text-neutral-500">Main Menu</span>
					</div>
					
					<ul class="space-y-1.5">
						<li>
							<a
								class="group flex items-center gap-x-3 py-2.5 px-3 text-sm font-medium rounded-xl transition-all duration-200 {isActive('/dashboard') ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700/50 dark:hover:text-white'}"
								href="/dashboard"
							>
								<svg
									class="size-5 transition-transform group-hover:scale-110"
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

						<li class="hs-accordion" id="users-accordion">
							<button
								type="button"
								class="group hs-accordion-toggle w-full text-start flex items-center gap-x-3 py-2.5 px-3 text-sm font-medium rounded-xl transition-all duration-200 {isActive('/dashboard/merchant') ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700/50 dark:hover:text-white'}"
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
									class="size-5 transition-transform group-hover:scale-110"
									><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5" /><path
										d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"
									/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05" /></svg
								>

								Merchant

								<svg
									class="hs-accordion-active:block ms-auto hidden size-4 transition-transform"
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
									class="hs-accordion-active:hidden ms-auto block size-4 transition-transform"
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
								<ul class="hs-accordion-group pt-2 ps-8 space-y-1.5" data-hs-accordion-always-open>
									<li>
										<a
											class="group flex items-center gap-x-3 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-200 {isActive('/dashboard/merchant/add') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-700/30 dark:hover:text-white'}"
											href="/dashboard/merchant/add"
										>
											<span class="size-1.5 rounded-full bg-current"></span>
											Add Merchant
										</a>
									</li>
									<li>
										<a
											class="group flex items-center gap-x-3 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-200 {isActive('/dashboard/merchant') && !isActive('/dashboard/merchant/add') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-700/30 dark:hover:text-white'}"
											href="/dashboard/merchant"
										>
											<span class="size-1.5 rounded-full bg-current"></span>
											List Merchant
										</a>
									</li>

									
								</ul>
							</div>
						</li>
					</ul>
					
					<!-- Account Menu Label
					<div class="mb-3 mt-6">
						<span class="text-xs font-semibold uppercase text-gray-400 dark:text-neutral-500">Account</span>
					</div> -->
					
					<ul class="space-y-1.5 mt-2">
						<li>
							<a
								href="/dashboard/subscription"
								class="group w-full text-start flex items-center gap-x-3 py-2.5 px-3 text-sm font-medium rounded-xl transition-all duration-200 {isActive('/dashboard/subscription') ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700/50 dark:hover:text-white'}"
								
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
									class="size-5 transition-transform group-hover:scale-110"
									><path d="M13 17a1 1 0 1 0-2 0l.5 4.5a0.5 0.5 0 0 0 1 0z" fill="currentColor" /><path
										d="M16.85 18.58a9 9 0 1 0-9.7 0"
									/><path d="M8 14a5 5 0 1 1 8 0" /><circle cx="12" cy="11" r="1" fill="currentColor" /></svg
								>
								Subscription
							</a>
						</li>

						<li>
							<a
								class="group w-full flex items-center gap-x-3 py-2.5 px-3 text-sm font-medium rounded-xl transition-all duration-200 {isActive('/dashboard/settings') ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700/50 dark:hover:text-white'}"
								href="/dashboard/settings"
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
									class="size-5 transition-transform group-hover:scale-110"
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

		<form method="POST" class="p-4 border-t border-gray-200 dark:border-neutral-700">
			<button
				class="group w-full flex items-center gap-x-3 py-2.5 px-3 text-sm font-medium text-red-600 rounded-xl bg-red-50 hover:bg-red-100 focus:outline-hidden dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-all duration-200"
				formaction="/dashboard?/logout"
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
					class="size-5 transition-transform group-hover:translate-x-0.5"
					><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg
				>
				Sign Out
			</button>
		</form>
	</div>
</div>
<!-- End Sidebar -->
