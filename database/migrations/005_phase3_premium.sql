-- =============================================
-- Elite Gym - Migration 005 : Phase 3 Premium
-- Risk score, Messages, Branches
-- =============================================

-- Score de risque d'abandon
CREATE TABLE IF NOT EXISTS member_risk_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    score INT DEFAULT 0,
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'LOW',
    factors JSON,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_risk_level ON member_risk_scores(risk_level);

-- Messagerie admin <-> membre
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT,
    title VARCHAR(150),
    content TEXT NOT NULL,
    type ENUM('PRIVATE', 'GROUP', 'BROADCAST') DEFAULT 'PRIVATE',
    target_group ENUM('ALL', 'MEMBERS', 'EXPIRED', 'INACTIVE', 'COACHES') DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_read ON messages(is_read);

-- Multi-salles (branches)
CREATE TABLE IF NOT EXISTS branches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    city VARCHAR(100),
    email VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lier les utilisateurs a une branche (optionnel)
ALTER TABLE users ADD COLUMN branch_id BIGINT AFTER referral_code;
ALTER TABLE sessions ADD COLUMN branch_id BIGINT AFTER is_active;
ALTER TABLE reservations ADD COLUMN branch_id BIGINT AFTER coach_id;

-- Branche par defaut
INSERT IGNORE INTO branches (id, name, address, phone, city) VALUES
(1, 'Elite Gym - Principal', 'Dakar, Senegal', '+221 77 000 00 00', 'Dakar')
