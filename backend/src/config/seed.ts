import bcrypt from "bcryptjs";
import { pool } from "./database.js";
import { env } from "./env.js";

async function seed() {
  console.log("[SEED] Insertion des donnees de demonstration...");

  const connection = await pool.getConnection();

  try {
    await connection.query(`USE \`${env.db.name}\``);

    // Default gym
    await connection.query(`
      INSERT IGNORE INTO gyms (id, name, slug, status)
      VALUES (1, 'Elite Gym', 'elite-gym', 'ACTIVE')
    `);

    // Admin de demonstration (gym admin)
    const passwordHash = await bcrypt.hash("admin123", 12);
    await connection.query(`
      INSERT INTO users (full_name, email, phone, password_hash, role, status, member_code, gym_id, is_platform_admin)
      VALUES ('Administrateur', 'admin@elitegym.com', '+221770000000', ?, 'ADMIN', 'ACTIVE', 'ADMIN001', 1, FALSE)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        phone = VALUES(phone),
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        status = VALUES(status),
        member_code = VALUES(member_code),
        gym_id = 1
    `, [passwordHash]);

    // Super Admin plateforme
    const superAdminHash = await bcrypt.hash("super123", 12);
    await connection.query(`
      INSERT INTO users (full_name, email, phone, password_hash, role, status, member_code, gym_id, is_platform_admin)
      VALUES ('Super Admin', 'super@elitegym.com', '+221770000001', ?, 'SUPER_ADMIN', 'ACTIVE', 'SADMIN01', NULL, TRUE)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        status = VALUES(status),
        is_platform_admin = TRUE
    `, [superAdminHash]);

    // Plans d'abonnement (avec plan_type, sessions_count, features)
    await connection.query(`
      INSERT IGNORE INTO membership_plans (id, gym_id, name, description, price, duration_days, plan_type, sessions_count, features, is_active) VALUES
      (1, 1, 'Seance unique', 'Acces pour une seance', 3000.00, 1, 'DURATION', NULL, NULL, TRUE),
      (2, 1, 'Mensuel', 'Abonnement mensuel illimite', 25000.00, 30, 'DURATION', NULL, 'Acces illimite a la salle', TRUE),
      (3, 1, 'Trimestriel', 'Abonnement 3 mois', 60000.00, 90, 'DURATION', NULL, 'Acces illimite, Reduction 20%', TRUE),
      (4, 1, 'Annuel', 'Abonnement annuel', 200000.00, 365, 'DURATION', NULL, 'Acces illimite, Reduction 33%, 1 mois offert', TRUE),
      (5, 1, 'Pack 10 seances', '10 seances a utiliser librement', 25000.00, 365, 'SESSIONS', 10, '10 seances au choix, Validite 1 an', TRUE),
      (6, 1, 'VIP', 'Acces VIP illimite + coaching', 50000.00, 30, 'VIP', NULL, 'Acces illimite, Coaching prive inclus, Serviette offerte, Casier reserve', TRUE)
    `);

    // Membre de demonstration
    const memberPasswordHash = await bcrypt.hash("test123", 12);
    await connection.query(`
      INSERT IGNORE INTO users (full_name, email, phone, password_hash, role, status, member_code, sport_goal, gym_id)
      VALUES ('Moussa Demo', 'moussa@test.com', '+221771111111', ?, 'MEMBER', 'ACTIVE', 'MBR001', 'Remise en forme', 1)
    `, [memberPasswordHash]);

    const [demoMembers] = await connection.query<any[]>(
      "SELECT id FROM users WHERE email = 'moussa@test.com' LIMIT 1"
    );

    if (demoMembers.length > 0) {
      const memberId = demoMembers[0].id;
      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

      await connection.query(`
        INSERT IGNORE INTO subscriptions (gym_id, user_id, plan_id, start_date, end_date, status)
        VALUES (1, ?, 2, ?, ?, 'ACTIVE')
      `, [memberId, startDate, endDate]);

      const [subscriptions] = await connection.query<any[]>(
        "SELECT id FROM subscriptions WHERE user_id = ? AND plan_id = 2 AND status = 'ACTIVE' LIMIT 1",
        [memberId]
      );

      if (subscriptions.length > 0) {
        await connection.query(`
          INSERT IGNORE INTO payments (gym_id, user_id, subscription_id, amount, payment_method, status, transaction_reference, paid_at)
          VALUES (1, ?, ?, 25000.00, 'WAVE', 'PAID', 'DEMO-MEMBER-001', NOW())
        `, [memberId, subscriptions[0].id]);
      }
    }

    // Types de seances
    await connection.query(`
      INSERT IGNORE INTO sessions (id, gym_id, name, description, capacity, duration_minutes, is_active) VALUES
      (1, 1, 'Musculation libre', 'Acces libre a la salle de musculation', 20, 90, TRUE),
      (2, 1, 'Coaching prive', 'Seance personnalisee avec un coach', 1, 60, TRUE),
      (3, 1, 'Cardio', 'Seance cardio et HIIT', 15, 45, TRUE),
      (4, 1, 'Boxe', 'Cours de boxe', 10, 60, TRUE),
      (5, 1, 'Yoga', 'Cours de yoga et stretching', 12, 60, TRUE),
      (6, 1, 'CrossFit', 'Entrainement CrossFit', 10, 60, TRUE),
      (7, 1, 'Seance decouverte', 'Premiere seance gratuite', 5, 60, TRUE)
    `);

    // Creneaux horaires (Lundi a Samedi)
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const slots = [
      { start: '06:00:00', end: '07:30:00' },
      { start: '07:30:00', end: '09:00:00' },
      { start: '09:00:00', end: '10:30:00' },
      { start: '10:30:00', end: '12:00:00' },
      { start: '14:00:00', end: '15:30:00' },
      { start: '15:30:00', end: '17:00:00' },
      { start: '17:00:00', end: '18:30:00' },
      { start: '18:30:00', end: '20:00:00' },
      { start: '20:00:00', end: '21:30:00' },
    ];

    // Musculation libre (id=1) - tous les creneaux
    for (const day of days) {
      for (const slot of slots) {
        await connection.query(`
          INSERT IGNORE INTO time_slots (session_id, day_of_week, start_time, end_time, max_capacity, is_active)
          VALUES (1, ?, ?, ?, 20, TRUE)
        `, [day, slot.start, slot.end]);
      }
    }

    // Settings par defaut
    await connection.query(`
      INSERT IGNORE INTO settings (\`key\`, value, label, type) VALUES
      ('allow_trial_session', '0', 'Autoriser seance d''essai gratuite', 'BOOLEAN'),
      ('cancellation_hours', '2', 'Delai minimum d''annulation (heures)', 'NUMBER'),
      ('gym_currency', 'FCFA', 'Devise', 'TEXT')
    `);

    console.log("[SEED] Donnees de demonstration inserees avec succes.");
    console.log("[SEED] Admin: admin@elitegym.com / admin123");
  } catch (error) {
    console.error("[SEED] Erreur:", error);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

seed();
