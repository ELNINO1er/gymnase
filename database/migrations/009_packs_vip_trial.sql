-- =============================================
-- Phase 7/15 - Packs seances, VIP, seance d'essai
-- =============================================

-- Ajouter colonnes pour packs de seances et type VIP
ALTER TABLE membership_plans
  ADD COLUMN IF NOT EXISTS plan_type ENUM('DURATION', 'SESSIONS', 'VIP') DEFAULT 'DURATION' AFTER duration_days,
  ADD COLUMN IF NOT EXISTS sessions_count INT DEFAULT NULL AFTER plan_type,
  ADD COLUMN IF NOT EXISTS features TEXT DEFAULT NULL AFTER sessions_count;

-- Compteur de seances utilisees sur abonnement
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS sessions_used INT DEFAULT 0 AFTER end_date,
  ADD COLUMN IF NOT EXISTS sessions_total INT DEFAULT NULL AFTER sessions_used;

-- COACH role dans users (si pas deja fait par migration 004)
ALTER TABLE users MODIFY COLUMN role ENUM('VISITOR', 'MEMBER', 'COACH', 'ADMIN', 'SUPER_ADMIN') DEFAULT 'VISITOR';
