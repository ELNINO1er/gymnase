-- =============================================
-- Elite Gym - Migration 006 : Phase 4 Avancees
-- Boutique, Badges, Facturation auto
-- =============================================

-- Produits boutique
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) DEFAULT 'Accessoire',
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ventes boutique
CREATE TABLE IF NOT EXISTS sales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('CASH', 'WAVE', 'ORANGE_MONEY', 'MTN_MONEY', 'CARD') NOT NULL,
    status ENUM('PENDING', 'PAID', 'CANCELLED') DEFAULT 'PAID',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Detail des ventes (lignes)
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_date ON sales(created_at);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'trophy',
    criteria_type ENUM('SESSIONS_COUNT', 'ATTENDANCE_STREAK', 'MONTHS_ACTIVE', 'GOAL_REACHED', 'MANUAL') NOT NULL,
    criteria_value INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Badges obtenus par les membres
CREATE TABLE IF NOT EXISTS user_badges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    badge_id BIGINT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- Badges par defaut
INSERT IGNORE INTO badges (id, name, description, icon, criteria_type, criteria_value) VALUES
(1, 'Premier pas', 'Premiere seance completee', 'footprints', 'SESSIONS_COUNT', 1),
(2, 'Habitue', '10 seances completees', 'flame', 'SESSIONS_COUNT', 10),
(3, 'Assidu', '25 seances completees', 'zap', 'SESSIONS_COUNT', 25),
(4, 'Champion', '50 seances completees', 'crown', 'SESSIONS_COUNT', 50),
(5, 'Legende', '100 seances completees', 'star', 'SESSIONS_COUNT', 100),
(6, '1 mois fidele', '1 mois sans interruption', 'calendar-check', 'MONTHS_ACTIVE', 1),
(7, '3 mois fidele', '3 mois sans interruption', 'shield', 'MONTHS_ACTIVE', 3),
(8, '1 an fidele', '1 an de presence', 'award', 'MONTHS_ACTIVE', 12),
(9, 'Objectif atteint', 'Objectif personnel atteint', 'target', 'GOAL_REACHED', 1),
(10, 'Membre du mois', 'Elu membre du mois', 'medal', 'MANUAL', 0);

-- Produits par defaut boutique
INSERT IGNORE INTO products (id, name, description, price, category, stock_quantity) VALUES
(1, 'Gourde Elite Gym', 'Gourde sport 750ml', 5000.00, 'Accessoire', 50),
(2, 'Serviette sport', 'Serviette microfibre', 3000.00, 'Accessoire', 100),
(3, 'Gants de musculation', 'Gants cuir taille M/L', 8000.00, 'Equipement', 30),
(4, 'T-shirt Elite Gym', 'T-shirt coton logo', 10000.00, 'Vetement', 40),
(5, 'Boisson proteinee', 'Shake proteine 500ml', 2500.00, 'Nutrition', 200),
(6, 'Barre energetique', 'Barre cereales sport', 1500.00, 'Nutrition', 300)
