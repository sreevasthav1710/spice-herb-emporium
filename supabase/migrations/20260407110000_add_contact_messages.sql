create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "anyone can submit contact messages" on public.contact_messages;
create policy "anyone can submit contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "admins can view contact messages" on public.contact_messages;
create policy "admins can view contact messages"
on public.contact_messages
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins can update contact messages" on public.contact_messages;
create policy "admins can update contact messages"
on public.contact_messages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
