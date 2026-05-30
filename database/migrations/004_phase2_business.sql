-- =============================================
-- Elite Gym - Migration 004 : Phase 2 Business
-- Coachs, Progression, Programmes, Promos, Parrainage
-- =============================================

-- Ajouter role COACH
ALTER TABLE users MODIFY role ENUM('VISITOR', 'MEMBER', 'COACH', 'ADMIN', 'SUPER_ADMIN') DEFAULT 'VISITOR';

-- Coach assigne a une seance
ALTER TABLE reservations ADD COLUMN coach_id BIGINT AFTER session_id;
ALTER TABLE reservations ADD FOREIGN KEY (coach_id) REFERENCES users(id);

-- Suivi progression membre
CREATE TABLE IF NOT EXISTS member_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    body_fat DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    goal VARCHAR(150),
    notes TEXT,
    recorded_at DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_progress_user ON member_progress(user_id);
CREATE INDEX idx_progress_date ON member_progress(recorded_at);

-- Programmes d'entrainement
CREATE TABLE IF NOT EXISTS workout_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    coach_id BIGINT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS workout_exercises (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    day_number INT DEFAULT 1,
    exercise_name VARCHAR(150) NOT NULL,
    sets_count INT,
    reps_count INT,
    weight_kg DECIMAL(5,2),
    duration_minutes INT,
    rest_seconds INT,
    notes TEXT,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_workout_user ON workout_plans(user_id);
CREATE INDEX idx_workout_coach ON workout_plans(coach_id);
CREATE INDEX idx_exercises_plan ON workout_exercises(plan_id);

-- Codes promo
CREATE TABLE IF NOT EXISTS promo_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('PERCENTAGE', 'FIXED') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    max_uses INT,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parrainage
CREATE TABLE IF NOT EXISTS referrals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    referrer_id BIGINT NOT NULL,
    referred_user_id BIGINT NOT NULL,
    referral_code VARCHAR(50) NOT NULL,
    reward_type ENUM('DISCOUNT', 'FREE_SESSION', 'FREE_MONTH', 'BONUS') DEFAULT 'DISCOUNT',
    reward_value DECIMAL(10,2) DEFAULT 0,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Code de parrainage unique par membre
ALTER TABLE users ADD COLUMN referral_code VARCHAR(50) UNIQUE AFTER qr_code_token;

-- Notes internes admin sur un membre (CRM)
CREATE TABLE IF NOT EXISTS member_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    admin_id BIGINT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id)
)
