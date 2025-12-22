<script lang="ts">
	import { enhance, applyAction } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { toast } from "$lib/stores/toast.js";

	let { data, form } = $props();

	type Data2FA = { qrcode: string; encodedTOTPKey: string; status: boolean } | null;
	let data2fa: Data2FA = $state(null);

	function setup2fa() {
		fetch("/auth/2fa/setup/data", {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			}
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.status) {
					data2fa = data;
				} else {
					console.error("Failed to fetch 2FA setup data");
				}
			})
			.catch((error) => {
				console.error("Error:", error);
			});
	}

	async function refreshData() {
		await invalidateAll();
	}

	// Function to preview selected image
	function previewImage(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			const reader = new FileReader();

			reader.onload = function (e) {
				const imgElement = document.querySelector('img[alt="Current Avatar"]') as HTMLImageElement;
				if (imgElement && e.target?.result) {
					imgElement.src = e.target.result as string;
				}
			};

			reader.readAsDataURL(file);
		}
	}

	// Password validation
	let passwordError = $state('');
	
	function validatePasswordMatch() {
		const newPassword = (document.getElementById('new-password') as HTMLInputElement)?.value || '';
		const verifyPassword = (document.getElementById('verify-new-password') as HTMLInputElement)?.value || '';
		
		if (verifyPassword && newPassword !== verifyPassword) {
			passwordError = 'Passwords do not match';
		} else {
			passwordError = '';
		}
	}
</script>

