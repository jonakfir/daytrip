-- Daytrip Supabase Schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New Query)
-- It creates the profiles, payments, and itineraries tables plus auto-promotes
-- jonakfir@gmail.com to admin on every login.

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
create extension if not exists "uuid-ossp";

-- =============================================================================
-- PROFILES TABLE
-- Mirrors auth.users with extra role + total_paid fields.
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  total_paid_cents integer not null default 0,
  plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_role_idx on public.profiles(role);

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null,
  currency text not null default 'usd',
  plan text,
  stripe_payment_id text unique,
  status text not null default 'succeeded',
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_created_at_idx on public.payments(created_at desc);

-- =============================================================================
-- ITINERARIES TABLE
-- =============================================================================
create table if not exists public.itineraries (
  id uuid primary key default uuid_generate_v4(),
  share_id text unique not null default replace(uuid_generate_v4()::text, '-', ''),
  user_id uuid references public.profiles(id) on delete cascade,
  destination text not null,
  start_date date,
  end_date date,
  travelers integer not null default 2,
  travel_style text,
  budget text,
  itinerary_data jsonb not null,
  is_public boolean not null default true,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists itineraries_share_id_idx on public.itineraries(share_id);
create index if not exists itineraries_user_id_idx on public.itineraries(user_id);

-- =============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- jonakfir@gmail.com is automatically promoted to admin
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when new.email = 'jonakfir@gmail.com' then 'admin'
      else 'user'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- UPDATE TOTAL_PAID WHEN PAYMENT INSERTED
-- =============================================================================
create or replace function public.update_total_paid()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set total_paid_cents = total_paid_cents + new.amount_cents,
      plan = coalesce(new.plan, plan),
      updated_at = now()
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_payment_inserted on public.payments;
create trigger on_payment_inserted
  after insert on public.payments
  for each row execute function public.update_total_paid();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.itineraries enable row level security;

-- Profiles: users can see their own profile; admins see all
drop policy if exists "users_view_own_profile" on public.profiles;
create policy "users_view_own_profile" on public.profiles
  for select using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "users_update_own_profile" on public.profiles;
create policy "users_update_own_profile" on public.profiles
  for update using (auth.uid() = id);

-- Payments: users see their own; admins see all
drop policy if exists "users_view_own_payments" on public.payments;
create policy "users_view_own_payments" on public.payments
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Itineraries: public itineraries are visible to everyone; owners see their own
drop policy if exists "public_itineraries_visible" on public.itineraries;
create policy "public_itineraries_visible" on public.itineraries
  for select using (is_public = true or auth.uid() = user_id);

drop policy if exists "users_insert_own_itineraries" on public.itineraries;
create policy "users_insert_own_itineraries" on public.itineraries
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "users_update_own_itineraries" on public.itineraries;
create policy "users_update_own_itineraries" on public.itineraries
  for update using (auth.uid() = user_id);

-- =============================================================================
-- SEED: ensure jonakfir@gmail.com is admin if profile already exists
-- =============================================================================
update public.profiles set role = 'admin' where email = 'jonakfir@gmail.com';
