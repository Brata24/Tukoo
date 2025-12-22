<script lang="ts">
	import { enhance, applyAction } from "$app/forms";
	import { goto } from "$app/navigation";
	import { toast } from "$lib/stores/toast.js";
	import { redirect } from "@sveltejs/kit";

	let { form, data } = $props();

	// Function to preview selected logo
	function previewLogo(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			const reader = new FileReader();

			reader.onload = function (e) {
				const imgElement = document.querySelector('img[alt="Logo Preview"]') as HTMLImageElement;
				if (imgElement && e.target?.result) {
					imgElement.src = e.target.result as string;
				}
			};

			reader.readAsDataURL(file);
		}
	}

	// Function to update color text input when color picker changes
	function updateColorText(event: Event, textInputId: string) {
		const colorInput = event.currentTarget as HTMLInputElement;
		const textInput = document.getElementById(textInputId) as HTMLInputElement;
		if (textInput) {
			textInput.value = colorInput.value;
		}
	}

	// Function to generate slug from text
	function generateSlug(text: string): string {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/[\s-]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	// Function to update slug when merchant name changes
	function updateSlugFromName(event: Event) {
		const nameInput = event.currentTarget as HTMLInputElement;
		const slugInput = document.getElementById("merchant-slug") as HTMLInputElement;

		if (slugInput && nameInput.value) {
			const generatedSlug = generateSlug(nameInput.value);
			slugInput.value = generatedSlug;
			// Trigger validation
			validateSlug(slugInput);
		}
	}

	// Function to validate subdomain format
	function validateSlug(input: HTMLInputElement) {
		const slug = input.value;

		const isValid = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length > 0 && slug.length <= 63;

		if (slug && !isValid) {
			if (slug.length > 50) {
				input.setCustomValidity("Subdomain cannot exceed 50 characters (DNS limitation).");
			} else if (slug.startsWith("-") || slug.endsWith("-")) {
				input.setCustomValidity("Subdomain must start and end with alphanumeric characters.");
			} else if (!/^[a-z0-9-]+$/.test(slug)) {
				input.setCustomValidity("Subdomain can only contain lowercase letters, numbers, and hyphens.");
			} else {
				input.setCustomValidity("Invalid subdomain format.");
			}
		} else {
			input.setCustomValidity("");
		}
	}

	// Function to handle manual slug editing
	function handleSlugInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		// Auto-format the slug as user types
		const formattedSlug = generateSlug(input.value);
		if (formattedSlug !== input.value) {
			input.value = formattedSlug;
		}
		validateSlug(input);
	}
</script>

