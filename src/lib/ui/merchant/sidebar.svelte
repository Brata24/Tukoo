<script lang="ts">
	import { page } from "$app/stores";

	interface UserData {
		username: string;
		email: string;
		profile_picture: string;
		merchant_name?: string;
		merchant_logo?: string;
		merchant_slogan?: string;
		merchant_uuid?: string;
	}

	let userData: UserData = $props();

	function isActive(path: string): boolean {
		const currentPath = $page.url.pathname;

		if (path.endsWith("/dashboard/merchant/")) {
			return currentPath.match(/\/dashboard\/merchant\/[^\/]+\/?$/) !== null;
		}
		return currentPath.includes(path);
	}
</script>

<!-- Sidebar -->
<div
	id="hs-sidebar-content-push"
	class="hs-overlay lg:[--overlay-backdrop:false] [--is-layout-affect:true] [--opened:lg] [--auto-close:lg] hs-overlay-open:translate-x-0 lg:hs-overlay-layout-open:translate-x-0 lg:block lg:-translate-x-full lg:end-auto lg:bottom-0 w-72 [--body-scroll:true] -translate-x-full transition-all duration-300 transform h-full hidden fixed top-0 start-0 bottom-0 z-60 bg-gradient-to-b from-white to-gray-50 border-e border-gray-200 shadow-xl dark:from-neutral-900 dark:to-neutral-800 dark:border-neutral-700"
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
				class="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
			>
				<!-- User Profile Card -->
				<div class="p-4">
					<div
						class="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm hover:shadow-md transition-shadow dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-900/50"
					>
						<div class="relative">
							<img
								class="inline-block object-cover object-center shrink-0 size-12 rounded-full ring-2 ring-white dark:ring-neutral-800"
								src={userData.profile_picture || "/profile/default.jpg"}
								alt="Avatar"
							/>
							<span
								class="absolute bottom-0 right-0 block size-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-neutral-800"
							></span>
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-gray-900 dark:text-white truncate">{userData.username}</h3>
							<p class="text-xs text-gray-600 dark:text-neutral-400 truncate">{userData.email}</p>
						</div>
					</div>
				</div>

				<!-- Merchant Info -->
				<div class="px-4 pb-3">
					<p class="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-neutral-400">
						Current Merchant
					</p>
					<div
						class="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-800 dark:border-neutral-700"
					>
						<img
							class="inline-block object-cover object-center shrink-0 size-11 rounded-lg border border-gray-200 dark:border-neutral-700"
							src={userData.merchant_logo || "/profile/default.jpg"}
							alt="Merchant Logo"
						/>
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-gray-900 dark:text-white truncate">{userData.merchant_name}</h3>
							<p class="text-xs text-gray-600 dark:text-neutral-400 truncate">{userData.merchant_slogan}</p>
						</div>
					</div>
				</div>

				<div
					class="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-neutral-700 mx-4 my-2"
				></div>

				<!-- Navigation Menu -->
				<div class="hs-accordion-group px-4 pb-4 w-full flex flex-col" data-hs-accordion-always-open>
					<p class="px-2 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-neutral-400">
						Menu
					</p>
					<ul class="space-y-1.5">
						<li>
							<a
								class="group flex items-center gap-3 py-2.5 px-3 text-sm font-medium rounded-xl transition-all duration-200 {isActive(
									'/dashboard/merchant/'
								) &&
								!isActive('/user') &&
								!isActive('/banner') &&
								!isActive('/report') &&
								!isActive('/settings')
									? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30'
									: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700/50 dark:hover:text-white'}"
								href="/dashboard/merchant/{userData.merchant_uuid}"
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
								<span>Dashboard</span>
							</a>
						</li>

						<li class="hs-accordion" id="users-accordion">
							<button
								type="button"
								class="hs-accordion-toggle group w-full text-start flex items-center gap-3 py-2.5 px-3 text-sm font-medium rounded-xl transition-all duration-200 {isActive(
									'/user'
								)
									? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30'
									: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700/50 dark:hover:text-white'}"
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
									><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg
								>

								<span class="flex-1">Users</span>

								<svg
									class="hs-accordion-active:rotate-180 ms-auto size-4 transition-transform duration-300"
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
								<ul class="hs-accordion-group pt-2 ps-8 space-y-1" data-hs-accordion-always-open>
									<li>
										<a
											class="group flex items-center gap-2 py-2 px-3 text-sm rounded-lg transition-all duration-200 {isActive(
												'/user/add'
											)
												? 'text-blue-600 font-medium dark:text-blue-400'
												: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/50'}"
											href="/dashboard/merchant/{userData.merchant_uuid}/user/add"
										>
											<span class="size-1.5 rounded-full bg-current"></span>
											<span>Add User</span>
										</a>
									</li>
									<li>
										<a
											class="group flex items-center gap-2 py-2 px-3 text-sm rounded-lg transition-all duration-200 {isActive(
												'/user'
											) && !isActive('/user/add')
												? 'text-blue-600 font-medium dark:text-blue-400'
												: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/50'}"
											href="/dashboard/merchant/{userData.merchant_uuid}/user"
										>
											<span class="size-1.5 rounded-full bg-current"></span>
											<span>List Users</span>
										</a>
									</li>
								</ul>
							</div>
						</li>
						<li>
							<a
								href="/dashboard/merchant/{userData.merchant_uuid}/banner"
								class="group flex items-center gap-3 py-2.5 px-3 text-sm font-medium rounded-xl transition-all duration-200 {isActive(
									'/banner'
								)
									? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30'
									: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700/50 dark:hover:text-white'}"
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
									><path d="M3 2h18" /><rect width="18" height="12" x="3" y="6" rx="2" /><path d="M3 22h18" /></svg
								>
								<span>Banners</span>
							</a>
						</li>

						<li>
							<a
								href="/dashboard/merchant/{userData.merchant_uuid}/report"
								class="group flex items-center gap-3 py-2.5 px-3 text-sm font-medium rounded-xl transition-all duration-200 {isActive(
									'/report'
								)
									? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30'
									: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700/50 dark:hover:text-white'}"
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
									><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path
										d="M14 2v4a2 2 0 0 0 2 2h4"
									/><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg
								>
								<span>Reports</span>
							</a>
						</li>

						<li>
							<a
								class="group flex items-center gap-3 py-2.5 px-3 text-sm font-medium rounded-xl transition-all duration-200 {isActive(
									'/settings'
								)
									? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30'
									: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700/50 dark:hover:text-white'}"
								href="/dashboard/merchant/{userData.merchant_uuid}/settings"
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
								<span>Settings</span>
							</a>
						</li>
					</ul>
				</div>
			</nav>
		</div>

		<!-- End Body -->

		<!-- Logout Button -->
		<div class="p-4 border-t border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">

				<a
					class="group w-full flex items-center gap-3 py-3 px-4 text-sm font-medium text-red-600 rounded-xl bg-red-50 hover:bg-red-100 hover:shadow-md transition-all duration-200 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
					href="/dashboard"
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
						><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg
					>
					
					<span class="flex-1 text-left"> Back To Main</span>
			</a>
		
		</div>
	</div>
</div>
<!-- End Sidebar -->
