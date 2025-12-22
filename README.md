<div align="center">

<img src="https://tukoo.web.id/tukoo.svg" alt="Tukoo Logo" width="150" />

# Tukoo POS System

**Modern Point of Sale System for Restaurants & Cafes**

[![Built with SvelteKit](https://img.shields.io/badge/Built%20with-SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.11-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [API](#-api-endpoints) • [License](#-license)

</div>

---

## 📖 Overview

**Tukoo** is a comprehensive, cloud-ready Point of Sale (POS) system designed specifically for restaurants and cafes. Built with modern web technologies, it provides a seamless experience for both staff and customers with features like self-ordering via QR codes, real-time order tracking, multiple payment methods, and advanced reporting.

### ✨ Key Highlights

- 🎯 **Multi-tenant Architecture** - Manage multiple merchants from a single installation
- 📱 **Self-Order System** - Customers can order directly via QR code scanning
- 💳 **Multiple Payment Methods** - Cash, QRIS (Xendit/Pakasir integration)
- ⚡ **Real-time Updates** - Live order status via WebSocket
- 📊 **Advanced Analytics** - Sales reports, revenue tracking, top products
- 🔐 **Secure Authentication** - Email verification, password reset, session management
- 🎨 **Customizable Branding** - Merchant-specific themes and logos
- 📦 **Inventory Management** - Stock tracking with automatic deduction
- 💰 **Subscription-based** - Flexible pricing plans with auto-renewal

---

## 🚀 Features

### For Merchants (Owners)

- ✅ Multi-merchant management with isolated data
- ✅ Comprehensive dashboard with revenue analytics
- ✅ Product catalog with categories and variants
- ✅ Staff management with role-based access
- ✅ QR code table management for self-ordering
- ✅ Custom branding (logo, colors, slogan)
- ✅ Subscription plan management
- ✅ Email notifications and verification

### For POS Staff (Cashiers)

- ✅ Fast order creation interface
- ✅ Product barcode scanning
- ✅ Cash and QRIS payment processing
- ✅ Order status management (new → preparing → ready → completed)
- ✅ Sales reports and daily summaries
- ✅ Inventory updates
- ✅ Kitchen display notifications

### For Customers

- ✅ Self-order menu via QR code
- ✅ Real-time order tracking
- ✅ QRIS payment with countdown timer
- ✅ Order history and receipts
- ✅ WhatsApp order notifications
- ✅ Mobile-responsive interface

---

## 🛠️ Tech Stack

### Frontend
- **SvelteKit** - Full-stack framework with SSR
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS
- **Socket.io Client** - Real-time WebSocket communication

### Backend
- **Node.js 22.11+** - Runtime environment
- **SvelteKit API Routes** - RESTful API endpoints
- **Drizzle ORM** - Type-safe database toolkit
- **MySQL** - Relational database
- **Socket.io** - Real-time bidirectional communication

### Payment & Notifications
- **Xendit/Pakasir API** - QRIS payment gateway
- **Nodemailer** - Email service
- **WhatsApp API** - Order notifications

### DevOps & Tools
- **Vitest** - Unit testing framework
- **Drizzle Kit** - Database migrations
- **ESLint & Prettier** - Code quality
- **Git** - Version control

---

## 📦 Getting Started

### Prerequisites

- **Node.js** 22.11 or higher
- **pnpm** (or npm/yarn)
- **MySQL** database server
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/tukoo.git
cd tukoo
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="mysql://user:password@localhost:3306/tukoo"

# Encryption (Generate: openssl rand --base64 16)
ENCRYPTION_KEY="YOUR_128_BIT_BASE64_KEY"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="Tukoo POS <noreply@tukoo.app>"

# Payment Gateway (Xendit/Pakasir)
XENDIT_API_KEY="your-xendit-api-key"
PAKASIR_API_KEY="your-pakasir-api-key"
PAKASIR_SECRET_KEY="your-pakasir-secret-key"

# WhatsApp API (Optional)
WHATSAPP_API_KEY="your-whatsapp-api-key"

# Application
PUBLIC_BASE_URL="http://localhost:5173"
NODE_ENV="development"
```

4. **Initialize database**

```bash
# Generate migration files
pnpm db:generate

# Apply migrations
pnpm db:push

# Or run setup SQL directly
mysql -u root -p tukoo < setup.sql
```

5. **Run the development server**

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

---
<!-- 
## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[API Payment Documentation](docs/API_PAYMENT_DOCUMENTATION.md)** - Payment integration guide
- **[Data Flow Diagram](docs/DATA_FLOW_DIAGRAM.md)** - System architecture and data flows
- **[Class Diagram](docs/CLASS_DIAGRAM.md)** - Entity relationships and system design
- **[Self Order Feature](docs/SELF_ORDER_FEATURE.md)** - QR-based ordering system
- **[Payment Flow Diagrams](docs/PAYMENT_FLOW_DIAGRAMS.md)** - Payment processing workflows
- **[Subscription Implementation](docs/SUBSCRIPTION_IMPLEMENTATION.md)** - Subscription management

--- -->

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login              # User login
POST   /api/auth/register           # User registration
POST   /api/auth/logout             # User logout
POST   /api/auth/verify-email       # Email verification
POST   /api/auth/reset-password     # Password reset
```

### Merchants
```
GET    /api/merchants               # List all merchants
POST   /api/merchants               # Create merchant
GET    /api/merchants/:id           # Get merchant details
PUT    /api/merchants/:id           # Update merchant
DELETE /api/merchants/:id           # Delete merchant
```

### Products
```
GET    /api/products                # List products
POST   /api/products                # Create product
PUT    /api/products/:id            # Update product
DELETE /api/products/:id            # Delete product
PATCH  /api/products/:id/stock      # Update stock
```

### Orders
```
GET    /api/orders                  # List orders
POST   /api/orders                  # Create order
GET    /api/orders/:id              # Get order details
PATCH  /api/orders/:id/status       # Update order status
DELETE /api/orders/:id              # Cancel order
```

### Payments
```
POST   /api/payments/qris           # Generate QRIS payment
POST   /api/payments/cash           # Process cash payment
POST   /api/payments/webhook        # Payment gateway webhook
GET    /api/payments/:id            # Get payment status
```

### Self-Order (Customer-facing)
```
GET    /pos/:slug/api/self-order/menu       # Get menu
POST   /pos/:slug/api/self-order/place-order # Place order
GET    /pos/:slug/api/self-order/track/:uuid # Track order
```

Full API documentation available in [docs/API_PAYMENT_DOCUMENTATION.md](docs/API_PAYMENT_DOCUMENTATION.md)

---

## 🗄️ Database Schema

The system uses MySQL with the following main entities:

- **User** - Merchant owners and authentication
- **Merchant** - Store/restaurant information
- **UserPos** - POS staff accounts
- **Product** - Product catalog
- **Category** - Product categories
- **Order** - Customer orders
- **OrderItem** - Order line items
- **Payment** - Payment transactions
- **RestaurantTable** - Tables with QR codes
- **Subscription** - Merchant subscriptions

See [docs/CLASS_DIAGRAM.md](docs/CLASS_DIAGRAM.md) for complete entity relationships.

---

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage
```

---

## 🔧 Development Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm check            # Type-check with svelte-check
pnpm lint             # Lint code
pnpm format           # Format code with Prettier
pnpm db:push          # Push database changes
pnpm db:generate      # Generate migrations
pnpm db:studio        # Open Drizzle Studio
```

---

## 🏗️ Project Structure

```
tukoo/
├── src/
│   ├── lib/
│   │   ├── server/           # Server-side logic
│   │   │   ├── db/           # Database schema & connection
│   │   │   ├── services/     # Business logic services
│   │   │   └── utils/        # Helper functions
│   │   ├── stores/           # Svelte stores
│   │   └── ui/               # UI components
│   ├── routes/               # SvelteKit routes
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (dashboard)/      # Dashboard routes
│   │   ├── api/              # API endpoints
│   │   └── pos/              # POS & self-order routes
│   ├── app.html              # HTML template
│   ├── app.css               # Global styles
│   └── hooks.server.ts       # Server hooks
├── static/                   # Static assets
├── docs/                     # Documentation
├── drizzle/                  # Database migrations
├── tests/                    # Test files
└── package.json              # Dependencies
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code follows the existing style (run `pnpm lint` and `pnpm format`)
- All tests pass (`pnpm test:run`)
- Type checking passes (`pnpm check`)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**Tukoo Development Team**

- Initial work and architecture
- Ongoing maintenance and feature development

---

## 🙏 Acknowledgments

- **SvelteKit** - For the amazing framework
- **Drizzle Team** - For the excellent ORM
- **Xendit/Pakasir** - For payment gateway integration
- **Open Source Community** - For inspiration and tools

---

## 📞 Support

For issues, questions, or suggestions:

- 📧 Email: support@tukoo.web.id
- 🐛 Issues: [GitHub Issues](https://github.com/D-cat1/tukoo/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/D-cat/tukoo/discussions)

---

<div align="center">

**⭐ If you find this project useful, please consider giving it a star! ⭐**

Made with ❤️ by the Tukoo Team

</div>