<div class="m-4">
	<div class="mb-8">
		<h2 class="text-2xl font-semibold">Add Merchant</h2>
		<p class="text-sm text-gray-600 dark:text-neutral-400">Fill in the details below to add a new merchant.</p>
	</div>

	<!-- Store Limit Warning -->
	{#if !data.subscription.canCreate}
		<div class="mb-6 bg-red-50 border border-red-200 text-sm text-red-800 rounded-lg p-4 dark:bg-red-800/10 dark:border-red-900 dark:text-red-500" role="alert">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="flex-shrink-0 h-4 w-4 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
				</div>
				<div class="ms-3">
					<h3 class="text-sm font-semibold">Store Creation Limit Reached</h3>
					<div class="mt-2 text-sm text-red-700 dark:text-red-400">
						You have reached your store limit ({data.subscription.currentStores}/{data.subscription.maxStores} stores on {data.subscription.planName} plan).
						<a href="/dashboard/subscription" class="font-semibold underline hover:decoration-2">Upgrade your subscription</a> to create more stores.
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="mb-6 bg-blue-50 border border-blue-200 text-sm text-blue-800 rounded-lg p-4 dark:bg-blue-800/10 dark:border-blue-900 dark:text-blue-500" role="alert">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="flex-shrink-0 h-4 w-4 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<path d="M12 16v-4"></path>
						<path d="M12 8h.01"></path>
					</svg>
				</div>
			<div class="ms-3">
				<span class="text-sm">
					You can create {data.subscription?.maxStores === -1 ? 'unlimited' : `${(data.subscription?.maxStores || 0) - (data.subscription?.currentStores || 0)} more`} store{data.subscription?.maxStores !== -1 && (data.subscription?.maxStores || 0) - (data.subscription?.currentStores || 0) !== 1 ? 's' : ''} 
					({data.subscription?.currentStores || 0}/{data.subscription?.maxStores === -1 ? '∞' : data.subscription?.maxStores} on {data.subscription?.planName} plan).
				</span>
			</div>
			</div>
		</div>
	{/if}

	<div class="bg-white w-full h-fit rounded-xl shadow-xs p-6 dark:bg-neutral-800">
		<form
			method="POST"
			action="?/add-merchant"
			enctype="multipart/form-data"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === "success") {
						toast.success("Merchant added successfully!");

						// Navigate to merchant dashboard
						goto("/dashboard/merchant");
					} else if (result.type === "failure") {
						toast.error((result.data as any)?.message || "Failed to add merchant");
					}
					await applyAction(result);
				};
			}}
			class="space-y-6"
		>
			<fieldset disabled={!data.subscription.canCreate}>
			<!-- Nama Merchant -->
			<div>
				<label for="merchant-name" class="block text-sm font-medium mb-2 dark:text-white">
					Nama Merchant <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="merchant-name"
					name="merchantName"
					required
					maxlength="100"
					disabled={!data.subscription.canCreate}
					onchange={updateSlugFromName}
					oninput={updateSlugFromName}
					class="py-3 px-4 block border w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="Masukkan nama merchant"
				/>
			</div>

			<!-- Slug Merchant -->
			<div>
				<label for="merchant-slug" class="block text-sm font-medium mb-2 dark:text-white">
					Subdomain Merchant <span class="text-red-500">*</span>
				</label>
				<div class="relative">
					<input
						type="text"
						id="merchant-slug"
						name="merchantSlug"
						required
						maxlength="63"
						pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
						oninput={handleSlugInput}
						class="py-3 px-4 pr-32 block border w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
						placeholder="my-merchant"
					/>
					<div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
						<span class="text-gray-500 text-sm dark:text-neutral-400">.tukoo.web.id</span>
					</div>
				</div>
				<p class="mt-1 text-xs text-gray-500 dark:text-neutral-400">
					Subdomain unik untuk merchant (contoh: <code class="text-blue-600 dark:text-blue-400"
						>my-merchant.tukoo.web.id</code
					>). Otomatis dihasilkan dari nama, tapi bisa diedit.
				</p>
				<p class="mt-1 text-xs text-gray-400 dark:text-neutral-500">
					Hanya huruf kecil, angka, dan tanda hubung. Maksimal 63 karakter.
				</p>
			</div>

			<!-- Alamat Merchant -->
			<div>
				<label for="merchant-address" class="block text-sm font-medium mb-2 dark:text-white">
					Alamat Merchant <span class="text-red-500">*</span>
				</label>
				<textarea
					id="merchant-address"
					name="merchantAddress"
					required
					rows="4"
					maxlength="500"
					class="py-3 px-4 block border w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="Masukkan alamat lengkap merchant"
				></textarea>
			</div>

			<!-- Logo Merchant -->
			<div>
				<label for="merchant-logo" class="block text-sm font-medium mb-2 dark:text-white"> Logo Merchant </label>
				<div class="flex items-start space-x-4">
					<div class="flex-shrink-0">
						<img
							alt="Logo Preview"
							src="data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23f3f4f6'/%3e%3ctext x='50' y='50' font-size='12' text-anchor='middle' dy='.3em' fill='%236b7280'%3eLogo%3c/text%3e%3c/svg%3e"
							class="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-neutral-700"
						/>
					</div>
					<div class="flex-1">
						<input
							type="file"
							id="merchant-logo"
							name="merchantLogo"
							accept="image/*"
							onchange={previewLogo}
							class="block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:disabled:opacity-50 file:disabled:pointer-events-none dark:text-neutral-500 dark:file:bg-blue-500 dark:hover:file:bg-blue-400"
						/>
						<p class="mt-1 text-xs text-gray-500 dark:text-neutral-400">
							PNG, JPG, GIF up to 5MB. Recommended size: 200x200px
						</p>
					</div>
				</div>
			</div>

			<!-- Warna Utama dan Secondary -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Warna Utama -->
				<div>
					<label for="primary-color" class="block text-sm font-medium mb-2 dark:text-white">
						Warna Utama <span class="text-red-500">*</span>
					</label>
					<div class="flex space-x-3">
						<input
							type="color"
							id="primary-color"
							name="primaryColor"
							value="#3b82f6"
							required
							onchange={(e) => updateColorText(e, "primary-color-text")}
							class="h-10 w-16 border-gray-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none dark:border-neutral-700"
						/>
						<input
							type="text"
							id="primary-color-text"
							placeholder="#3b82f6"
							value="#3b82f6"
							readonly
							class="py-2 px-3 border flex-1 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
						/>
					</div>
					<p class="mt-1 text-xs text-gray-500 dark:text-neutral-400">Warna utama untuk branding merchant</p>
				</div>

				<!-- Warna Secondary -->
				<div>
					<label for="secondary-color" class="block text-sm font-medium mb-2 dark:text-white">
						Warna Secondary <span class="text-red-500">*</span>
					</label>
					<div class="flex space-x-3">
						<input
							type="color"
							id="secondary-color"
							name="secondaryColor"
							value="#64748b"
							required
							onchange={(e) => updateColorText(e, "secondary-color-text")}
							class="h-10 w-16 border-gray-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none dark:border-neutral-700"
						/>
						<input
							type="text"
							id="secondary-color-text"
							placeholder="#64748b"
							value="#64748b"
							readonly
							class="py-2 border px-3 flex-1 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
						/>
					</div>
					<p class="mt-1 text-xs text-gray-500 dark:text-neutral-400">Warna pendukung untuk UI merchant</p>
				</div>
			</div>

			<!-- Warna Teks Utama dan Secondary -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Warna Teks Utama -->
				<div>
					<label for="primary-text-color" class="block text-sm font-medium mb-2 dark:text-white">
						Warna Teks Utama <span class="text-red-500">*</span>
					</label>
					<div class="flex space-x-3">
						<input
							type="color"
							id="primary-text-color"
							name="primaryTextColor"
							value="#ffffff"
							required
							onchange={(e) => updateColorText(e, "primary-text-color-text")}
							class="h-10 w-16 border-gray-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none dark:border-neutral-700"
						/>
						<input
							type="text"
							id="primary-text-color-text"
							placeholder="#ffffff"
							value="#ffffff"
							readonly
							class="py-2 px-3 border flex-1 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
						/>
					</div>
					<p class="mt-1 text-xs text-gray-500 dark:text-neutral-400">
						Warna teks untuk elemen dengan background primary
					</p>
				</div>

				<!-- Warna Teks Secondary -->
				<div>
					<label for="secondary-text-color" class="block text-sm font-medium mb-2 dark:text-white">
						Warna Teks Secondary <span class="text-red-500">*</span>
					</label>
					<div class="flex space-x-3">
						<input
							type="color"
							id="secondary-text-color"
							name="secondaryTextColor"
							value="#ffffff"
							required
							onchange={(e) => updateColorText(e, "secondary-text-color-text")}
							class="h-10 w-16 border-gray-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none dark:border-neutral-700"
						/>
						<input
							type="text"
							id="secondary-text-color-text"
							placeholder="#ffffff"
							value="#ffffff"
							readonly
							class="py-2 border px-3 flex-1 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
						/>
					</div>
					<p class="mt-1 text-xs text-gray-500 dark:text-neutral-400">
						Warna teks untuk elemen dengan background secondary
					</p>
				</div>
			</div>

			<!-- Slogan Merchant -->
			<div>
				<label for="merchant-slogan" class="block text-sm font-medium mb-2 dark:text-white"> Slogan Merchant </label>
				<input
					type="text"
					id="merchant-slogan"
					name="merchantSlogan"
					maxlength="150"
					class="py-3 border px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="Masukkan slogan atau tagline merchant"
				/>
				<p class="mt-1 text-xs text-gray-500 dark:text-neutral-400">
					Slogan yang menggambarkan merchant Anda (opsional)
				</p>
			</div>

			<!-- Error Message -->
			{#if form?.success === false}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-800/30 dark:border-red-700">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg
								class="h-4 w-4 text-red-400 mt-0.5"
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								fill="currentColor"
								viewBox="0 0 16 16"
							>
								<path
									d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"
								/>
							</svg>
						</div>
						<div class="ms-3">
							<p class="text-sm text-red-800 dark:text-red-400">
								{form.message}
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
				<button
					type="button"
					onclick={() => history.back()}
					class="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={!data.subscription.canCreate}
					class="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
				>
					<svg
						class="flex-shrink-0 w-4 h-4"
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
						<path d="M5 12l5 5l10 -10" />
					</svg>
					Add Merchant
				</button>
			</div>
			</fieldset>
		</form>
	</div>
</div>
