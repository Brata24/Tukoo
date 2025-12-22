<script lang="ts">
	import { enhance, applyAction } from "$app/forms";
	import { onMount } from "svelte";

	import { toast } from "$lib/stores/toast.js";

	

	export let data: any;

	let users: any[] = [];
	let merchant = data.merchant;
	let pagination = { total: 0, page: 1, limit: 10, totalPages: 1 };
	let loading = false;

	
	async function fetchUsers(pageNum: number = 1, limitNum: number = 10) {
		if (!merchant?.uuid) return;
		loading = true;
		try {
			const response = await fetch(`/api/merchants/${merchant.uuid}/users?page=${pageNum}&limit=${limitNum}`);
			const result = await response.json();
			
			if (result.success) {
				users = result.users;
				pagination = result.pagination;
			} else {
				toast.error(result.error || 'Failed to fetch users');
			}
		} catch (error) {
			console.error('Error fetching users:', error);
			toast.error('Failed to fetch users');
		} finally {
			loading = false;
		}
	}

	
	async function refreshUsers() {
		await fetchUsers(pagination.page, pagination.limit);
	}

	
	async function handleAddUser(result: any): Promise<void> {
		if (result?.type === "success") {
			toast.success("User added successfully");
			
			await refreshUsers();
		} else {
			toast.error((result?.data as any)?.message || "Failed to add user");
		}
		if (result) await applyAction(result);
	}

	
	async function handleResult(result: any): Promise<void> {
		if (result?.type === "success") {
			toast.success("Action successful");
			
			await refreshUsers();
		} else {
			toast.error((result?.data as any)?.message || "Action failed");
		}
		if (result) await applyAction(result);
	}

	function closeModal(modalId: string) {
		window.HSOverlay.close(modalId);
	
	}


	onMount(() => {
		
		const urlParams = new URLSearchParams(window.location.search);
		const pageNum = Number(urlParams.get('page') || '1');
		const limitNum = Number(urlParams.get('limit') || '10');
		fetchUsers(pageNum, limitNum);

		const modalIds = ['#addUserModal', '#resetPasswordModal'];
		
		const handleModalClose = () => {
			setTimeout(() => {
				document.body.style.overflow = '';
				document.body.style.removeProperty('overflow');
				
			}, 300);
		};

		modalIds.forEach(modalId => {
			const modalEl = document.querySelector(modalId);
			if (modalEl) {
				modalEl.addEventListener('close.hs.overlay', handleModalClose);
			}
		});

		// Cleanup event listeners on unmount
		return () => {
			modalIds.forEach(modalId => {
				const modalEl = document.querySelector(modalId);
				if (modalEl) {
					modalEl.removeEventListener('close.hs.overlay', handleModalClose);
				}
			});
		};
	});


	
	function openResetPasswordModal(userId: number) {
		const input = document.getElementById("reset-user-id") as HTMLInputElement;
		if (input) {
			input.value = String(userId);
		}
		
		const modalEl = document.getElementById('resetPasswordModal');
		if (!modalEl) return;

		if (typeof window !== 'undefined' && (window as any).HSOverlay) {
			try {
				const HSOverlay = (window as any).HSOverlay;
				new HSOverlay(modalEl).open();
			} catch (e) {
				console.error('Error opening modal:', e);
				modalEl.classList.remove('hidden');
				modalEl.classList.add('open');
				document.body.classList.add('overflow-hidden');
			}
		}
	}
</script>

