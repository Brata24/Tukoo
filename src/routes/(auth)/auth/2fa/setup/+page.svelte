<script lang="ts">
	import { enhance } from "$app/forms";
	import { onMount } from "svelte";

	import type { ActionData, PageData } from "./$types";

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let formElement: HTMLFormElement | null = $state(null);

	onMount(() => {
		window.HSPinInput.autoInit();
	
		const el = window.HSPinInput.getInstance('#pin-input');
		console.log(el);
		el.on('completed', ({ currentValue }) => {
			const code = currentValue.join('');
			console.log(code);
			if (formElement) {
				const input = document.createElement('input');
				input.type = 'hidden';
				input.name = 'code';
				input.value = code;
				formElement.appendChild(input);
				formElement.submit();
			}
		});
	})

	let { data, form }: Props = $props();
</script>

<div class="px-12 w-full">
	<h1 class="text-2xl font-bold">Set up two-factor authentication</h1>
	<p class="mb-4">Keep your account safer — secure your login with a quick verification step.</p>
	
	<div  class="w-52 h-52 border p-4 border-gray-200 rounded-md mb-4">
		{@html data.qrcode}
	</div>
	<form method="post" action="?/verify" bind:this={formElement} use:enhance>
		<input name="key" value={data.encodedTOTPKey} hidden required />
		<label for="form-totp.code">Input the code that shown from the app : </label>
		<div class="flex gap-x-2 mt-4" id="pin-input" data-hs-pin-input="">
			<input
				type="text"
				class="block border size-11 text-center border-gray-200 rounded-md sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				data-hs-pin-input-item=""
				autofocus=""
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

		<p class="mt-2 text-sm text-red-600">{form?.message ?? ""}</p>
		<p class="mt-4">Don't have time to do this ? <button formaction="?/skip-2fa" class="text-blue-600 hover:text-blue-500 decoration-2 hover:underline focus:outline-hidden focus:underline opacity-90">Set Up Later</button></p>
	</form>
			

</div>
