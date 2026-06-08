-- =============================================
-- Elite Gym - Tenant-aware user uniqueness
-- =============================================

-- The original schema made email, phone and member_code unique globally.
-- In a multi-tenant app, these identifiers must be unique inside a gym, not across all gyms.
ALTER TABLE users
    DROP INDEX IF EXISTS email,
    DROP INDEX IF EXISTS phone,
    DROP INDEX IF EXISTS member_code;

CREATE UNIQUE INDEX IF NOT EXISTS unique_users_gym_email ON users(gym_id, email);
CREATE UNIQUE INDEX IF NOT EXISTS unique_users_gym_phone ON users(gym_id, phone);
CREATE UNIQUE INDEX IF NOT EXISTS unique_users_gym_member_code ON users(gym_id, member_code);
