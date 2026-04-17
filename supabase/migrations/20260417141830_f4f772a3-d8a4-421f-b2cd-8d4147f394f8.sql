-- Rename "Organic Powders" → "Powders" and remove "Masala Powders" (move to Powders)
UPDATE public.products SET category = 'Powders' WHERE category IN ('Organic Powders', 'Masala Powders');