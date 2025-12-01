import { mysqlTable, int, varchar, text, timestamp } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';

export const user = mysqlTable('user', {
    id: int('id').primaryKey().notNull().autoincrement(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 255 }).notNull(),
    fullName: varchar('fullname', { length: 255 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    emailVerified: int('email_verified').notNull().default(0),
    totpKey: text('totp_key'),
    twoFactorEnabled: int('two_factor_enabled').notNull().default(0),
    recoveryCode: text('recovery_code').notNull(),
    profile_picture: varchar('profile_picture', { length: 255 }).default('').notNull(),
});

export const session = mysqlTable('session', {
    id: varchar('id', { length: 255 }).primaryKey().notNull(),
    userId: int('user_id').notNull().references(() => user.id),
    expiresAt: int('expires_at').notNull(),
    twoFactorVerified: int('two_factor_verified').notNull().default(0),
});

export const emailVerificationRequest = mysqlTable('email_verification_request', {
    id: varchar('id', { length: 255 }).primaryKey().notNull(),
    userId: int('user_id').notNull().references(() => user.id),
    email: varchar('email', { length: 255 }).notNull(),
    code: varchar('code', { length: 255 }).notNull(),
    expiresAt: int('expires_at').notNull(),
});

export const passwordResetSession = mysqlTable('password_reset_session', {
    id: varchar('id', { length: 255 }).primaryKey().notNull(),
    userId: int('user_id').notNull().references(() => user.id),
    email: varchar('email', { length: 255 }).notNull(),
    code: varchar('code', { length: 255 }).notNull(),
    expiresAt: int('expires_at').notNull(),
    emailVerified: int('email_verified').notNull().default(0),
    twoFactorVerified: int('two_factor_verified').notNull().default(0),
});

export const merchant = mysqlTable('merchant', {
    id: int('id').primaryKey().notNull().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique().$defaultFn(() => uuidv4()),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 63 }).notNull().unique(),
    address: text('address').notNull(),
    logo: varchar('logo', { length: 255 }).default('').notNull(),
    primaryColor: varchar('primary_color', { length: 7 }).notNull(), // hex color #ffffff
    secondaryColor: varchar('secondary_color', { length: 7 }).notNull(), // hex color #ffffff
    primaryTextColor: varchar('primary_text_color', { length: 7 }).notNull(), // hex color #ffffff
    secondaryTextColor: varchar('secondary_text_color', { length: 7 }).notNull(), // hex color #ffffff
    slogan: varchar('slogan', { length: 150 }).default('').notNull(),
    userId: int('user_id').notNull().references(() => user.id),
    isActive: int('is_active').notNull().default(1),
    salesDashboardLocked: int('sales_dashboard_locked').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});


