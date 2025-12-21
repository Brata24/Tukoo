<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData } from "./$types";

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();
</script>

<div class="px-12 w-full">
	<div class="gap-y-2">
		<h1 class="text-2xl font-bold">Forgot your password?</h1>
		<p class="mb-4">Enter your email to reset your password</p>
	</div>
	<form method="post" use:enhance action="?/forgot-psw" class="w-full space-y-4 max-w-xl">
		

		<div>
			<label for="hs-leading-icon" class="block text-sm font-medium mb-2 dark:text-white">Email address</label>
			<div class="relative">
				<input
					type="email"
					id="form-forgot.email"
					name="email"
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

		<button
			type="submit"
			class="py-2 w-full max-w-xl justify-center px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#2941cc] text-white hover:bg-[#303a72] focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
		>
			Send
		</button>
		<p class="mt-2 text-sm text-red-600">{form?.message ?? ""}</p>
	</form>
	<div class="mt-4 text-sm space-y-1">
		<p>Remembered your password? <a href="/auth/login" class="text-blue-600 hover:text-blue-500 decoration-2 hover:underline focus:outline-hidden focus:underline opacity-90">Sign in</a></p>
		<p>Not your account? <a href="/auth/login" class="text-blue-600 hover:text-blue-500 decoration-2 hover:underline focus:outline-hidden focus:underline opacity-90">Sign in again</a></p>
	</div>
</div>
