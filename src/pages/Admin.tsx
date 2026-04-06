import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Package, Save, X, ClipboardList, ShoppingBag } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import OrderManagement from "@/components/admin/OrderManagement";

type Product = Tables<"products">;
type Variant = Tables<"product_variants">;

type ProductWithVariants = Product & { variants: Variant[] };

const categories = ["Masala Powders", "Organic Powders", "Herbal Powders", "Nutrition Powders", "Spice Blends"];
const imageOptions = ["turmeric", "chili", "garam-masala", "moringa"];

const emptyProduct = {
  name: "", slug: "", category: "Masala Powders", description: "", short_description: "",
  ingredients: "", benefits: [] as string[], usage_instructions: "", image: "turmeric",
  badge: "", in_stock: true,
};

const emptyVariant = { weight: "", price: 0, original_price: null as number | null, is_default: false };

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [variants, setVariants] = useState<(typeof emptyVariant)[]>([{ ...emptyVariant, is_default: true }]);
  const [benefitsText, setBenefitsText] = useState("");
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading]);

  const fetchProducts = async () => {
    const { data: prods } = await supabase.from("products").select("*").order("created_at");
    const { data: vars } = await supabase.from("product_variants").select("*");
    if (prods && vars) {
      setProducts(prods.map(p => ({ ...p, variants: vars.filter(v => v.product_id === p.id) })));
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const startEdit = (p: ProductWithVariants) => {
    setEditing(p.id);
    setIsNew(false);
    setForm({
      name: p.name, slug: p.slug, category: p.category, description: p.description,
      short_description: p.short_description, ingredients: p.ingredients,
      benefits: p.benefits || [], usage_instructions: p.usage_instructions,
      image: p.image, badge: p.badge || "", in_stock: p.in_stock,
    });
    setBenefitsText((p.benefits || []).join("\n"));
    setVariants(p.variants.map(v => ({
      weight: v.weight, price: v.price, original_price: v.original_price, is_default: v.is_default ?? false,
    })));
  };

  const startNew = () => {
    setEditing("new");
    setIsNew(true);
    setForm({ ...emptyProduct });
    setBenefitsText("");
    setVariants([{ ...emptyVariant, is_default: true }]);
  };

  const cancel = () => { setEditing(null); setIsNew(false); };

  const handleSave = async () => {
    if (!form.name || !form.slug || variants.length === 0) {
      toast.error("Name, slug, and at least one variant required");
      return;
    }
    const benefits = benefitsText.split("\n").map(s => s.trim()).filter(Boolean);
    const productData = { ...form, benefits, badge: form.badge || null };

    try {
      if (isNew) {
        const { data, error } = await supabase.from("products").insert(productData).select().single();
        if (error) throw error;
        for (const v of variants) {
          await supabase.from("product_variants").insert({ ...v, product_id: data.id });
        }
      } else {
        const { error } = await supabase.from("products").update(productData).eq("id", editing!);
        if (error) throw error;
        await supabase.from("product_variants").delete().eq("product_id", editing!);
        for (const v of variants) {
          await supabase.from("product_variants").insert({ ...v, product_id: editing! });
        }
      }
      toast.success(isNew ? "Product created!" : "Product updated!");
      setEditing(null);
      setIsNew(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Product deleted"); fetchProducts(); }
  };

  const toggleStock = async (id: string, current: boolean) => {
    await supabase.from("products").update({ in_stock: !current }).eq("id", id);
    fetchProducts();
    toast.success(`Marked as ${!current ? "In Stock" : "Out of Stock"}`);
  };

  if (loading) return <Layout><div className="container py-20 text-center">Loading...</div></Layout>;
  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <Button onClick={startNew} className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
        </div>

        {editing && (
          <div className="mb-8 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-semibold">{isNew ? "New Product" : "Edit Product"}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="url-friendly-name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Image</label>
                <select value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {imageOptions.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Badge (optional)</label>
                <Input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="Bestseller, New, etc." />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={form.in_stock} onChange={e => setForm({ ...form, in_stock: e.target.checked })} />
                  In Stock
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Short Description</label>
                <Input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Full Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Ingredients</label>
                <textarea value={form.ingredients} onChange={e => setForm({ ...form, ingredients: e.target.value })}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Benefits (one per line)</label>
                <textarea value={benefitsText} onChange={e => setBenefitsText(e.target.value)}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Usage Instructions</label>
                <textarea value={form.usage_instructions} onChange={e => setForm({ ...form, usage_instructions: e.target.value })}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} />
              </div>
            </div>

            {/* Variants */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold">Weight Variants</label>
                <Button size="sm" variant="outline" onClick={() => setVariants([...variants, { ...emptyVariant }])}>
                  <Plus className="mr-1 h-3 w-3" /> Add Variant
                </Button>
              </div>
              {variants.map((v, i) => (
                <div key={i} className="mb-2 flex items-center gap-3">
                  <Input placeholder="Weight (e.g. 100g)" value={v.weight} className="w-32"
                    onChange={e => { const nv = [...variants]; nv[i].weight = e.target.value; setVariants(nv); }} />
                  <Input type="number" placeholder="Price ₹" value={v.price || ""} className="w-28"
                    onChange={e => { const nv = [...variants]; nv[i].price = Number(e.target.value); setVariants(nv); }} />
                  <Input type="number" placeholder="MRP (opt)" value={v.original_price || ""} className="w-28"
                    onChange={e => { const nv = [...variants]; nv[i].original_price = e.target.value ? Number(e.target.value) : null; setVariants(nv); }} />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <input type="radio" name="default-variant" checked={v.is_default}
                      onChange={() => { const nv = variants.map((vv, j) => ({ ...vv, is_default: j === i })); setVariants(nv); }} />
                    Default
                  </label>
                  {variants.length > 1 && (
                    <button onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={cancel}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Product list */}
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-serif font-semibold text-foreground">{p.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.in_stock ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {p.in_stock ? "In Stock" : "Out of Stock"}
                  </span>
                  {p.badge && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">{p.badge}</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.category} • {p.variants.map(v => `${v.weight}: ₹${v.price}`).join(" | ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleStock(p.id, p.in_stock)}>
                  <Package className="mr-1 h-3 w-3" /> {p.in_stock ? "Mark OOS" : "Mark In Stock"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
