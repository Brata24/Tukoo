<script lang="ts">
	import { enhance, applyAction } from "$app/forms";
	import { onMount } from "svelte";
	import { afterNavigate } from "$app/navigation";
	import { toast } from "$lib/stores/toast.js";
	import { goto } from "$app/navigation";

	let { data }: any = $props();

	let secondaryColor = $state(data.merchant?.secondaryColor || '#3b82f6');
	let secondaryTextColor = $state(data.merchant?.secondaryTextColor || '#ffffff');

	$effect(() => {
		if (data.merchant) {
			secondaryColor = data.merchant.secondaryColor || '#3b82f6';
			secondaryTextColor = data.merchant.secondaryTextColor || '#ffffff';
		}
	});

	// Form state
	let productName = $state('');
	let barcode = $state('');
	let price = $state(0);
	let stock = $state(0);
	let infiniteStock = $state(false);
	let categoryId = $state('');
	let photoFile: File | null = $state(null);
	let photoPreview = $state('');

	// Variants state
	interface VariantGroup {
		id: number;
		name: string;
		values: string[];
	}

	let variants: VariantGroup[] = $state([]);
	let nextVariantId = $state(1);

	// Add new variant group
	function addVariantGroup() {
		variants = [...variants, { id: nextVariantId++, name: '', values: [] }];
	}

	// Remove variant group
	function removeVariantGroup(id: number) {
		variants = variants.filter(v => v.id !== id);
	}

	// Add value to variant group
	function addVariantValue(variantId: number, value: string) {
		if (!value.trim()) return;
		
		variants = variants.map(v => {
			if (v.id === variantId) {
				return { ...v, values: [...v.values, value.trim()] };
			}
			return v;
		});
	}

	// Remove value from variant group
	function removeVariantValue(variantId: number, valueIndex: number) {
		variants = variants.map(v => {
			if (v.id === variantId) {
				return { ...v, values: v.values.filter((_, i) => i !== valueIndex) };
			}
			return v;
		});
	}

	// Update variant name
	function updateVariantName(variantId: number, name: string) {
		variants = variants.map(v => {
			if (v.id === variantId) {
				return { ...v, name };
			}
			return v;
		});
	}

	// Handle photo selection
	function handlePhotoChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			photoFile = input.files[0];
			const reader = new FileReader();
			reader.onload = (e) => {
				photoPreview = e.target?.result as string;
			};
			reader.readAsDataURL(photoFile);
		}
	}

	// Handle form submission
	async function handleSubmit(result: any): Promise<void> {
		if (result?.type === "success") {
			toast.success("Product added successfully");
			await goto(`/manage/products`);
		} else {
			toast.error((result?.data as any)?.message || "Failed to add product");
		}
		if (result) await applyAction(result);
	}

	onMount(() => {
		setTimeout(() => {
			if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);
	});

	afterNavigate(() => {
		setTimeout(() => {
			if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
				(window as any).HSStaticMethods.autoInit();
			}
		}, 100);
	});
</script>

