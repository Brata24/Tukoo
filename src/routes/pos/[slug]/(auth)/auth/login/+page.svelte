<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData } from "./$types";

	interface Props {
		form: ActionData;
		data: any;
	}

	let { form, data }: Props = $props();
	
	// Store colors in state to ensure they're loaded
	let secondaryColor = $state(data.merchant?.secondaryColor || '#2941cc');
	let secondaryTextColor = $state(data.merchant?.secondaryTextColor || '#ffffff');
	let logo = $state(data.merchant?.logo || '');
	let merchantName = $state(data.merchant?.name || 'POS');
	
	// Update when data changes
	$effect(() => {
		if (data.merchant) {
			secondaryColor = data.merchant?.secondaryColor || '#2941cc';
			secondaryTextColor = data.merchant?.secondaryTextColor || '#ffffff';
			logo = data.merchant.logo || '';
			merchantName = data.merchant.name || 'POS';
		}
	});
</script>

<div class="px-12 w-full">
	
	{#if logo}
		<img src={logo} class="size-16 mb-4" alt="Logo Merchant">
	{/if}
	<h1 class="text-2xl font-bold">Sign in</h1>
	<p class="mb-4">Sign in to access the POS {merchantName}</p>
	<form method="post" use:enhance class="w-full space-y-4">
		<div class="max-w-xl">
			<label for="hs-leading-icon" class="block text-sm font-medium mb-2 dark:text-white">Username</label>
			<div class="relative">
				<input
					type="text"
					id="form-login.username"
					name="username"
					autocomplete="username"
					value={form?.username ?? ""}
					required
					class="py-2.5 border sm:py-3 px-4 ps-11 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="Enter your username"
				/>
				<div class="absolute inset-y-0 start-0 flex items-center pointer-events-none z-20 ps-4">
					<svg
						class="shrink-0 size-4 text-gray-400 dark:text-neutral-600"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
						<circle cx="12" cy="7" r="4"></circle>
					</svg>
				</div>
			</div>
		</div>		<div class="max-w-xl">
			<label for="hs-leading-icon" class="block text-sm font-medium mb-2 dark:text-white">Password</label>
			<div class="relative">
				<input
					type="password"
					id="form-login.password"
					name="password"
					autocomplete="current-password"
					required
					class="py-2.5 border sm:py-3 px-4 ps-11 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="••••••••"
				/>
				<div class="absolute inset-y-0 start-0 flex items-center pointer-events-none z-20 ps-4">
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
						class="shrink-0 size-4 text-gray-400 dark:text-neutral-600"
						><path
							d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
						/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor" /></svg
					>
				</div>
			</div>
		</div>

		<button
			type="submit"
			style="background-color: {secondaryColor}; color: {secondaryTextColor};"
			class="py-2 w-full max-w-xl justify-center px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent hover:opacity-80 focus:outline-hidden focus:opacity-80 disabled:opacity-50 disabled:pointer-events-none"
		>
			Sign In
		</button>
		<p class="mt-2 text-sm text-red-600">{form?.message ?? ""}</p>
	</form>
	
	
	
</div>
