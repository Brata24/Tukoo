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
	<h1 class="text-xl sm:text-2xl md:text-3xl font-bold">Sign in</h1>
	<p class="mb-4 text-sm sm:text-base text-gray-600">Sign in to access and manage Tukoo's systems</p>
	<form method="post" use:enhance class="w-full space-y-4">
		<div class="max-w-xl">
			<label for="hs-leading-icon" class="block text-sm font-medium mb-2 dark:text-white">Email address</label>
			<div class="relative">
				<input
					type="email"
					id="form-login.email"
					name="email"
					autocomplete="email"
					value={form?.email ?? ""}
					required
					class="py-2.5 border sm:py-3 px-4 ps-11 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="you@site.com"
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
						<rect width="20" height="16" x="2" y="4" rx="2"></rect>
						<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
					</svg>
				</div>
			</div>
		</div>

		<div class="max-w-xl">
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
			class="py-2 w-full max-w-xl justify-center px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent  text-white bg-[#2941cc] hover:bg-[#303a72] focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
		>
			Sign In
		</button>
		<p class="mt-2 text-sm text-red-600">{form?.message ?? ""}</p>
	</form>
	<div
		class="py-3 flex max-w-xl items-center text-sm text-gray-800 before:flex-1 before:border-t before:border-gray-200 before:me-6 after:flex-1 after:border-t after:border-gray-200 after:ms-6 dark:text-white dark:before:border-neutral-600 dark:after:border-neutral-600"
	>
		Or
	</div>
	<button
		type="button"
		class="py-2.5 sm:py-3 w-full max-w-xl justify-center px-3 inline-flex items-center gap-x-2 text-sm border-gray-200 font-medium rounded-lg border hover:bg-[#eaebed] focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
	>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="shrink-0 size-4 "
			><defs
				><radialGradient
					id="prefix__b"
					cx="1.479"
					cy="12.788"
					fx="1.479"
					fy="12.788"
					r="9.655"
					gradientTransform="matrix(.8032 0 0 1.0842 2.459 -.293)"
					gradientUnits="userSpaceOnUse"
					><stop offset=".368" stop-color="#ffcf09" /><stop offset=".718" stop-color="#ffcf09" stop-opacity=".7" /><stop
						offset="1"
						stop-color="#ffcf09"
						stop-opacity="0"
					/></radialGradient
				><radialGradient
					id="prefix__c"
					cx="14.295"
					cy="23.291"
					fx="14.295"
					fy="23.291"
					r="11.878"
					gradientTransform="matrix(1.3272 0 0 1.0073 -3.434 -.672)"
					gradientUnits="userSpaceOnUse"
					><stop offset=".383" stop-color="#34a853" /><stop offset=".706" stop-color="#34a853" stop-opacity=".7" /><stop
						offset="1"
						stop-color="#34a853"
						stop-opacity="0"
					/></radialGradient
				><linearGradient id="prefix__d" x1="23.558" y1="6.286" x2="12.148" y2="20.299" gradientUnits="userSpaceOnUse"
					><stop offset=".671" stop-color="#4285f4" /><stop
						offset=".885"
						stop-color="#4285f4"
						stop-opacity="0"
					/></linearGradient
				><clipPath id="prefix__a"
					><path
						d="M22.36 10H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53h-.013l.013-.01c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09c.87-2.6 3.3-4.53 6.16-4.53 1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07 1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93v.01C3.99 20.53 7.7 23 12 23c2.97 0 5.46-.98 7.28-2.66 2.08-1.92 3.28-4.74 3.28-8.09 0-.78-.07-1.53-.2-2.25z"
						fill="none"
					/></clipPath
				></defs
			><path
				d="M22.36 10H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53h-.013l.013-.01c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09c.87-2.6 3.3-4.53 6.16-4.53 1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07 1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93v.01C3.99 20.53 7.7 23 12 23c2.97 0 5.46-.98 7.28-2.66 2.08-1.92 3.28-4.74 3.28-8.09 0-.78-.07-1.53-.2-2.25z"
				fill="#fc4c53"
			/><g clip-path="url(#prefix__a)"
				><ellipse cx="3.646" cy="13.572" rx="7.755" ry="10.469" fill="url(#prefix__b)" /><ellipse
					cx="15.538"
					cy="22.789"
					rx="15.765"
					ry="11.965"
					transform="rotate(-7.12 15.539 22.789)"
					fill="url(#prefix__c)"
				/><path fill="url(#prefix__d)" d="M11.105 8.28l.491 5.596.623 3.747 7.362 6.848 8.607-15.897-17.083-.294z" /></g
			></svg
		>
		Sign In with Google
	</button>
	<div class="mt-4 text-sm space-y-1">
		<p>Don’t have an account? <a href="/auth/signup" class="text-blue-600 hover:text-blue-500 decoration-2 hover:underline focus:outline-hidden focus:underline opacity-90">Create one now</a></p>
		<p>Forgot your password? <a href="/auth/forgot-password" class="text-blue-600 hover:text-blue-500 decoration-2 hover:underline focus:outline-hidden focus:underline opacity-90">Reset it here</a></p>
	</div>
</div>
