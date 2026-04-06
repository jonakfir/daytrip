-- Daytrip Database Schema
-- Run this in your Supabase SQL editor

create table if not exists itineraries (
  id uuid primary key default gen_random_uuid(),
  share_id text unique default gen_random_uuid()::text,
  user_id uuid references auth.users,
  destination text not null,
  start_date date,
  end_date date,
  travelers int default 1,
  travel_style text,
  budget text,
  itinerary_data jsonb not null,
  is_public boolean default true,
  view_count int default 0,
  created_at timestamptz default now()
);

create table if not exists saved_trips (
  user_id uuid references auth.users not null,
  itinerary_id uuid references itineraries(id) on delete cascade not null,
  saved_at timestamptz default now(),
  primary key (user_id, itinerary_id)
);

-- Indexes
create index if not exists idx_itineraries_share_id on itineraries(share_id);
create index if not exists idx_itineraries_user_id on itineraries(user_id);
create index if not exists idx_itineraries_destination on itineraries(destination);
create index if not exists idx_saved_trips_user_id on saved_trips(user_id);

-- RLS policies
alter table itineraries enable row level security;
alter table saved_trips enable row level security;

-- Public itineraries can be read by anyone
create policy "Public itineraries are viewable by everyone"
  on itineraries for select
  using (is_public = true);

-- Users can insert their own itineraries
create policy "Users can create itineraries"
  on itineraries for insert
  with check (auth.uid() = user_id or user_id is null);

-- Users can update their own itineraries
create policy "Users can update own itineraries"
  on itineraries for update
  using (auth.uid() = user_id);

-- Saved trips: users manage their own
create policy "Users can manage own saved trips"
  on saved_trips for all
  using (auth.uid() = user_id);
