<script lang="ts">
	import { enhance } from "$app/forms";
	import { onMount } from "svelte";

	import type { ActionData, PageData } from "./$types";

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();
	let formElement: HTMLFormElement | null = $state(null);

	onMount(() => {
		window.HSPinInput.autoInit();
		console.log(window);
		const el = window.HSPinInput.getInstance("#pin-input");
		console.log(el);
		el.on("completed", ({ currentValue }: { currentValue: string[] }) => {
			const code = currentValue.join("");
			console.log(code);
			if (formElement) {
				const input = document.createElement("input");
				input.type = "hidden";
				input.name = "code";
				input.value = code;
				formElement.appendChild(input);
				formElement.submit();
			}
		});
	});
</script>

<div class="px-4 sm:px-8 md:px-12 w-full max-w-2xl mx-auto">
	<h1 class="text-xl sm:text-2xl font-bold">Verify your email address</h1>
	<p class="mb-2 text-sm sm:text-base text-gray-700">We sent an 8-digit code to <strong>{data.email}</strong>.</p>
	<p class="text-xs sm:text-sm ">
		<strong>Can't find the email?</strong> Please check your spam or junk folder.
	</p>

	<form bind:this={formElement} method="post" use:enhance action="?/verify" class="my-4">
		<div class="flex gap-x-2 sm:gap-x-3 justify-center sm:justify-start" id="pin-input" data-hs-pin-input="">
			<input
				type="text"
				name="code1"
				class="block border size-9 sm:size-11 text-center border-gray-200 rounded-md text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
				data-hs-pin-input-item=""
				autofocus
			/>
			<input
				type="text"
				name="code2"
				class="block size-9 border sm:size-11 text-center border-gray-200 rounded-md text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
				data-hs-pin-input-item=""
			/>
			<input
				type="text"
				name="code3"
				class="block size-9 border sm:size-11 text-center border-gray-200 rounded-md text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
				data-hs-pin-input-item=""
			/>
			<input
				type="text"
				name="code4"
				class="block size-9 border sm:size-11 text-center border-gray-200 rounded-md text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
				data-hs-pin-input-item=""
			/>
			<span class="text-2xl">-</span>
			<input
				type="text"
				name="code5"
				class="block size-9 border sm:size-11 text-center border-gray-200 rounded-md text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
				data-hs-pin-input-item=""
			/>
			<input
				type="text"
				name="code6"
				class="block size-9 border sm:size-11 text-center border-gray-200 rounded-md text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
				data-hs-pin-input-item=""
			/>
			<input
				type="text"
				name="code7"
				class="block size-9 border sm:size-11 text-center border-gray-200 rounded-md text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
				data-hs-pin-input-item=""
			/>
			<input
				type="text"
				name="code8"
				class="block size-9 border sm:size-11 text-center border-gray-200 rounded-md text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
				data-hs-pin-input-item=""
			/>
		</div>
		{#if form?.verify?.message}
			<p class="text-red-600 mt-2 text-sm sm:text-base">{form.verify.message}</p>
		{/if}
	</form>

	<div class="mt-6 text-center sm:text-left">
		<form method="post" use:enhance action="?/resend" class="inline">
			<p class="inline-block text-sm sm:text-base text-gray-600">Not receiving the email?</p>
			<button
				class="text-blue-600 hover:text-blue-500 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium text-sm sm:text-base"
				>Resend code</button
			>
		</form>

		{#if form?.resend?.message}
			<p class="text-green-600 mt-2 text-sm sm:text-base">{form.resend.message}</p>
		{/if}
	</div>
</div>
