<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// State
	let mobileMenuOpen = $state(false);
	let scrolled = $state(false);

	onMount(() => {
		// Handle scroll for navbar background
		const handleScroll = () => {
			scrolled = window.scrollY > 20;
		};

		window.addEventListener('scroll', handleScroll);

		// Initialize Preline
		if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
			(window as any).HSStaticMethods.autoInit();
		}

		return () => window.removeEventListener('scroll', handleScroll);
	});

	// Features data
	const features = [
		{
			icon: 'bi-cart-check',
			title: 'Smart POS Terminal',
			description: 'Intuitive point-of-sale with quick checkout, inventory sync, and offline mode'
		},
		{
			icon: 'bi-graph-up-arrow',
			title: 'Real-time Analytics',
			description: 'Track sales, revenue, and performance with live dashboards and insights'
		},
		{
			icon: 'bi-people',
			title: 'Customer Management',
			description: 'Build loyalty with CRM, membership programs, and customer profiles'
		},
		{
			icon: 'bi-box-seam',
			title: 'Inventory Control',
			description: 'Manage stock levels, purchase orders, and suppliers effortlessly'
		},
		{
			icon: 'bi-receipt',
			title: 'Digital Receipts',
			description: 'Send receipts via email, SMS, or WhatsApp with custom branding'
		},
		{
			icon: 'bi-credit-card',
			title: 'Multiple Payments',
			description: 'Accept cash, cards, QRIS, e-wallets, and online payments'
		},
		{
			icon: 'bi-shield-check',
			title: 'Secure & Compliant',
			description: 'Bank-grade security with automatic backups and data encryption'
		},
		{
			icon: 'bi-clock-history',
			title: '24/7 Support',
			description: 'Get help anytime with our dedicated customer success team'
		}
	];

	const stats = [
		{ number: '10,000+', label: 'Active Merchants' },
		{ number: '99.9%', label: 'Uptime' },
		{ number: '5M+', label: 'Transactions Monthly' },
		{ number: '24/7', label: 'Support Available' }
	];
</script>

