<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData } from "./$types";

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();
</script>

<div class="px-6 sm:px-8 md:px-12 lg:px-16 w-full py-8">
	<img src="/tukoo.svg" class="w-20 sm:w-24 md:w-28 mb-4" alt="Tukoo Logo">
	<h1 class="text-xl sm:text-2xl md:text-3xl font-bold">Reset Password</h1>
	<p class="mb-4 text-sm sm:text-base text-gray-600">Enter your new password to secure your account</p>
	
	<form method="post" action="?/reset-psw" use:enhance class="w-full max-w-xl space-y-4">
		<div>
			<label for="form-reset.password" class="block text-sm font-medium mb-2 dark:text-white">New Password</label>
			<div class="relative">
				<input
					type="password"
					placeholder="••••••••"
					id="form-reset.password"
					name="password"
					autocomplete="new-password"
					required
					class="py-2.5 sm:py-3 px-4 ps-11 block w-full border border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
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
					>
						<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
						<circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
					</svg>
				</div>
			</div>
			<p class="mt-2 text-sm text-gray-500 dark:text-neutral-500">
				Choose a strong password with at least 8 characters
			</p>
		</div>

		<button
			type="submit"
			class="py-2.5 sm:py-3 w-full justify-center px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent text-white bg-[#2941cc] hover:bg-[#303a72] focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
		>
			Reset Password
		</button>
		
		{#if form?.message}
			<p class="mt-2 text-sm text-red-600">{form.message}</p>
		{/if}
	</form>
	
	<div class="mt-6 max-w-xl">
		<p class="text-sm text-gray-600">
			Remember your password? 
			<a href="/auth/login" class="text-blue-600 hover:text-blue-800 font-medium hover:underline">
				Sign in here
			</a>
		</p>
	</div>
</div>
