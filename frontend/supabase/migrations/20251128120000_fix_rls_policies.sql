-- Fix RLS policies to avoid circular dependency issues
-- This migration addresses the 406/403 errors by updating the user_roles policies

-- First, drop the existing restrictive policy
drop policy if exists "Users can view their own roles" on public.user_roles;

-- Create a more permissive policy for user_roles that allows the has_role function to work
create policy "Allow authenticated users to read user_roles for role checking"
  on public.user_roles for select
  to authenticated
  using (true); -- Allow all authenticated users to read roles for RLS checks

-- Also allow users to insert their own roles during signup
create policy "Users can insert their own roles"
  on public.user_roles for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Update the has_role function to be more robust
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.user_roles
      where user_id = _user_id
        and role = _role
    ),
    false
  )
$$;

-- Grant necessary permissions
grant select on public.user_roles to authenticated;
grant insert on public.user_roles to authenticated;
grant select on public.profiles to authenticated;