export const userPos = mysqlTable('user_pos', {
    id: int('id').primaryKey().notNull().autoincrement(),
    name: varchar('name', { length: 255 }).notNull(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    merchantId: int('merchant_id').notNull().references(() => merchant.id),
    password: varchar('password', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('staff'),
    lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const sessionPos = mysqlTable('session_pos', {
    id: varchar('id', { length: 255 }).primaryKey().notNull(),
    userPosId: int('user_pos_id').notNull().references(() => userPos.id),
    expiresAt: int('expires_at').notNull(),
});

export const category = mysqlTable('category', {
    id: int('id').primaryKey().notNull().autoincrement(),
    name: varchar('name', { length: 100 }).notNull(),
    merchantId: int('merchant_id').notNull().references(() => merchant.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const product = mysqlTable('product', {
    id: int('id').primaryKey().notNull().autoincrement(),
    name: varchar('name', { length: 255 }).notNull(),
    barcode: varchar('barcode', { length: 255 }).notNull().unique(),
    price: int('price').notNull(), // in cents
    stock: int('stock').notNull().default(0),
    infiniteStock: int('infinite_stock').notNull().default(0), // 0 = finite, 1 = infinite
    photo: varchar('photo', { length: 255 }).default('').notNull(),
    categoryId: int('category_id').notNull().references(() => category.id),
    merchantId: int('merchant_id').notNull().references(() => merchant.id),
    isActive: int('is_active').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const productVariant = mysqlTable('product_variant', {
    id: int('id').primaryKey().notNull().autoincrement(),
    productId: int('product_id').notNull().references(() => product.id),
    variantName: varchar('variant_name', { length: 100 }).notNull(), // e.g., "Size", "Serving"
    variantValue: varchar('variant_value', { length: 100 }).notNull(), // e.g., "M", "Hot"
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const restaurantTable = mysqlTable('restaurant_table', {
    id: int('id').primaryKey().notNull().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique().$defaultFn(() => uuidv4()),
    name: varchar('name', { length: 100 }).notNull(), // e.g., "Table 1", "Meja A1"
    capacity: int('capacity').notNull().default(4), // Number of seats
    qrToken: varchar('qr_token', { length: 36 }).notNull().unique().$defaultFn(() => uuidv4()), // UUID for QR code, can be regenerated
    isActive: int('is_active').notNull().default(1), // 0 = inactive, 1 = active
    allowPayAtCashier: int('allow_pay_at_cashier').notNull().default(1), // 0 = disabled, 1 = enabled
    merchantId: int('merchant_id').notNull().references(() => merchant.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const order = mysqlTable('order', {
    id: int('id').primaryKey().notNull().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique().$defaultFn(() => uuidv4()),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(), // e.g., "ORD-001-20250115"
    merchantId: int('merchant_id').notNull().references(() => merchant.id),
    userPosId: int('user_pos_id').references(() => userPos.id), // Cashier who created the order
    tableId: int('table_id').references(() => restaurantTable.id), // null if pickup
    diningOption: varchar('dining_option', { length: 20 }).notNull(), // 'pickup' or 'dinein'
    customerName: varchar('customer_name', { length: 255 }), // Optional customer name
    customerPhone: varchar('customer_phone', { length: 20 }), // Optional customer phone
    subtotal: int('subtotal').notNull(), // in cents
    tax: int('tax').notNull().default(0), // in cents
    tip: int('tip').notNull().default(0), // in cents
    total: int('total').notNull(), // in cents
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'paid', 'cancelled'
    processingStatus: varchar('processing_status', { length: 20 }).notNull().default('new'), // 'new', 'preparing', 'ready', 'served', 'completed'
    paymentMethod: varchar('payment_method', { length: 20 }), // 'cash' or 'xendit'
    paymentStatus: varchar('payment_status', { length: 20 }).default('unpaid').notNull(), // 'unpaid', 'paid', 'refunded'
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const orderItem = mysqlTable('order_item', {
    id: int('id').primaryKey().notNull().autoincrement(),
    orderId: int('order_id').notNull().references(() => order.id),
    productId: int('product_id').notNull().references(() => product.id),
    productName: varchar('product_name', { length: 255 }).notNull(), // Snapshot of product name at time of order
    variantId: int('variant_id').references(() => productVariant.id), // null if no variant
    variantName: varchar('variant_name', { length: 100 }), // e.g., "Size"
    variantValue: varchar('variant_value', { length: 100 }), // e.g., "Large"
    quantity: int('quantity').notNull(),
    unitPrice: int('unit_price').notNull(), // in cents
    subtotal: int('subtotal').notNull(), // quantity * unitPrice
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payment = mysqlTable('payment', {
    id: int('id').primaryKey().notNull().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique().$defaultFn(() => uuidv4()),
    orderId: int('order_id').notNull().references(() => order.id),
    paymentMethod: varchar('payment_method', { length: 20 }).notNull(), // 'cash' or 'qris'
    amount: int('amount').notNull(), // in cents
    status: varchar('status', { length: 20 }).notNull().default('PENDING'), // 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'EXPIRED'
    paymentRequestId: varchar('payment_request_id', { length: 255 }), // Xendit payment_request_id (v3 API)
    referenceId: varchar('reference_id', { length: 255 }), // Our order number (for Xendit reference_id)
    channelCode: varchar('channel_code', { length: 50 }).default('QRIS'), // Always QRIS (we only support QRIS)
    paymentNumber: varchar('payment_number', { length: 255 }), // Pak Kasir payment_number
    qrString: text('qr_string'), // QR code string from Xendit actions[0].value
    expiresAt: timestamp('expires_at'), // Payment expiration time (from Xendit)
    rawResponse: text('raw_response'), // Full Xendit API response JSON
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const cartItem = mysqlTable('cart_item', {
    id: int('id').primaryKey().notNull().autoincrement(),
    userPosId: int('user_pos_id').notNull().references(() => userPos.id), // POS user who owns this cart
    merchantId: int('merchant_id').notNull().references(() => merchant.id),
    productId: int('product_id').notNull().references(() => product.id),
    productName: varchar('product_name', { length: 255 }).notNull(),
    variantId: int('variant_id').references(() => productVariant.id),
    variantName: varchar('variant_name', { length: 100 }),
    variantValue: varchar('variant_value', { length: 100 }),
    unitPrice: int('unit_price').notNull(),
    quantity: int('quantity').notNull(),
    subtotal: int('subtotal').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Subscription Plans
export const subscriptionPlan = mysqlTable('subscription_plan', {
    id: int('id').primaryKey().notNull().autoincrement(),
    name: varchar('name', { length: 100 }).notNull(), // e.g., "Free", "Basic", "Pro"
    slug: varchar('slug', { length: 50 }).notNull().unique(), // e.g., "free", "basic", "pro"
    price: int('price').notNull(), // in cents, 0 for free plan
    duration: int('duration').notNull(), // in days, e.g., 30 for monthly
    maxStores: int('max_stores').notNull().default(1), // Maximum stores allowed
    description: text('description'), // Plan description/features
    isActive: int('is_active').notNull().default(1), // 0 = inactive, 1 = active
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// User Subscriptions
export const userSubscription = mysqlTable('user_subscription', {
    id: int('id').primaryKey().notNull().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique().$defaultFn(() => uuidv4()),
    userId: int('user_id').notNull().references(() => user.id),
    planId: int('plan_id').notNull().references(() => subscriptionPlan.id),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'active', 'expired', 'cancelled'
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    paymentId: int('payment_id').references(() => subscriptionPayment.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Subscription Payments
export const subscriptionPayment = mysqlTable('subscription_payment', {
    id: int('id').primaryKey().notNull().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique().$defaultFn(() => uuidv4()),
    userId: int('user_id').notNull().references(() => user.id),
    planId: int('plan_id').notNull().references(() => subscriptionPlan.id),
    amount: int('amount').notNull(), // in cents
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'completed', 'failed', 'expired', 'cancelled'
    paymentMethod: varchar('payment_method', { length: 20 }).notNull().default('qris'), // 'qris'
    paymentRequestId: varchar('payment_request_id', { length: 255 }).notNull().unique(), // Pakasir order_id
    paymentNumber: varchar('payment_number', { length: 255 }), // Pakasir payment_number (QR string)
    qrString: text('qr_string'), // QR code string
    expiresAt: timestamp('expires_at'),
    paidAt: timestamp('paid_at'),
    rawResponse: text('raw_response'), // Full Pakasir API response JSON
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Add relations for subscription queries
import { relations } from 'drizzle-orm';

export const userSubscriptionRelations = relations(userSubscription, ({ one }) => ({
	user: one(user, {
		fields: [userSubscription.userId],
		references: [user.id]
	}),
	plan: one(subscriptionPlan, {
		fields: [userSubscription.planId],
		references: [subscriptionPlan.id]
	}),
	payment: one(subscriptionPayment, {
		fields: [userSubscription.paymentId],
		references: [subscriptionPayment.id]
	})
}));

export const subscriptionPaymentRelations = relations(subscriptionPayment, ({ one }) => ({
	user: one(user, {
		fields: [subscriptionPayment.userId],
		references: [user.id]
	}),
	plan: one(subscriptionPlan, {
		fields: [subscriptionPayment.planId],
		references: [subscriptionPlan.id]
	})
}));

// Promo Banners for Front View
export const promoBanner = mysqlTable('promo_banner', {
    id: int('id').primaryKey().notNull().autoincrement(),
    merchantId: int('merchant_id').notNull().references(() => merchant.id),
    title: varchar('title', { length: 255 }).notNull(),
    image: varchar('image', { length: 255 }).notNull(), // Path to banner image
    order: int('order').notNull().default(0), // Display order (lower = first)
    isActive: int('is_active').notNull().default(1), // 0 = inactive, 1 = active
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});





