
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_note text;
