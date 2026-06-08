-- =============================================
-- Elite Gym - Enhance SUPER_ADMIN separation
-- Proper multi-tenant platform admin architecture
-- =============================================

-- 1. Enrich gyms table
ALTER TABLE gyms
    ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER name,
    ADD COLUMN IF NOT EXISTS address TEXT NULL AFTER country,
    ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255) NULL AFTER address,
    ADD COLUMN IF NOT EXISTS owner_id BIGINT NULL AFTER verified_by;

-- 2. Index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_gyms_slug ON gyms(slug);

-- 3. Platform logs table (global actions by super admins)
CREATE TABLE IF NOT EXISTS platform_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type ENUM('GYM', 'USER', 'PLATFORM', 'SETTINGS') NOT NULL,
    target_id BIGINT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id) REFERENCES users(id),
    INDEX idx_platform_logs_admin (admin_id),
    INDEX idx_platform_logs_action (action),
    INDEX idx_platform_logs_created (created_at)
);

-- 4. Add gym_slug to users for quick admin URL resolution
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS gym_slug VARCHAR(80) NULL AFTER gym_id;

-- 5. Backfill gym_slug for existing users
UPDATE users u
    JOIN gyms g ON g.id = u.gym_id
    SET u.gym_slug = g.slug
    WHERE u.gym_id IS NOT NULL AND u.gym_slug IS NULL;

-- 6. Backfill owner_id for existing gyms from their first admin
UPDATE gyms g
    SET g.owner_id = (
        SELECT MIN(u.id) FROM users u
        WHERE u.gym_id = g.id AND u.role IN ('ADMIN', 'SUPER_ADMIN') AND u.status != 'DELETED'
    )
    WHERE g.owner_id IS NULL;
