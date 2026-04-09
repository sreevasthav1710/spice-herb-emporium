ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS show_ingredients boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_rating_summary boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_usage_instructions boolean NOT NULL DEFAULT true;
