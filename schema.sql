-- Profiles table (extends Supabase auth users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  business_name text,
  trade text,
  zone text,
  services text,
  years_experience int,
  plan text default 'free' check (plan in ('free', 'basic', 'pro')),
  stripe_customer_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Generated content history
create table public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('marketing', 'analysis')),
  input jsonb,
  output text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.generations enable row level security;

-- Users can only see/edit their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Users can only see their own generations
create policy "Users can view own generations" on public.generations
  for select using (auth.uid() = user_id);
create policy "Users can insert own generations" on public.generations
  for insert with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
