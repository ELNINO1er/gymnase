-- =============================================
-- Ensure every active gym has default sessions and time_slots
-- =============================================

-- Clone sessions from gym 1 to any gym that has zero sessions
INSERT INTO sessions (gym_id, name, description, capacity, duration_minutes, is_active)
SELECT g.id, s.name, s.description, s.capacity, s.duration_minutes, s.is_active
FROM gyms g
CROSS JOIN sessions s
WHERE s.gym_id = 1
  AND g.status = 'ACTIVE'
  AND g.id != 1
  AND NOT EXISTS (SELECT 1 FROM sessions s2 WHERE s2.gym_id = g.id);

-- Clone time_slots for the new sessions
INSERT INTO time_slots (session_id, day_of_week, start_time, end_time, max_capacity, is_active, gym_id)
SELECT new_s.id, ts.day_of_week, ts.start_time, ts.end_time, ts.max_capacity, ts.is_active, new_s.gym_id
FROM sessions new_s
JOIN sessions orig_s ON orig_s.gym_id = 1 AND orig_s.name = new_s.name
JOIN time_slots ts ON ts.session_id = orig_s.id
WHERE new_s.gym_id != 1
  AND NOT EXISTS (SELECT 1 FROM time_slots ts2 WHERE ts2.session_id = new_s.id);

-- Clone membership_plans from gym 1 to gyms that have no plans
INSERT INTO membership_plans (gym_id, name, description, price, duration_days, plan_type, sessions_count, features, is_active)
SELECT g.id, mp.name, mp.description, mp.price, mp.duration_days, mp.plan_type, mp.sessions_count, mp.features, mp.is_active
FROM gyms g
CROSS JOIN membership_plans mp
WHERE mp.gym_id = 1
  AND g.status = 'ACTIVE'
  AND g.id != 1
  AND NOT EXISTS (SELECT 1 FROM membership_plans mp2 WHERE mp2.gym_id = g.id);

-- Clone badges from gym 1 to gyms that have no badges
INSERT INTO badges (gym_id, name, description, icon, criteria_type, criteria_value)
SELECT g.id, b.name, b.description, b.icon, b.criteria_type, b.criteria_value
FROM gyms g
CROSS JOIN badges b
WHERE b.gym_id = 1
  AND g.status = 'ACTIVE'
  AND g.id != 1
  AND NOT EXISTS (SELECT 1 FROM badges b2 WHERE b2.gym_id = g.id);
