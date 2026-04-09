create table if not exists public.order_feedback (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  review text,
  suggestion text,
  created_at timestamptz not null default now(),
  unique (order_id)
);

alter table public.order_feedback enable row level security;

drop policy if exists "users can submit their own order feedback" on public.order_feedback;
create policy "users can submit their own order feedback"
on public.order_feedback
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.orders
    where orders.id = order_feedback.order_id
      and orders.user_id = auth.uid()
      and orders.status = 'delivered'
  )
);

drop policy if exists "users can view their own order feedback" on public.order_feedback;
create policy "users can view their own order feedback"
on public.order_feedback
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "admins can view all order feedback" on public.order_feedback;
create policy "admins can view all order feedback"
on public.order_feedback
for select
to authenticated
using (public.is_admin());
