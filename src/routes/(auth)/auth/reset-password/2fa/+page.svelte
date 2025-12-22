<script lang="ts">
	import { enhance } from "$app/forms";
	import { onMount } from "svelte";

	import type { ActionData } from "./$types";

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();
	
	let formElement: HTMLFormElement | null = $state(null);
	let showRecoveryCode = $state(false);

	onMount(() => {
		window.HSPinInput.autoInit();
		
		const el = window.HSPinInput.getInstance('#pin-input');
		if (el) {
			el.on('completed', ({ currentValue } : { currentValue: string[] }) => {
				const code = currentValue.join('');
				if (formElement) {
					const input = document.createElement('input');
					input.type = 'hidden';
					input.name = 'code';
					input.value = code;
					formElement.appendChild(input);
					formElement.submit();
				}
			});
		}
	});
</script>

<div class="px-12 w-full">
	{#if !showRecoveryCode}
		<h1 class="text-2xl font-bold">Two-factor authentication</h1>
		<p class="mb-4">Keep your account safer — secure your login with a quick verification step.</p>
		
		<form method="post" action="?/totp" bind:this={formElement} use:enhance>
			<label for="form-totp.code">Enter the code from your authenticator app : </label>
			<div class="flex gap-x-2 mt-4" id="pin-input" data-hs-pin-input="">
				<input
					type="text"
					class="block border size-11 text-center border-gray-200 rounded-md sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					data-hs-pin-input-item=""
					autofocus
				/>
				<input
					type="text"
					class="block border size-11 text-center border-gray-200 rounded-md sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					data-hs-pin-input-item=""
				/>
				<input
					type="text"
					class="block border size-11 text-center border-gray-200 rounded-md sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					data-hs-pin-input-item=""
				/>
				<span class="text-2xl">-</span>
				<input
					type="text"
					class="block border size-11 text-center border-gray-200 rounded-md sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					data-hs-pin-input-item=""
				/>
				<input
					type="text"
					class="block border size-11 text-center border-gray-200 rounded-md sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					data-hs-pin-input-item=""
				/>
				<input
					type="text"
					class="block border size-11 text-center border-gray-200 rounded-md sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					data-hs-pin-input-item=""
				/>
			</div>
			<p class="mt-2 text-sm text-red-600">{form?.totp?.message ?? ""}</p>
		</form>
		<p class="mt-4">Forgot the key? <button type="button" onclick={() => showRecoveryCode = true} class="text-blue-600 hover:text-blue-500 decoration-2 hover:underline focus:outline-hidden focus:underline opacity-90">Use recovery code</button></p>
	{:else}
		<h1 class="text-2xl font-bold">Recover your account</h1>
		<p class="mb-4">Lost access? Use the key you saved before to get back into your account.</p>
		<form method="post" action="?/recovery_code" use:enhance>
			<div class="w-full max-w-md">
				<label for="recovery-code-input" class="sr-only">Recovery code</label>
				<div class="relative flex rounded-lg">
					<input
						name="code"
						type="text"
						id="recovery-code-input"
						placeholder="Enter your recovery code"
						class="py-2.5 sm:py-3 px-4 ps-11 block w-full border border-gray-200 rounded-s-lg sm:text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
						autofocus
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
							class="shrink-0 size-4 text-gray-400 dark:text-neutral-500"
							><path
								d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
							/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor" /></svg
						>
					</div>
					<button
						type="submit"
						class="py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-e-md border border-transparent text-white bg-[#2941cc] hover:bg-[#303a72] focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
						>Verify</button
					>
				</div>
			</div>
			<p class="mt-2 text-sm text-red-600">{form?.recoveryCode?.message ?? ""}</p>
		</form>
		<p class="mt-4">Remember your code? <button type="button" onclick={() => showRecoveryCode = false} class="text-blue-600 hover:text-blue-500 decoration-2 hover:underline focus:outline-hidden focus:underline opacity-90">Use authenticator app</button></p>
	{/if}
</div>

