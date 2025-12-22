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
	<h1 class="text-xl sm:text-2xl md:text-3xl font-bold">Create an account</h1>
	<p class="mb-4 text-sm sm:text-base text-gray-600">Join us in just a few steps and start managing your sales with ease.</p>
	<form method="post" use:enhance class="w-full max-w-xl space-y-4">
		<div>
			<label for="input-label-with-helper-text" class="block text-sm font-medium mb-2 dark:text-white">Full Name</label>
			<input
				value={form?.username ?? ""}
				required
				id="form-signup.fullname"
				name="fullname"
				maxlength="50"
				type="text"
				class="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				placeholder="Pandia Arya"
				aria-describedby="hs-input-helper-text"
			/>
		</div>

		<div>
			<label for="input-label-with-helper-text" class="block text-sm font-medium mb-2 dark:text-white">Username</label>
			<input
				value={form?.username ?? ""}
				required
				id="form-signup.username"
				name="username"
				minlength="4"
				maxlength="31"
				type="text"
				class="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				placeholder="dcat"
				aria-describedby="hs-input-helper-text"
			/>
			<p class="mt-2 text-sm text-gray-500 dark:text-neutral-500" id="hs-input-helper-text">
				Your username must be at least 3 characters without @
			</p>
		</div>

		<div>
			<label for="form-signup.email" class="block text-sm font-medium mb-2 dark:text-white">Email</label>
			<input
				type="email"
				value={form?.email ?? ""}
				required
				id="form-signup.email"
				name="email"
				class="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				placeholder="example@email.com"
				aria-describedby="hs-input-helper-text"
			/>
		</div>

		<div>
			<label for="form-signup.phone" class="block text-sm font-medium mb-2 dark:text-white">Phone</label>
			<div class="relative">
				<input
					type="tel"
					id="form-signup.phone"
					name="phone"
					class="py-2.5 sm:py-3 px-4 ps-16 block w-full border border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="8516666666"
				/>
				<div class="absolute inset-y-0 start-0 flex items-center pointer-events-none z-20 ps-4">
					<span class="text-sm text-gray-500 dark:text-neutral-500">+62</span>
				</div>
			</div>
		</div>

		<div>
			<label for="form-signup.password" class="block text-sm font-medium mb-2 dark:text-white">Password</label>
			<input
				type="password"
				value=""
				required
				id="form-signup.password"
				name="password"
				class="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				placeholder="Type your password"
				aria-describedby="hs-input-helper-text"
			/>
			<p class="mt-2 text-sm text-gray-500 dark:text-neutral-500" id="hs-input-helper-text">
				Your password must be at least 8 characters long.
			</p>
		</div>

		<button
			type="submit"
			class="py-2 w-full max-w-xl justify-center px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#2941cc] text-white hover:bg-[#303a72] focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
		>
			Create Account
		</button>
		<p class="mt-2 text-sm text-red-600">{form?.message ?? ""}</p>
	</form>
	<div class="mt-4 text-sm space-y-1">
		<p>
			Already have an account? <a
				href="/auth/login"
				class="text-blue-600 hover:text-blue-500 decoration-2 hover:underline focus:outline-hidden focus:underline opacity-90"
				>Sign in</a
			>
		</p>
	</div>
</div>
