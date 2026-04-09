ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}'::text[];
