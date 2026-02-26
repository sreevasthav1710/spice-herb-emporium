import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbProduct = Tables<"products">;
export type DbVariant = Tables<"product_variants">;
export type ProductWithVariants = DbProduct & { variants: DbVariant[] };

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<ProductWithVariants[]> => {
      const { data: products, error: pErr } = await supabase.from("products").select("*").order("created_at");
      if (pErr) throw pErr;
      const { data: variants, error: vErr } = await supabase.from("product_variants").select("*");
      if (vErr) throw vErr;
      return (products || []).map(p => ({
        ...p,
        variants: (variants || []).filter(v => v.product_id === p.id).sort((a, b) => a.price - b.price),
      }));
    },
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<ProductWithVariants | null> => {
      const { data: product } = await supabase.from("products").select("*").eq("slug", slug).single();
      if (!product) return null;
      const { data: variants } = await supabase.from("product_variants").select("*").eq("product_id", product.id);
      return { ...product, variants: (variants || []).sort((a, b) => a.price - b.price) };
    },
    enabled: !!slug,
  });
};
