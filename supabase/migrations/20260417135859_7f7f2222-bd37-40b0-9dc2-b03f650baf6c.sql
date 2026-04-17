-- Per-order spreadsheet overrides (admin-only)
CREATE TABLE public.order_spreadsheet_overrides (
  order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  name_override TEXT,
  phone_override TEXT,
  amount_override INTEGER,
  -- map of product_id -> quantity string ("500g", "2 x 250g", etc.)
  product_qty_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_spreadsheet_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage spreadsheet overrides"
ON public.order_spreadsheet_overrides
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE TRIGGER update_order_spreadsheet_overrides_updated_at
BEFORE UPDATE ON public.order_spreadsheet_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();