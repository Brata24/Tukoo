-- Insert default subscription plans
INSERT INTO subscription_plan (name, slug, price, duration, max_stores, description, is_active) VALUES
('Free', 'free', 0, 30, 1, 'Perfect for trying out - Create 1 store, Basic features included', 1),
('Basic', 'basic', 99000, 30, 3, 'For small businesses - Create up to 3 stores, All features included, Priority support', 1),
('Pro', 'pro', 199000, 30, 10, 'For growing businesses - Create up to 10 stores, All features included, Priority support, Advanced analytics', 1),
('Enterprise', 'enterprise', 499000, 30, 999, 'For large businesses - Unlimited stores, All features included, Dedicated support, Custom integrations', 1);
