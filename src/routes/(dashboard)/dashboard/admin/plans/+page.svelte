<script lang="ts">
	type Plan = {
		id: number;
		name: string;
		slug: string;
		price: number;
		duration: number;
		maxStores: number;
		description: string | null;
		isActive: number;
	};

	let { data } = $props();
	let showModal = $state(false);
	let editingPlan = $state<Plan | null>(null);
	let formData = $state({
		name: '',
		slug: '',
		price: 0,
		duration: 30,
		maxStores: 1,
		description: '',
		isActive: 1
	});

	const openModal = (plan: Plan | null = null) => {
		 if (plan) {
			editingPlan = plan;
			formData = { 
				name: plan.name,
				slug: plan.slug,
				price: plan.price,
				duration: plan.duration,
				maxStores: plan.maxStores,
				description: plan.description || '',
				isActive: plan.isActive
			};
		} else {
			editingPlan = null;
			formData = {
				name: '',
				slug: '',
				price: 0,
				duration: 30,
				maxStores: 1,
				description: '',
				isActive: 1
			};
		}
		showModal = true;
	};

	const closeModal = () => {
		showModal = false;
		editingPlan = null;
	};

	const savePlan = async () => {
		const url = editingPlan 
			? `/api/admin/plans/${editingPlan.id}` 
			: '/api/admin/plans';
		
		const method = editingPlan ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await response.json();
			if (result.success) {
				alert(editingPlan ? 'Plan updated!' : 'Plan created!');
				window.location.reload();
			} else {
				alert('Error: ' + result.error);
			}
		} catch (error) {
			alert('Error: ' + error);
		}
	};

	const togglePlanStatus = async (planId: number, currentStatus: number) => {
		const newStatus = currentStatus === 1 ? 0 : 1;
		
		try {
			const response = await fetch(`/api/admin/plans/${planId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: newStatus })
			});

			const result = await response.json();
			if (result.success) {
				window.location.reload();
			} else {
				alert('Error: ' + result.error);
			}
		} catch (error) {
			alert('Error: ' + error);
		}
	};

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	};
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Subscription Plans</h1>
			<p class="text-gray-600 mt-1">Manage subscription plans and pricing</p>
		</div>
		<button
			onclick={() => openModal()}
			class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
			</svg>
			Add New Plan
		</button>
	</div>

	<!-- Plans Table -->
	<div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Stores</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each data.plans as plan}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap">
							<div>
								<div class="text-sm font-medium text-gray-900">{plan.name}</div>
								<div class="text-sm text-gray-500">{plan.slug}</div>
							</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm text-gray-900">{formatPrice(plan.price)}</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm text-gray-900">{plan.duration} days</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm text-gray-900">
								{plan.maxStores === 999 ? 'Unlimited' : plan.maxStores}
							</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<button
								onclick={() => togglePlanStatus(plan.id, plan.isActive)}
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}"
							>
								{plan.isActive ? 'Active' : 'Inactive'}
							</button>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
							<button
								onclick={() => openModal(plan)}
								class="text-blue-600 hover:text-blue-900 mr-3"
							>
								Edit
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6 border-b border-gray-200">
				<h2 class="text-xl font-bold text-gray-900">
					{editingPlan ? 'Edit Plan' : 'Create New Plan'}
				</h2>
			</div>

		<div class="p-6 space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="plan-name" class="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
					<input
						id="plan-name"
						type="text"
						bind:value={formData.name}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="e.g., Pro"
					/>
				</div>

				<div>
					<label for="plan-slug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
					<input
						id="plan-slug"
						type="text"
						bind:value={formData.slug}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="e.g., pro"
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="plan-price" class="block text-sm font-medium text-gray-700 mb-1">Price (IDR)</label>
					<input
						id="plan-price"
						type="number"
						bind:value={formData.price}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="99000"
					/>
				</div>

				<div>
					<label for="plan-duration" class="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
					<input
						id="plan-duration"
						type="number"
						bind:value={formData.duration}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="30"
					/>
				</div>
			</div>

			<div>
				<label for="plan-maxstores" class="block text-sm font-medium text-gray-700 mb-1">Max Stores</label>
				<input
					id="plan-maxstores"
					type="number"
					bind:value={formData.maxStores}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="999 for unlimited"
				/>
			</div>

			<div>
				<label for="plan-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
				<textarea
					id="plan-description"
					bind:value={formData.description}
					rows="4"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="Comma-separated features"
				></textarea>
			</div>

			<div>
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						checked={formData.isActive === 1}
						onchange={(e) => formData.isActive = (e.target as HTMLInputElement).checked ? 1 : 0}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<span class="text-sm font-medium text-gray-700">Active</span>
				</label>
			</div>
		</div>			<div class="p-6 border-t border-gray-200 flex justify-end gap-3">
				<button
					onclick={closeModal}
					class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
				>
					Cancel
				</button>
				<button
					onclick={savePlan}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
				>
					{editingPlan ? 'Update' : 'Create'} Plan
				</button>
			</div>
		</div>
	</div>
{/if}