<div class="m-4">
	<div class="mb-8">
		<h2 class="text-2xl font-semibold">Settings</h2>
		<p class="text-sm text-gray-600 dark:text-neutral-400">Manage your name, password and account settings.</p>
	</div>

	<div class="flex gap-4">
		<div class="bg-white w-full h-fit rounded-xl shadow-xs p-4 dark:bg-neutral-800">
			<div>
				<h3 class="text-lg font-semibold mb-4">Profile Information</h3>
				<form
					method="POST"
					action="?/update-profile"
					enctype="multipart/form-data"
					class="space-y-4"
					use:enhance={({ formElement, formData, action, cancel }) => {
						return async ({ result }) => {
							if (result.type == "failure") {
								// Handle the error
								applyAction(result);
								toast.error("Failed to update profile");
							} else if (result.type == "success") {
								// Handle the success
								applyAction(result);
								toast.success("Profile updated successfully!");
								refreshData();
							}
						};
					}}
				>
					<div>
						<label for="profile-photo" class="block text-sm font-medium mb-2 dark:text-white">Profile Photo</label>
						<div class="sm:col-span-9">
							<div class="flex items-center gap-5">
								<img
									class="inline-block size-16 object-cover rounded-full ring-2 ring-white dark:ring-neutral-900"
									src={data.user?.profile_picture || "/storage/profile/default.jpg"}
									alt="Current Avatar"
								/>
								<div class="flex gap-x-2">
									<div>
										<!-- Hidden file input that will be part of the form -->
										<input
											class="hidden"
											type="file"
											id="profile-photo"
											name="profile_picture"
											accept="image/*"
											onchange={previewImage}
										/>
										<button
											type="button"
											onclick={() => document.getElementById("profile-photo")?.click()}
											class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-50 dark:bg-transparent dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
										>
											<svg
												class="shrink-0 size-4"
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
												<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
												<polyline points="17 8 12 3 7 8"></polyline>
												<line x1="12" x2="12" y1="3" y2="15"></line>
											</svg>
											Select photo
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div>
						<label for="full-name" class="block text-sm font-medium mb-2 dark:text-white">Full Name</label>
						<input
							type="text"
							id="full-name"
							name="fullName"
							class="py-2.5 border sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							placeholder={data.user?.fullName}
							value={data.user?.fullName || ""}
						/>
					</div>
					<div>
						<label for="email" class="block text-sm font-medium mb-2 dark:text-white">Email</label>
						<input
							type="email"
							id="email"
							name="email"
							class="py-2.5 border sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							placeholder="you@site.com"
							value={data.user?.email || ""}
						/>
					</div>
					<div>
						<label for="phone" class="block text-sm font-medium mb-2 dark:text-white">Phone</label>
						<input
							type="tel"
							id="phone"
							name="phoneNumber"
							class="py-2.5 border sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							placeholder="8837819991"
							value={data.user?.phoneNumber || ""}
						/>
					</div>
					<div class="mt-5 flex justify-end gap-x-2">
						<button
							type="submit"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
						>
							Save changes
						</button>
					</div>
				</form>
			</div>
		</div>
		<div class="flex flex-col gap-4 w-full">
			<div class="bg-white w-full rounded-xl shadow-xs p-4 dark:bg-neutral-800">
				<div >
					<h3 class="text-lg font-semibold mb-4">Reset Password</h3>
					<form 
						method="POST" 
						action="?/change-password"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success') {
									toast.success('Password changed successfully!');
									
									const form = document.querySelector('form[action="?/change-password"]') as HTMLFormElement;
									if (form) form.reset();
								} else if (result.type === 'failure') {
									toast.error((result.data as any)?.message || 'Failed to change password');
								}
								await applyAction(result);
							};
						}}
						class="space-y-4"
					>
						<div>
							<label for="current-password" class="block text-sm font-medium mb-2 dark:text-white"
								>Current Password</label
							>
							<input
								type="password"
								id="current-password"
								name="currentPassword"
								required
								class="py-2.5 border sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
								placeholder="Current Password"
							/>
						</div>
						<div>
							<label for="new-password" class="block text-sm font-medium mb-2 dark:text-white">New Password</label>
							<input
								type="password"
								id="new-password"
								name="newPassword"
								required
								minlength="8"
								oninput={validatePasswordMatch}
								class="py-2.5 border sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
								placeholder="New Password"
							/>
						</div>
						<div>
							<label for="verify-new-password" class="block text-sm font-medium mb-2 dark:text-white"
								>Verify New Password</label
							>
							<input
								type="password"
								id="verify-new-password"
								name="verifyNewPassword"
								required
								minlength="8"
								oninput={validatePasswordMatch}
								class="py-2.5 border sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600 {passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
								placeholder="Verify New Password"
							/>
							{#if passwordError}
								<p class="text-red-500 text-sm mt-1">{passwordError}</p>
							{/if}
						</div>
						<div class="mt-5 flex justify-end gap-x-2">
							<button
								type="submit"
								disabled={passwordError !== ''}
								class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
							>
								Change Password
							</button>
						</div>
					</form>
				</div>
			</div>
			<div class="bg-white w-full rounded-xl shadow-xs p-4 dark:bg-neutral-800">
				<div class="space-y-4">
					<h3 class="text-lg font-semibold mb-4">2FA Settings</h3>
					<p>
						Status : <span
							class="inline-flex items-center gap-x-1.5 py-0.5 px-2 rounded-full text-xs font-medium {data.user
								?.enabled2FA
								? 'bg-green-500'
								: 'bg-red-500'} text-white">{data.user?.enabled2FA ? "Enabled" : "Disabled"}</span
						>
					</p>

					{#if data.user?.enabled2FA}
						<button
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-red-600 text-white hover:bg-red-700 focus:outline-hidden focus:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
						>
							Disable 2FA
						</button>
					{:else}
						<button
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
							aria-haspopup="dialog"
							aria-expanded="false"
							aria-controls="hs-scale-animation-modal"
							data-hs-overlay="#modal-2fa"
							onclick={setup2fa}
						>
							2FA Setup
						</button>
						<div
							id="modal-2fa"
							class="hs-overlay hidden size-full fixed top-0 start-0 z-80 overflow-x-hidden overflow-y-auto pointer-events-none"
							role="dialog"
							tabindex="-1"
							aria-labelledby="hs-scale-animation-modal-label"
						>
							<div
								class="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 scale-95 opacity-0 ease-in-out transition-all duration-200 sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
							>
								<div
									class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70"
								>
									<div
										class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700"
									>
										<h3 id="hs-scale-animation-modal-label" class="font-bold text-gray-800 dark:text-white">
											2FA Setup
										</h3>
										<button
											type="button"
											class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
											aria-label="Close"
											data-hs-overlay="#modal-2fa"
										>
											<span class="sr-only">Close</span>
											<svg
												class="shrink-0 size-4"
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
												<path d="M18 6 6 18"></path>
												<path d="m6 6 12 12"></path>
											</svg>
										</button>
									</div>
									<div class="p-4 overflow-y-auto flex flex-col gap-y-4">
										<p>1. Scan this QR code with your authenticator app:</p>
										<div class=" w-full flex flex-col items-center">
											<div class="w-1/2 p-3 border border-gray-200 rounded-md">
												{#if data2fa}
													{@html data2fa.qrcode}
												{/if}
											</div>
										</div>
										<p>2. Enter the code generated by your authenticator app:</p>
										<form
											method="POST"
											use:enhance={({ formElement, formData, action, cancel }) => {
												return async ({ result }) => {
													// `result` is an `ActionResult` object
													if (result.type == "failure") {
														// handle the error
														applyAction(result);
													} else if (result.type == "success") {
														// handle the success
														applyAction(result);
														data2fa = null;
														toast.success("2FA enabled successfully!");

														// Multiple methods to close the modal
														const closeModal = () => {
															const backdrop = document.querySelector(".hs-overlay-backdrop");
															if (backdrop) {
																backdrop.remove();
															}
															const modal = document.getElementById("modal-2fa");
															if (!modal) return;

															// Method 3: Direct DOM manipulation
															modal.classList.add("hidden");
															modal.classList.remove("hs-overlay-open");
															document.body.classList.remove("hs-overlay-open");

															// // Remove backdrop if exists
														};

														// Execute with a small delay to ensure DOM is ready
														setTimeout(closeModal, 100);

														refreshData();
													}
												};
											}}
											action="?/enable2fa"
											class="w-full"
										>
											<input type="hidden" name="key" value={data2fa?.encodedTOTPKey} />
											<label for="hs-trailing-button-add-on" class="sr-only">Label</label>
											<div class="flex rounded-lg">
												<input
													type="text"
													id="hs-trailing-button-add-on"
													placeholder="Enter code here"
													name="code"
													class="py-2.5 border sm:py-3 px-4 block w-full border-gray-200 rounded-s-lg sm:text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
												/>
												<button
													class="py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-e-md border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
												>
													Verify
												</button>
											</div>
											<p class="mt-2 text-sm text-red-600">{form?.message ?? ""}</p>
										</form>
									</div>
									<div
										class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700"
									>
										<button
											type="button"
											class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
											data-hs-overlay="#modal-2fa"
										>
											Close
										</button>
									</div>
								</div>
							</div>
						</div>
					{/if}
					<form></form>
				</div>
			</div>
		</div>
	</div>
</div>
