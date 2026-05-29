-- =============================================
-- Elite Gym - Migration 003 : Phase 1 Premium
-- QR Code, Attendance, Invoices
-- =============================================

-- QR Code token pour chaque membre
ALTER TABLE users ADD COLUMN qr_code_token VARCHAR(191) UNIQUE AFTER member_code;

-- Table des presences (check-in / check-out)
CREATE TABLE IF NOT EXISTS attendance_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP NULL,
    method ENUM('QR_CODE', 'MANUAL', 'ADMIN') DEFAULT 'QR_CODE',
    status ENUM('VALID', 'DENIED') DEFAULT 'VALID',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_attendance_user ON attendance_logs(user_id);
CREATE INDEX idx_attendance_checkin ON attendance_logs(check_in_time);
CREATE INDEX idx_attendance_status ON attendance_logs(status);

-- Table des factures
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    payment_id BIGINT,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('DRAFT', 'SENT', 'PAID', 'CANCELLED') DEFAULT 'DRAFT',
    due_date DATE,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number)