<div class="m-4">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold dark:text-white">POS Users for {merchant?.name || 'Loading...'}</h2>
			<p class="text-sm text-gray-600 dark:text-neutral-400">Manage POS users (fullname, username, role)</p>
		</div>
		<div class="flex items-center space-x-2">
			<button
				type="button"
				on:click={refreshUsers}
				disabled={loading}
				class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
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
					class:animate-spin={loading}
				>
					<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
					<path d="M21 3v5h-5" />
				</svg>
				Refresh
			</button>
			<button
				type="button"
				class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
				aria-haspopup="dialog"
				aria-expanded="false"
				aria-controls="addUserModal"
				data-hs-overlay="#addUserModal"
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
					stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
				>
				Add User
			</button>
		</div>
	</div>

	<div class="flex flex-col">
		<div class="-m-1.5 overflow-x-auto">
			<div class="p-1.5 min-w-full inline-block align-middle">
				<div
					class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-neutral-800 dark:border-neutral-700"
				>
					<!-- Table -->
					<table class="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
						<thead class="bg-gray-50 dark:bg-neutral-800">
							<tr>
								<th scope="col" class="ps-6 py-3 text-start">
									<div class="flex items-center gap-x-2">
										<span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
											Name
										</span>
									</div>
								</th>

								<th scope="col" class="px-6 py-3 text-start">
									<div class="flex items-center gap-x-2">
										<span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
											Username
										</span>
									</div>
								</th>

								<th scope="col" class="px-6 py-3 text-start">
									<div class="flex items-center gap-x-2">
										<span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
											Role
										</span>
									</div>
								</th>

								<th scope="col" class="px-6 py-3 text-end"></th>
							</tr>
						</thead>

						<tbody class="divide-y divide-gray-200 dark:divide-neutral-700">
							{#each users as u}
								<tr>
									<td class="size-px whitespace-nowrap">
										<div class="ps-6 py-3">
											<div class="flex items-center gap-x-3">
												<div class="grow">
													<span class="block text-sm font-semibold text-gray-800 dark:text-neutral-200">{u.name}</span>
												</div>
											</div>
										</div>
									</td>
									<td class="size-px whitespace-nowrap">
										<div class="px-6 py-3">
											<span class="text-sm text-gray-600 dark:text-neutral-400">{u.username}</span>
										</div>
									</td>
									<td class="size-px whitespace-nowrap">
										<div class="px-6 py-3">
											<span
												class="py-1 px-1.5 inline-flex items-center gap-x-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full dark:bg-teal-500/10 dark:text-teal-500"
											>
												<svg
													class="size-2.5"
													xmlns="http://www.w3.org/2000/svg"
													width="16"
													height="16"
													fill="currentColor"
													viewBox="0 0 16 16"
												>
													<path
														d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"
													/>
												</svg>
												{u.role}
											</span>
										</div>
									</td>
									<td class="size-px whitespace-nowrap">
										<div class="px-6 py-1.5 flex justify-end items-center gap-x-2">
											<button
												type="button"
												class="inline-flex items-center gap-x-1 text-sm text-blue-600 decoration-2 hover:underline focus:outline-none focus:underline font-medium dark:text-blue-500"
												on:click={() => openResetPasswordModal(u.id)}
											>
												Reset Password
											</button>
											<form
												method="POST"
												action="?/delete-user"
												use:enhance={() => {
													return async ({ result }) => {
														await handleResult(result);
													};
												}}
												class="inline"
											>
												<input type="hidden" name="userId" value={u.id} />
												<button
													type="submit"
													class="inline-flex items-start gap-x-1 text-sm text-red-600 decoration-2 hover:underline focus:outline-none focus:underline font-medium dark:text-red-500"
												>
													Delete
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/each}
							{#if loading}
								<tr>
									<td colspan="4" class="size-px whitespace-nowrap">
										<div class="px-6 py-3 text-center">
											<span class="text-sm text-gray-600 dark:text-neutral-400">Loading...</span>
										</div>
									</td>
								</tr>
							{:else if users.length === 0}
								<tr>
									<td colspan="4" class="size-px whitespace-nowrap">
										<div class="px-6 py-3">
											<span class="text-sm text-gray-600 dark:text-neutral-400">No users found</span>
										</div>
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
					<!-- End Table -->

					<!-- Footer -->
					{#if pagination.totalPages > 1}
						<div
							class="px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-t border-gray-200 dark:border-neutral-700"
						>
							<div>
								<p class="text-sm text-gray-600 dark:text-neutral-400">
									<span class="font-semibold text-gray-800 dark:text-neutral-200">{pagination.total}</span> results
								</p>
							</div>

							<div>
								<div class="inline-flex gap-x-2">
									{#if pagination.page > 1}
										<button
											type="button"
											on:click={() => fetchUsers(pagination.page - 1, pagination.limit)}
											class="py-1.5 px-2 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
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
												stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
											>
											Prev
										</button>
									{:else}
										<button
											disabled
											class="py-1.5 px-2 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm opacity-50 pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
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
												stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
											>
											Prev
										</button>
									{/if}

									<div class="flex items-center gap-x-1">
										{#each Array(pagination.totalPages) as _, i}
											{#if i + 1 === pagination.page}
												<button
													type="button"
													class="min-h-[38px] min-w-[38px] flex justify-center items-center bg-blue-600 text-white py-2 px-3 text-sm rounded-lg focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
													aria-current="page">{i + 1}</button
												>
											{:else}
												<button
													type="button"
													on:click={() => fetchUsers(i + 1, pagination.limit)}
													class="min-h-[38px] min-w-[38px] flex justify-center items-center border border-gray-200 text-gray-800 py-2 px-3 text-sm rounded-lg focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:border-neutral-700 dark:text-white dark:focus:bg-neutral-700"
													>{i + 1}</button
												>
											{/if}
										{/each}
									</div>

									{#if pagination.page < pagination.totalPages}
										<button
											type="button"
											on:click={() => fetchUsers(pagination.page + 1, pagination.limit)}
											class="py-1.5 px-2 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
										>
											Next
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
												stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
											>
										</button>
									{:else}
										<button
											disabled
											class="py-1.5 px-2 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm opacity-50 pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
										>
											Next
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
												stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
											>
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/if}
					<!-- End Footer -->
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Add User Modal -->
<div
	id="addUserModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="addUserModalLabel"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
	>
		<div
			class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="addUserModalLabel" class="font-bold text-gray-800 dark:text-white">Add POS User</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
					data-hs-overlay="#addUserModal"
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
			<div class="p-4 overflow-y-auto">
				<form
					method="POST"
					action="?/add-user"
					use:enhance={() => {
						return async ({ result }) => {
							await handleAddUser(result);
                            closeModal("#addUserModal");
						};
					}}
				>
					<div class="space-y-4">
						<div>
							<label for="add-name" class="block text-sm font-medium mb-2 dark:text-white">Name</label>
							<input
								type="text"
								id="add-name"
								name="name"
								required
								class="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
								placeholder="Enter name"
							/>
						</div>
						<div>
							<label for="add-username" class="block text-sm font-medium mb-2 dark:text-white">Username</label>
							<input
								type="text"
								id="add-username"
								name="username"
								required
								class="py-3 border px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
								placeholder="Enter username"
							/>
						</div>
						<div>
							<label for="add-password" class="block text-sm font-medium mb-2 dark:text-white">Password</label>
							<input
								type="password"
								id="add-password"
								name="password"
								required
								class="py-3 border px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
								placeholder="Enter password"
							/>
						</div>
						<div>
							<label for="add-role" class="block text-sm font-medium mb-2 dark:text-white">Role</label>
							<select
								id="add-role"
								name="role"
								class="py-3 px-4 border pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							>
								<option value="staff">Staff</option>
								<option value="manager">Manager</option>
							</select>
						</div>
					</div>
					<div
						class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700 mt-4"
					>
						<button
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
							data-hs-overlay="#addUserModal"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
						>
							Create User
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>


<div
	id="resetPasswordModal"
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
	aria-labelledby="resetPasswordModalLabel"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center"
	>
		<div
			class="w-full flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
				<h3 id="resetPasswordModalLabel" class="font-bold text-gray-800 dark:text-white">Reset Password</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
					on:click={() => closeModal("#resetPasswordModal")}
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
			<div class="p-4 overflow-y-auto">
				<form
					method="POST"
					action="?/reset-password"
					use:enhance={() => {
						return async ({ result }) => {
							await handleResult(result);
                            closeModal("#resetPasswordModal")
						};
					}}
				>
					<input type="hidden" id="reset-user-id" name="userId" value="" />
					<div class="space-y-4">
						<div>
							<label for="reset-new-password" class="block text-sm font-medium mb-2 dark:text-white">New Password</label
							>
							<input
								type="password"
								id="reset-new-password"
								name="newPassword"
								required
								class="py-3 border px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
								placeholder="Enter new password"
							/>
						</div>
					</div>
					<div
						class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700 mt-4"
					>
						<button
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
							on:click={() => closeModal("#resetPasswordModal")}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-hidden focus:bg-yellow-600 disabled:opacity-50 disabled:pointer-events-none"
						>
							Reset Password
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
