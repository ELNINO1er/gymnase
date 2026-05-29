-- Schema de depart pour transformer Elite Gym en application vendable.
-- A executer dans l'editeur SQL de Supabase quand le projet Supabase sera cree.

create table if not exists gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade,
  type text not null check (type in ('admin', 'membre', 'visiteur')),
  code text,
  first_name text,
  last_name text,
  email text,
  phone text,
  annual_subscription_active boolean not null default false,
  registered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists profiles_gym_id_idx on profiles(gym_id);
create index if not exists profiles_code_idx on profiles(code);
create index if not exists profiles_email_idx on profiles(email);
create index if not exists profiles_phone_idx on profiles(phone);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  owner_ref text not null,
  session_type text not null,
  icon text,
  session_date date not null,
  session_time time not null,
  price integer not null,
  status text not null default 'programmee' check (status in ('programmee', 'annulee', 'terminee')),
  created_at timestamptz not null default now()
);

create index if not exists sessions_gym_date_idx on sessions(gym_id, session_date);
create unique index if not exists sessions_unique_slot_idx on sessions(gym_id, session_date, session_time)
where status <> 'annulee';

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  owner_ref text not null,
  label text not null,
  amount integer not null,
  payment_date date not null default current_date,
  method text not null default 'wave',
  external_reference text,
  status text not null default 'en_attente' check (status in ('en_attente', 'wave_lance', 'paye', 'annule')),
  created_at timestamptz not null default now()
);

create index if not exists payments_gym_date_idx on payments(gym_id, payment_date);
create index if not exists payments_status_idx on payments(status);

create table if not exists daily_reports (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms(id) on delete cascade,
  report_date date not null,
  sessions_count integer not null default 0,
  paid_amount integer not null default 0,
  pending_amount integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (gym_id, report_date)
);

-- Donnee de demo.
insert into gyms (name, slug)
values ('Elite Gym', 'elite-gym')
on conflict (slug) do nothing;
