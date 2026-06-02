-- =============================================
-- Fix: Set gym_id for users/data created before multitenant migration
-- =============================================

-- Create default gym if none exists
INSERT IGNORE INTO gyms (id, name, slug, status)
VALUES (1, 'Elite Gym', 'elite-gym', 'ACTIVE');

-- Ensure columns exist before backfilling legacy rows
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;

-- Set gym_id = 1 for all users without a gym
UPDATE users SET gym_id = 1 WHERE gym_id IS NULL AND is_platform_admin = FALSE;

-- Set gym_id = 1 for all data without a gym
UPDATE membership_plans SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE subscriptions SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE sessions SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE time_slots SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE reservations SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE payments SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE notifications SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE attendance_logs SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE invoices SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE products SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE badges SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE activity_logs SET gym_id = 1 WHERE gym_id IS NULL;
