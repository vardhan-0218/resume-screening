-- Create app_role enum for role types
create type public.app_role as enum ('candidate', 'hr');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create job_descriptions table
create table public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  hr_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  file_url text,
  created_at timestamptz default now() not null
);

alter table public.job_descriptions enable row level security;

-- Create resumes table
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references auth.users(id) on delete cascade not null,
  file_url text not null,
  file_name text not null,
  uploaded_at timestamptz default now() not null
);

alter table public.resumes enable row level security;

-- Create screening_results table
create table public.screening_results (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references auth.users(id) on delete cascade not null,
  job_description_id uuid references public.job_descriptions(id) on delete cascade not null,
  hr_id uuid references auth.users(id) on delete cascade not null,
  score integer not null check (score >= 0 and score <= 100),
  is_shortlisted boolean default false,
  matched_skills text[] default array[]::text[],
  missing_skills text[] default array[]::text[],
  suggestions text[] default array[]::text[],
  created_at timestamptz default now() not null
);

alter table public.screening_results enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- RLS Policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policies for job_descriptions
create policy "HR can create job descriptions"
  on public.job_descriptions for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'hr'));

create policy "HR can view their own job descriptions"
  on public.job_descriptions for select
  to authenticated
  using (public.has_role(auth.uid(), 'hr') and auth.uid() = hr_id);

create policy "HR can update their own job descriptions"
  on public.job_descriptions for update
  to authenticated
  using (public.has_role(auth.uid(), 'hr') and auth.uid() = hr_id);

-- RLS Policies for resumes
create policy "Candidates can create their own resumes"
  on public.resumes for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'candidate') and auth.uid() = candidate_id);

create policy "Candidates can view their own resumes"
  on public.resumes for select
  to authenticated
  using (public.has_role(auth.uid(), 'candidate') and auth.uid() = candidate_id);

create policy "HR can view all resumes"
  on public.resumes for select
  to authenticated
  using (public.has_role(auth.uid(), 'hr'));

-- RLS Policies for screening_results
create policy "Candidates can view their own screening results"
  on public.screening_results for select
  to authenticated
  using (public.has_role(auth.uid(), 'candidate') and auth.uid() = candidate_id);

create policy "HR can create screening results"
  on public.screening_results for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'hr') and auth.uid() = hr_id);

create policy "HR can view screening results they created"
  on public.screening_results for select
  to authenticated
  using (public.has_role(auth.uid(), 'hr') and auth.uid() = hr_id);

create policy "HR can update screening results they created"
  on public.screening_results for update
  to authenticated
  using (public.has_role(auth.uid(), 'hr') and auth.uid() = hr_id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();