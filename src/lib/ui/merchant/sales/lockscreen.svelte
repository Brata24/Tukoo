<script lang="ts">
	interface Props {
		merchantSlug: string;
		merchantName: string;
		merchantLogo: string;
		userName: string;
		primaryColor?: string;
		secondaryColor?: string;
		onUnlock: () => void;
	}
	
	let { merchantSlug, merchantName, merchantLogo, userName, primaryColor = '#3b82f6', secondaryColor = '#1e40af', onUnlock }: Props = $props();
	
	let password = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let isLoading = $state(false);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		
		if (!password) {
			error = 'Password harus diisi';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const response = await fetch(`/sales/lock`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ action: 'unlock', password })
			});

			if (response.ok) {
				onUnlock();
			} else {
				const data = await response.json().catch(() => ({}));
				error = data.message || 'Password salah';
				password = '';
			}
		} catch (err) {
			error = 'Terjadi kesalahan. Silakan coba lagi.';
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center p-4" style="background: linear-gradient(to bottom right, {primaryColor}, {secondaryColor});">
	<!-- Lock Screen Content -->
	<div class="w-full max-w-md">
		<!-- Logo & Merchant Info -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-24 h-24 mb-4 bg-white rounded-full shadow-lg">
				{#if merchantLogo}
					<img src={merchantLogo} alt={merchantName} class="w-20 h-20 object-contain rounded-full" />
				{:else}
					<svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
				{/if}
			</div>
			<h1 class="text-3xl font-bold text-white mb-2">{merchantName}</h1>
			<p class="text-blue-200 text-sm">Sales Dashboard Terkunci</p>
		</div>

		<!-- Lock Icon -->
		<div class="flex justify-center mb-6">
			<div class="relative">
				<div class="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/20">
					<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
				</div>
				<div class="absolute -bottom-2 left-1/2 -translate-x-1/2">
					<div class="bg-white px-3 py-1 rounded-full shadow-lg">
						<p class="text-xs font-medium text-gray-700">{userName}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Unlock Form -->
		<div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20">
			<form 
				onsubmit={handleSubmit}
				class="space-y-4"
			>
				<div>
					<label for="password" class="block text-sm font-medium text-white mb-2">
						Masukkan Password POS Anda
					</label>
					<div class="relative">
						<input
							name="password"
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="Password"
							disabled={isLoading}
							class="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all disabled:opacity-50"
							autocomplete="current-password"
						/>
						<button
							type="button"
							onclick={() => showPassword = !showPassword}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
						>
							{#if showPassword}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
								</svg>
							{:else}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							{/if}
						</button>
					</div>
					
					{#if error}
						<div class="mt-2 flex items-center gap-2 text-red-200 text-sm">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
							</svg>
							<span>{error}</span>
						</div>
					{/if}
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isLoading}
						<span class="flex items-center justify-center gap-2">
							<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Membuka...
						</span>
					{:else}
						<span class="flex items-center justify-center gap-2">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
							</svg>
							Buka Dashboard
						</span>
					{/if}
				</button>
			</form>

			<div class="mt-4 text-center">
				<p class="text-xs text-white/70">
					Masukkan password POS Anda untuk mengakses dashboard
				</p>
			</div>
		</div>

		<!-- Current Time -->
		<div class="mt-6 text-center">
			<p class="text-2xl font-bold text-white">
				{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
			</p>
			<p class="text-sm text-blue-200 mt-1">
				{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
			</p>
		</div>
	</div>
</div>
