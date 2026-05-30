-- =============================================
-- Elite Gym - Migration 002
-- Logs d'activite, Settings, Ameliorations
-- =============================================

-- Table des logs d'activite admin
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    admin_name VARCHAR(150) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    description TEXT NOT NULL,
    metadata JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_logs_admin ON activity_logs(admin_id);
CREATE INDEX idx_logs_action ON activity_logs(action);
CREATE INDEX idx_logs_target ON activity_logs(target_type, target_id);
CREATE INDEX idx_logs_created ON activity_logs(created_at);

-- Table de configuration de la salle
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    setting_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') DEFAULT 'STRING',
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Valeurs par defaut
INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, description) VALUES
('gym_name', 'Elite Gym', 'STRING', 'Nom de la salle'),
('gym_phone', '+221 77 000 00 00', 'STRING', 'Telephone de la salle'),
('gym_address', 'Dakar, Senegal', 'STRING', 'Adresse de la salle'),
('gym_email', 'contact@elitegym.com', 'STRING', 'Email de contact'),
('gym_currency', 'FCFA', 'STRING', 'Devise utilisee'),
('gym_logo_url', '', 'STRING', 'URL du logo'),
('wave_payment_link', 'https://pay.wave.com/m/elite-gym', 'STRING', 'Lien de paiement Wave'),
('opening_hours', '{"monday":"06:00-21:30","tuesday":"06:00-21:30","wednesday":"06:00-21:30","thursday":"06:00-21:30","friday":"06:00-21:30","saturday":"06:00-21:30","sunday":""}', 'JSON', 'Horaires d ouverture'),
('cancellation_hours', '2', 'NUMBER', 'Heures minimum avant annulation'),
('allow_trial_session', 'true', 'BOOLEAN', 'Autoriser les seances d essai')