<div class="m-4">
	<div class="mb-6">
		<h2 class="text-2xl font-semibold dark:text-white">Add Product</h2>
		<p class="text-sm text-gray-600 dark:text-neutral-400">Create a new product for your store</p>
	</div>

	<div >
		<form
			method="POST"
			action="?/add-product"
			enctype="multipart/form-data"
			use:enhance={({ formData }) => {
				
				const variantEntries: Array<{ variantName: string; variantValue: string }> = [];
				variants.forEach(variant => {
					if (variant.name && variant.values.length > 0) {
						variant.values.forEach(value => {
							variantEntries.push({
								variantName: variant.name,
								variantValue: value
							});
						});
					}
				});
				
				
				formData.set('variants', JSON.stringify(variantEntries));
				
				return async ({ result }) => {
					await handleSubmit(result);
				};
			}}
		>
			<div
				class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-neutral-800 dark:border-neutral-700"
			>
				<div class="p-6 space-y-6">
					<!-- Product Name -->
					<div>
						<label for="name" class="block text-sm font-medium mb-2 dark:text-white">Product Name *</label>
						<input
							type="text"
							id="name"
							name="name"
							required
							bind:value={productName}
							class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							placeholder="Enter product name"
						/>
					</div>

					<!-- Barcode -->
					<div>
						<label for="barcode" class="block text-sm font-medium mb-2 dark:text-white">Barcode ID</label>
						<input
							type="text"
							id="barcode"
							name="barcode"
							bind:value={barcode}
							class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							placeholder="Enter barcode ID (optional - will auto-generate if empty)"
						/>
						<p class="text-xs text-gray-500 mt-1 dark:text-neutral-400">Leave empty to auto-generate a unique barcode ID</p>
					</div>

					<!-- Category -->
					<div>
						<label for="categoryId" class="block text-sm font-medium mb-2 dark:text-white">Category *</label>
						<select
							id="categoryId"
							name="categoryId"
							required
							bind:value={categoryId}
							class="py-3 px-4 pe-9 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
						>
							<option value="">Select a category</option>
							{#each data.categories as category}
								<option value={category.id}>{category.name}</option>
							{/each}
						</select>
					</div>

					<!-- Price -->
					<div>
						<label for="price" class="block text-sm font-medium mb-2 dark:text-white">Price *</label>
						<div class="relative">
							<input
								type="number"
								id="price"
								name="price"
								required
								min="0"
								step="1"
								bind:value={price}
								class="py-3 px-4 ps-16 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
								placeholder="0"
							/>
							<div class="absolute inset-y-0 start-0 flex items-center pointer-events-none z-20 ps-4">
								<span class="text-gray-500 dark:text-neutral-400">Rp</span>
							</div>
						</div>
					</div>

					<!-- Stock -->
					<div>
						<label class="block text-sm font-medium mb-2 dark:text-white">Stock</label>
						<div class="space-y-3">
							<div class="flex items-center">
								<input
									type="checkbox"
									id="infiniteStock"
									name="infiniteStock"
									bind:checked={infiniteStock}
									value="true"
									class="shrink-0 mt-0.5 border-gray-200 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800"
								/>
								<label for="infiniteStock" class="text-sm text-gray-500 ms-3 dark:text-neutral-400">Infinite Stock</label>
							</div>
							
							{#if !infiniteStock}
								<input
									type="number"
									id="stock"
									name="stock"
									min="0"
									bind:value={stock}
									class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
									placeholder="Enter stock quantity"
								/>
							{/if}
						</div>
					</div>

					<!-- Photo -->
					<div>
						<label for="photo" class="block text-sm font-medium mb-2 dark:text-white">Product Photo</label>
						<input
							type="file"
							id="photo"
							name="photo"
							accept="image/*"
							onchange={handlePhotoChange}
							class="block w-full border border-gray-200 shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 file:bg-gray-50 file:border-0 file:me-4 file:py-3 file:px-4 dark:file:bg-neutral-700 dark:file:text-neutral-400"
						/>
						{#if photoPreview}
							<div class="mt-4">
								<img src={photoPreview} alt="Preview" class="h-32 w-32 object-cover rounded-lg" />
							</div>
						{/if}
					</div>

					<!-- Variants -->
					<div>
						<div class="flex items-center justify-between mb-3">
							<label class="block text-sm font-medium dark:text-white">Product Variants</label>
							<button
								type="button"
								onclick={addVariantGroup}
								class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none"
								style="background-color: {secondaryColor}; color: {secondaryTextColor};"
							>
								<svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
								Add Variant
							</button>
						</div>

						<div class="space-y-4">
							{#each variants as variant (variant.id)}
								<div class="border border-gray-200 rounded-lg p-4 dark:border-neutral-700">
									<div class="flex items-start justify-between mb-3">
										<input
											type="text"
											placeholder="Variant name (e.g., Size, Serving)"
											bind:value={variant.name}
											oninput={(e) => updateVariantName(variant.id, e.currentTarget.value)}
											class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400"
										/>
										<button
											type="button"
											onclick={() => removeVariantGroup(variant.id)}
											class="ms-2 text-red-600 hover:text-red-700"
										>
											<svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>

									<div class="space-y-2">
										<div class="flex gap-2">
											<input
												type="text"
												placeholder="Add value (e.g., M, L, XL)"
												id="variant-value-{variant.id}"
												class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400"
												onkeypress={(e) => {
													if (e.key === 'Enter') {
														e.preventDefault();
														const input = e.currentTarget;
														addVariantValue(variant.id, input.value);
														input.value = '';
													}
												}}
											/>
											<button
												type="button"
												onclick={() => {
													const input = document.getElementById(`variant-value-${variant.id}`) as HTMLInputElement;
													if (input) {
														addVariantValue(variant.id, input.value);
														input.value = '';
													}
												}}
												class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent focus:outline-none"
												style="background-color: {secondaryColor}; color: {secondaryTextColor};"
											>
												Add
											</button>
										</div>

										{#if variant.values.length > 0}
											<div class="flex flex-wrap gap-2 mt-2">
												{#each variant.values as value, index}
													<span 
														class="inline-flex items-center gap-x-1 py-1 px-2 rounded-full text-xs font-medium"
														style="background-color: {secondaryColor}20; color: {secondaryColor};"
													>
														{value}
														<button
															type="button"
															onclick={() => removeVariantValue(variant.id, index)}
															class="hover:opacity-80 rounded-full p-0.5"
														>
															<svg class="size-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
															</svg>
														</button>
													</span>
												{/each}
											</div>
										{/if}
									</div>
								</div>
							{/each}

							{#if variants.length === 0}
								<p class="text-sm text-gray-500 dark:text-neutral-400">No variants added. Click "Add Variant" to create product variations.</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Form Actions -->
				<div class="flex justify-end items-center gap-x-2 py-3 px-6 border-t border-gray-200 dark:border-neutral-700">
					<a
						href="/manage/products"
						class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
					>
						Cancel
					</a>
					<button
						type="submit"
						class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none"
						style="background-color: {secondaryColor}; color: {secondaryTextColor};"
					>
						Create Product
					</button>
				</div>
			</div>
		</form>
	</div>
</div>
