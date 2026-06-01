-- =============================================
-- Elite Gym - Multitenant platform foundation
-- =============================================

CREATE TABLE IF NOT EXISTS gyms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    owner_name VARCHAR(150),
    owner_email VARCHAR(150),
    owner_phone VARCHAR(30),
    city VARCHAR(120),
    country VARCHAR(120),
    status ENUM('PENDING', 'ACTIVE', 'SUSPENDED') DEFAULT 'PENDING',
    verified_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO gyms (id, name, slug, owner_name, owner_email, status)
VALUES (1, 'Elite Gym', 'elite-gym', 'Romaric', 'dromaric58@gmail.com', 'ACTIVE')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    owner_email = VALUES(owner_email),
    status = VALUES(status);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id,
    ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE AFTER status;

UPDATE users SET gym_id = 1 WHERE gym_id IS NULL AND is_platform_admin = FALSE;

ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER setting_key;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS gym_id BIGINT NULL AFTER id;

UPDATE membership_plans SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE sessions SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE payments SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE subscriptions SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE reservations SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE notifications SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE activity_logs SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE settings SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE branches SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE products SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE sales SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE promo_codes SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE workout_plans SET gym_id = 1 WHERE gym_id IS NULL;
UPDATE badges SET gym_id = 1 WHERE gym_id IS NULL;
