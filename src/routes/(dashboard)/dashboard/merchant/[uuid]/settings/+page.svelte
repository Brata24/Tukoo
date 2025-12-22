<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/stores/toast.js';

	let { data, form } = $props();

	// Function to preview selected logo
	function previewLogo(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			const reader = new FileReader();

			reader.onload = function (e) {
				const imgElement = document.querySelector('img[alt="Merchant Logo"]') as HTMLImageElement;
				if (imgElement && e.target?.result) {
					imgElement.src = e.target.result as string;
				}
			};

			reader.readAsDataURL(file);
		}
	}
</script>

<div class="m-4">
	<div class="mb-8">
		<h2 class="text-2xl font-semibold">Merchant Settings</h2>
		<p class="text-sm text-gray-600 dark:text-neutral-400">Update your merchant information and branding.</p>
	</div>

	<div class="bg-white w-full h-fit rounded-xl shadow-xs p-4 dark:bg-neutral-800">
		<form
			method="POST"
			action="?/update"
			enctype="multipart/form-data"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						toast.success('Merchant updated successfully!');
						await invalidateAll();
					} else if (result.type === 'failure') {
						toast.error((result.data as any)?.message || 'Failed to update merchant');
					}
					await applyAction(result);
				};
			}}
			class="space-y-4"
		>
			<!-- Basic Information -->
			<div>
				<h3 class="text-lg font-semibold mb-4">Basic Information</h3>
				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium mb-2 dark:text-white">
							Merchant Name <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="name"
							name="name"
							value={data.merchant.name}
							required
							class="py-2.5 border sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							placeholder="Enter merchant name"
						/>
					</div>

					<div>
						<label for="slogan" class="block text-sm font-medium mb-2 dark:text-white">
							Slogan
						</label>
						<input
							type="text"
							id="slogan"
							name="slogan"
							value={data.merchant.slogan || ''}
							class="py-2.5 border sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							placeholder="Enter slogan"
						/>
					</div>

					<div>
						<label for="address" class="block text-sm font-medium mb-2 dark:text-white">
							Address <span class="text-red-500">*</span>
						</label>
						<textarea
							id="address"
							name="address"
							required
							rows="3"
							class="py-2.5 border sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							placeholder="Enter merchant address"
						>{data.merchant.address}</textarea>
					</div>

					<div>
						<label for="logo" class="block text-sm font-medium mb-2 dark:text-white">
							Merchant Logo
						</label>
						<div class="flex items-start space-x-4">
							<div class="flex-shrink-0">
								<img
									alt="Merchant Logo"
									src={data.merchant.logo || 'data:image/svg+xml,%3csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3e%3ctext x=\'50\' y=\'50\' font-size=\'12\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%236b7280\'%3eLogo%3c/text%3e%3c/svg%3e'}
									class="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-neutral-700"
								/>
							</div>
							<div class="flex-1">
								<input
									type="file"
									id="logo"
									name="merchantLogo"
									accept="image/*"
									onchange={previewLogo}
									class="block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:disabled:opacity-50 file:disabled:pointer-events-none dark:text-neutral-500 dark:file:bg-blue-500 dark:hover:file:bg-blue-400"
								/>
								<p class="mt-1 text-xs text-gray-500 dark:text-neutral-400">
									PNG, JPG, GIF up to 5MB. Recommended size: 200x200px
								</p>
								{#if data.merchant.logo}
									<p class="mt-1 text-xs text-gray-400 dark:text-neutral-500">
										Uploading a new logo will replace the current one.
									</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Brand Colors -->
			<div>
				<h3 class="text-lg font-semibold mb-4">Brand Colors</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Primary Color -->
					<div>
						<label for="primaryColor" class="block text-sm font-medium mb-2 dark:text-white">
							Primary Color
						</label>
						<div class="flex gap-2 items-center">
							<input
								type="color"
								id="primaryColor"
								name="primaryColor"
								value={data.merchant.primaryColor}
								class="h-10 w-16 border border-gray-200 rounded cursor-pointer dark:border-neutral-700"
							/>
							<input
								type="text"
								value={data.merchant.primaryColor}
								readonly
								class="py-2.5 border sm:py-3 px-4 flex-1 border-gray-200 rounded-lg sm:text-sm font-mono bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400"
							/>
						</div>
					</div>

					<!-- Secondary Color -->
					<div>
						<label for="secondaryColor" class="block text-sm font-medium mb-2 dark:text-white">
							Secondary Color
						</label>
						<div class="flex gap-2 items-center">
							<input
								type="color"
								id="secondaryColor"
								name="secondaryColor"
								value={data.merchant.secondaryColor}
								class="h-10 w-16 border border-gray-200 rounded cursor-pointer dark:border-neutral-700"
							/>
							<input
								type="text"
								value={data.merchant.secondaryColor}
								readonly
								class="py-2.5 border sm:py-3 px-4 flex-1 border-gray-200 rounded-lg sm:text-sm font-mono bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400"
							/>
						</div>
					</div>

					<!-- Primary Text Color -->
					<div>
						<label for="primaryTextColor" class="block text-sm font-medium mb-2 dark:text-white">
							Primary Text Color
						</label>
						<div class="flex gap-2 items-center">
							<input
								type="color"
								id="primaryTextColor"
								name="primaryTextColor"
								value={data.merchant.primaryTextColor}
								class="h-10 w-16 border border-gray-200 rounded cursor-pointer dark:border-neutral-700"
							/>
							<input
								type="text"
								value={data.merchant.primaryTextColor}
								readonly
								class="py-2.5 border sm:py-3 px-4 flex-1 border-gray-200 rounded-lg sm:text-sm font-mono bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400"
							/>
						</div>
					</div>

					<!-- Secondary Text Color -->
					<div>
						<label for="secondaryTextColor" class="block text-sm font-medium mb-2 dark:text-white">
							Secondary Text Color
						</label>
						<div class="flex gap-2 items-center">
							<input
								type="color"
								id="secondaryTextColor"
								name="secondaryTextColor"
								value={data.merchant.secondaryTextColor}
								class="h-10 w-16 border border-gray-200 rounded cursor-pointer dark:border-neutral-700"
							/>
							<input
								type="text"
								value={data.merchant.secondaryTextColor}
								readonly
								class="py-2.5 border sm:py-3 px-4 flex-1 border-gray-200 rounded-lg sm:text-sm font-mono bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Form Actions -->
			<div class="mt-5 flex justify-end gap-x-2">
				<a
					href="/dashboard/merchant/{data.merchant.uuid}"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-50 dark:bg-transparent dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
				>
					Cancel
				</a>
				<button
					type="submit"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
				>
					Save Changes
				</button>
			</div>
		</form>
	</div>
</div>