<svelte:head>
	<title>Tukoo POS - Modern Point of Sale System for Your Business</title>
	<meta name="description" content="Streamline your business with Tukoo's all-in-one POS system. Manage sales, inventory, customers, and analytics in one powerful platform." />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-white" style="font-family: 'Inter', system-ui, -apple-system, sans-serif">
	<!-- Navbar -->
	<header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 {scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'}">
		<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16 lg:h-20">
			<!-- Logo -->
			<div class="flex-shrink-0">
				<a href="/" class="flex items-center gap-2">
					<img src="/tukoo.svg" alt="Tukoo POS Logo" class="h-8 w-auto" />
				</a>
			</div>				<!-- Desktop Navigation -->
				<div class="hidden lg:flex items-center gap-8">
				<a href="#features" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">Features</a>
				<a href="#pricing" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">Pricing</a>
				<a href="#testimonials" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">Testimonials</a>
				<a href="/auth/login" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">Sign In</a>
				</div>

			<!-- CTA Buttons -->
			<div class="hidden lg:flex items-center gap-3">
				<a href={data.user ? '/dashboard' : '/auth/signup'} class="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30">
					{data.user ? 'Go to Dashboard' : 'Start Free Trial'}
				</a>
			</div>				<!-- Mobile Menu Button -->
				<button 
					type="button"
					class="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
					onclick={() => mobileMenuOpen = !mobileMenuOpen}
					aria-label="Toggle menu"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if mobileMenuOpen}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						{/if}
					</svg>
				</button>
			</div>

			<!-- Mobile Menu -->
			{#if mobileMenuOpen}
				<div class="lg:hidden py-4 border-t border-gray-100">
					<div class="flex flex-col gap-3">
						<a href="#features" class="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Features</a>
						<a href="#pricing" class="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Pricing</a>
					<a href="#testimonials" class="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Testimonials</a>
					<a href="/auth/login" class="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Sign In</a>
					<a href={data.user ? '/dashboard' : '/auth/signup'} class="px-3 py-2 text-center text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg font-semibold">{data.user ? 'Go to Dashboard' : 'Start Free Trial'}</a>
				</div>
			</div>
			{/if}
		</nav>
	</header>

	<!-- Hero Section -->
	<section class="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
		<!-- Background Gradient -->
		<div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 -z-10"></div>
		
		<!-- Animated Circles -->
		<div class="absolute top-20 right-10 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute bottom-20 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>

		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<!-- Left Content -->
				<div class="text-center lg:text-left">
					<div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
						<i class="bi bi-stars"></i>
						<span>Trusted by 10,000+ businesses</span>
					</div>

					<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
						Modern POS System<br/>
						<span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Built for Growth</span>
					</h1>

					<p class="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
						Streamline operations, boost sales, and delight customers with our all-in-one point of sale solution. Perfect for retail, F&B, and service businesses.
					</p>

					<div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
						<a href={data.user ? '/dashboard' : '/auth/signup'} class="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2">
							{data.user ? 'Go to Dashboard' : 'Start Free Trial'}
							<i class="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
						</a>
						<a href="#demo" class="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
							<i class="bi bi-play-circle"></i>
							Watch Demo
						</a>
					</div>

					<!-- Trust Badges -->
					<div class="flex flex-wrap gap-6 items-center justify-center lg:justify-start text-sm text-gray-500">
						<div class="flex items-center gap-2">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>No credit card required</span>
						</div>
						<div class="flex items-center gap-2">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>14-day free trial</span>
						</div>
						<div class="flex items-center gap-2">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>Cancel anytime</span>
						</div>
					</div>
				</div>

				<!-- Right Content - Mockup -->
				<div class="relative">
					<div class="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
					<div class="aspect-[4/3] bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
						<i class="bi bi-laptop text-8xl text-blue-600/20"></i>
					</div>						<!-- Floating Cards -->
						<div class="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-100">
							<div class="flex items-center gap-3">
								<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
									<i class="bi bi-graph-up-arrow text-green-600 text-xl"></i>
								</div>
								<div>
									<p class="text-xs text-gray-500">Revenue Today</p>
									<p class="text-lg font-bold text-gray-900">Rp 15.8M</p>
								</div>
							</div>
						</div>

						<div class="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 border border-gray-100">
							<div class="flex items-center gap-3">
								<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
									<i class="bi bi-cart-check text-blue-600 text-xl"></i>
								</div>
								<div>
									<p class="text-xs text-gray-500">Orders</p>
									<p class="text-lg font-bold text-gray-900">234</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Stats Section -->
	<section class="py-12 bg-white border-y border-gray-100">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
				{#each stats as stat}
					<div class="text-center">
					<div class="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
						{stat.number}
					</div>
						<div class="text-gray-600 font-medium">{stat.label}</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="py-20 lg:py-32 bg-gray-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<!-- Section Header -->
			<div class="text-center max-w-3xl mx-auto mb-16">
				<h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
					Everything You Need to Run Your Business
				</h2>
				<p class="text-lg text-gray-600">
					Powerful features designed to help you sell more, work smarter, and grow faster
				</p>
			</div>

			<!-- Features Grid -->
			<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each features as feature}
				<div class="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-600 hover:shadow-lg transition-all cursor-pointer">
					<div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<i class="{feature.icon} text-2xl text-blue-600"></i>
					</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
						<p class="text-gray-600 text-sm">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Benefits Section -->
	<section class="py-20 lg:py-32 bg-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
			<!-- Left - Image -->
			<div class="relative">
				<div class="aspect-square bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
					<i class="bi bi-graph-up text-9xl text-blue-600/20"></i>
				</div>
			</div>

			<!-- Right - Content -->
			<div>
				<div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
					<i class="bi bi-lightning-charge"></i>
					<span>Boost Performance</span>
				</div>					<h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
						Make Data-Driven Decisions with Real-Time Insights
					</h2>

					<p class="text-lg text-gray-600 mb-8">
						Track every metric that matters. Monitor sales performance, inventory levels, and customer behavior with beautiful dashboards and automated reports.
					</p>

					<ul class="space-y-4 mb-8">
						<li class="flex items-start gap-3">
							<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
								<i class="bi bi-check text-green-600 text-sm"></i>
							</div>
							<div>
								<h4 class="font-semibold text-gray-900 mb-1">Live Sales Dashboard</h4>
								<p class="text-gray-600 text-sm">Monitor revenue, transactions, and performance in real-time</p>
							</div>
						</li>
						<li class="flex items-start gap-3">
							<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
								<i class="bi bi-check text-green-600 text-sm"></i>
							</div>
							<div>
								<h4 class="font-semibold text-gray-900 mb-1">Inventory Alerts</h4>
								<p class="text-gray-600 text-sm">Never run out of stock with automatic low-stock notifications</p>
							</div>
						</li>
						<li class="flex items-start gap-3">
							<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
								<i class="bi bi-check text-green-600 text-sm"></i>
							</div>
							<div>
								<h4 class="font-semibold text-gray-900 mb-1">Custom Reports</h4>
								<p class="text-gray-600 text-sm">Generate detailed reports on sales, products, and customers</p>
							</div>
						</li>
					</ul>

					<a href="#pricing" class="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all">
						Get Started Today
						<i class="bi bi-arrow-right"></i>
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- Pricing Preview -->
	<section id="pricing" class="py-20 lg:py-32 bg-gray-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center max-w-3xl mx-auto mb-16">
				<h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
					Simple, Transparent Pricing
				</h2>
				<p class="text-lg text-gray-600">
					Choose the perfect plan for your business. All plans include 14-day free trial.
				</p>
			</div>

			<div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
			<!-- Starter -->
			<div class="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-600 transition-all">
					<h3 class="text-xl font-bold text-gray-900 mb-2">Starter</h3>
					<p class="text-gray-600 text-sm mb-6">Perfect for small businesses</p>
					<div class="mb-6">
						<span class="text-4xl font-bold text-gray-900">Rp 299K</span>
						<span class="text-gray-600">/month</span>
					</div>
					<ul class="space-y-3 mb-8">
						<li class="flex items-center gap-2 text-sm">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>1 POS Terminal</span>
						</li>
						<li class="flex items-center gap-2 text-sm">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>Unlimited Products</span>
						</li>
						<li class="flex items-center gap-2 text-sm">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>Basic Reports</span>
						</li>
						<li class="flex items-center gap-2 text-sm">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>Email Support</span>
						</li>
					</ul>
					<a href="/auth/signup" class="block w-full py-3 text-center bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
						Get Started
					</a>
				</div>

			<!-- Professional (Popular) -->
			<div class="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 border-2 border-blue-600 relative transform scale-105 shadow-xl">
				<div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-gray-900 rounded-full text-xs font-bold">
					MOST POPULAR
				</div>
				<h3 class="text-xl font-bold text-white mb-2">Professional</h3>
				<p class="text-blue-100 text-sm mb-6">For growing businesses</p>
					<div class="mb-6">
						<span class="text-4xl font-bold text-white">Rp 599K</span>
						<span class="text-blue-100">/month</span>
					</div>
					<ul class="space-y-3 mb-8">
						<li class="flex items-center gap-2 text-sm text-white">
							<i class="bi bi-check-circle-fill"></i>
							<span>5 POS Terminals</span>
						</li>
						<li class="flex items-center gap-2 text-sm text-white">
							<i class="bi bi-check-circle-fill"></i>
							<span>Advanced Analytics</span>
						</li>
						<li class="flex items-center gap-2 text-sm text-white">
							<i class="bi bi-check-circle-fill"></i>
							<span>CRM & Loyalty</span>
						</li>
						<li class="flex items-center gap-2 text-sm text-white">
							<i class="bi bi-check-circle-fill"></i>
							<span>Priority Support</span>
						</li>
					</ul>
					<a href="/auth/signup" class="block w-full py-3 text-center bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
						Get Started
					</a>
				</div>

			<!-- Enterprise -->
			<div class="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-600 transition-all">
					<h3 class="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
					<p class="text-gray-600 text-sm mb-6">For large operations</p>
					<div class="mb-6">
						<span class="text-4xl font-bold text-gray-900">Custom</span>
					</div>
					<ul class="space-y-3 mb-8">
						<li class="flex items-center gap-2 text-sm">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>Unlimited Terminals</span>
						</li>
						<li class="flex items-center gap-2 text-sm">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>Custom Integration</span>
						</li>
						<li class="flex items-center gap-2 text-sm">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>API Access</span>
						</li>
						<li class="flex items-center gap-2 text-sm">
							<i class="bi bi-check-circle-fill text-green-500"></i>
							<span>Dedicated Support</span>
						</li>
					</ul>
					<a href="#contact" class="block w-full py-3 text-center bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
						Contact Sales
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-20 lg:py-32 bg-gradient-to-br from-blue-600 to-indigo-600 relative overflow-hidden">
		<div class="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
		
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
			<h2 class="text-3xl lg:text-5xl font-bold text-white mb-6">
				Ready to Transform Your Business?
			</h2>
			<p class="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
				Join thousands of businesses already using Tukoo POS to grow their revenue and streamline operations.
			</p>
			
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href={data.user ? '/dashboard' : '/auth/signup'} class="group px-8 py-4 bg-white text-blue-600 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
					{data.user ? 'Go to Dashboard' : 'Start Your Free Trial'}
					<i class="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
				</a>
				<a href="#contact" class="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-2">
					<i class="bi bi-telephone"></i>
					Talk to Sales
				</a>
			</div>

			<p class="text-blue-100 text-sm mt-6">
				✓ No credit card required  •  ✓ 14-day free trial  •  ✓ Cancel anytime
			</p>
		</div>
	</section>

	<!-- Footer -->
	<footer class="bg-gray-900 text-gray-300">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
				<!-- Company -->
				<div>
					<h4 class="text-white font-semibold mb-4">Company</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/about" class="hover:text-white transition-colors">About Us</a></li>
					<li><a href="/careers" class="hover:text-white transition-colors">Careers</a></li>
					<li><a href="/blog" class="hover:text-white transition-colors">Blog</a></li>
					<li><a href="/press" class="hover:text-white transition-colors">Press</a></li>
				</ul>
				</div>

				<!-- Product -->
				<div>
					<h4 class="text-white font-semibold mb-4">Product</h4>
					<ul class="space-y-2 text-sm">
					<li><a href="#features" class="hover:text-white transition-colors">Features</a></li>
					<li><a href="#pricing" class="hover:text-white transition-colors">Pricing</a></li>
					<li><a href="/integrations" class="hover:text-white transition-colors">Integrations</a></li>
					<li><a href="/api" class="hover:text-white transition-colors">API</a></li>
					</ul>
				</div>

				<!-- Support -->
				<div>
					<h4 class="text-white font-semibold mb-4">Support</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/help" class="hover:text-white transition-colors">Help Center</a></li>
					<li><a href="/contact" class="hover:text-white transition-colors">Contact</a></li>
					<li><a href="/docs" class="hover:text-white transition-colors">Documentation</a></li>
					<li><a href="/status" class="hover:text-white transition-colors">System Status</a></li>
				</ul>
				</div>

				<!-- Legal -->
				<div>
					<h4 class="text-white font-semibold mb-4">Legal</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/privacy" class="hover:text-white transition-colors">Privacy</a></li>
					<li><a href="/terms" class="hover:text-white transition-colors">Terms</a></li>
					<li><a href="/security" class="hover:text-white transition-colors">Security</a></li>
					<li><a href="/compliance" class="hover:text-white transition-colors">Compliance</a></li>
				</ul>
				</div>
			</div>

		<div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
			<div class="flex items-center gap-2">
				<img src="/tukooputih.png" alt="Tukoo POS Logo" class="h-8 w-auto" />
			</div>

			<p class="text-sm">© 2025 Tukoo. All rights reserved.</p>			<div class="flex gap-4">
				<a href="https://facebook.com/tukoo" aria-label="Visit Tukoo on Facebook" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
					<i class="bi bi-facebook"></i>
				</a>
				<a href="https://twitter.com/tukoo" aria-label="Visit Tukoo on Twitter" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
					<i class="bi bi-twitter"></i>
				</a>
				<a href="https://instagram.com/tukoo" aria-label="Visit Tukoo on Instagram" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
					<i class="bi bi-instagram"></i>
				</a>
				<a href="https://linkedin.com/company/tukoo" aria-label="Visit Tukoo on LinkedIn" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
					<i class="bi bi-linkedin"></i>
				</a>
			</div>
			</div>
		</div>
	</footer>

	<!-- Floating WhatsApp Button -->
	<a 
		href="https://wa.me/6281150046" 
		target="_blank"
		rel="noopener noreferrer"
		class="fixed right-6 bottom-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-50 group"
		aria-label="Chat on WhatsApp"
	>
		<i class="bi bi-whatsapp text-2xl group-hover:scale-110 transition-transform"></i>
	</a>
</div>