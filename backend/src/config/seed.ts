import bcrypt from "bcryptjs";
import { pool } from "./database.js";
import { env } from "./env.js";

async function seed() {
  console.log("[SEED] Insertion des donnees de demonstration...");

  const connection = await pool.getConnection();

  try {
    await connection.query(`USE \`${env.db.name}\``);

    // Admin par defaut
    const passwordHash = await bcrypt.hash("admin123", 12);
    await connection.query(`
      INSERT IGNORE INTO users (full_name, email, phone, password_hash, role, status, member_code)
      VALUES ('Administrateur', 'admin@elitegym.com', '+221770000000', ?, 'ADMIN', 'ACTIVE', 'ADMIN001')
    `, [passwordHash]);

    // Plans d'abonnement
    await connection.query(`
      INSERT IGNORE INTO membership_plans (id, name, description, price, duration_days, is_active) VALUES
      (1, 'Seance unique', 'Acces pour une seance', 3000.00, 1, TRUE),
      (2, 'Mensuel', 'Abonnement mensuel illimite', 25000.00, 30, TRUE),
      (3, 'Trimestriel', 'Abonnement 3 mois', 60000.00, 90, TRUE),
      (4, 'Annuel', 'Abonnement annuel', 200000.00, 365, TRUE),
      (5, 'Pack 10 seances', '10 seances a utiliser librement', 25000.00, 90, TRUE),
      (6, 'VIP', 'Acces VIP illimite + coaching', 50000.00, 30, TRUE)
    `);

    // Types de seances
    await connection.query(`
      INSERT IGNORE INTO sessions (id, name, description, capacity, duration_minutes, is_active) VALUES
      (1, 'Musculation libre', 'Acces libre a la salle de musculation', 20, 90, TRUE),
      (2, 'Coaching prive', 'Seance personnalisee avec un coach', 1, 60, TRUE),
      (3, 'Cardio', 'Seance cardio et HIIT', 15, 45, TRUE),
      (4, 'Boxe', 'Cours de boxe', 10, 60, TRUE),
      (5, 'Yoga', 'Cours de yoga et stretching', 12, 60, TRUE),
      (6, 'CrossFit', 'Entrainement CrossFit', 10, 60, TRUE),
      (7, 'Seance decouverte', 'Premiere seance gratuite', 5, 60, TRUE)
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
