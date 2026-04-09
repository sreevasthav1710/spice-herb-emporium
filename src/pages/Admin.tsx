import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Package, Save, X, ClipboardList, ShoppingBag, QrCode as QrCodeIcon, MessagesSquare } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import ContactMessages from "@/components/admin/ContactMessages";
import OrderManagement from "@/components/admin/OrderManagement";
import { useProductImage } from "@/hooks/useProductImage";

type Product = Tables<"products">;
type Variant = Tables<"product_variants">;

type ProductWithVariants = Product & { variants: Variant[] };

const categories = ["Masala Powders", "Organic Powders", "Pickles"];
const imageOptions = ["turmeric", "chili", "garam-masala", "moringa"];

const emptyProduct = {
  name: "", slug: "", category: "Masala Powders", description: "", short_description: "",
  ingredients: "", benefits: [] as string[], usage_instructions: "", image: "turmeric", gallery_images: [] as string[],
  badge: "", in_stock: true, show_ingredients: true, show_usage_instructions: true, show_rating_summary: true,
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
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

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

  const currentProductImage = useProductImage(form.image);

  const startEdit = (p: ProductWithVariants) => {
    setEditing(p.id);
    setIsNew(false);
    setProductImageFile(null);
    setForm({
      name: p.name, slug: p.slug, category: p.category, description: p.description,
      short_description: p.short_description, ingredients: p.ingredients,
      benefits: p.benefits || [], usage_instructions: p.usage_instructions,
      image: p.image, gallery_images: p.gallery_images || [], badge: p.badge || "", in_stock: p.in_stock,
      show_ingredients: p.show_ingredients ?? true,
      show_usage_instructions: p.show_usage_instructions ?? true,
      show_rating_summary: p.show_rating_summary ?? true,
    });
    setBenefitsText((p.benefits || []).join("\n"));
    setVariants(p.variants.map(v => ({
      weight: v.weight, price: v.price, original_price: v.original_price, is_default: v.is_default ?? false,
    })));
  };

  const startNew = () => {
    setEditing("new");
    setIsNew(true);
    setProductImageFile(null);
    setGalleryImageFiles([]);
    setForm({ ...emptyProduct });
    setBenefitsText("");
    setVariants([{ ...emptyVariant, is_default: true }]);
  };

  const cancel = () => { setEditing(null); setIsNew(false); setProductImageFile(null); setGalleryImageFiles([]); };

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

  const [tab, setTab] = useState<"orders" | "messages" | "products" | "payment">("orders");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const STORAGE_BUCKET = import.meta.env.VITE_PAYMENT_BUCKET || "public";
  const QR_PATH = "payment/qr.png";
  const MAX_QR_SIZE_BYTES = 5 * 1024 * 1024;
  const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
  const FALLBACK_QR_URL = `/payment/qr.jpeg?t=${Date.now()}`;
  const handleQrImageError = () => {
    setQrUrl((currentUrl) => (currentUrl === FALLBACK_QR_URL ? currentUrl : FALLBACK_QR_URL));
  };

  const getQrPublicUrl = () => {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(QR_PATH);
    return data?.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : FALLBACK_QR_URL;
  };

  const fetchQr = async () => {
    try {
      setQrUrl(getQrPublicUrl());
    } catch (err) {
      setQrUrl(FALLBACK_QR_URL);
    }
  };

  useEffect(() => { fetchQr(); }, []);

  const handleProductImageUpload = async () => {
    if (!productImageFile) {
      toast.error("Select a product image first");
      return;
    }

    setUploadingProductImage(true);
    try {
      const extension = productImageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeSlug = (form.slug || form.name || "product")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const path = `products/${safeSlug || "product"}-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, productImageFile, {
        cacheControl: "3600",
        contentType: productImageFile.type,
      });

      if (error) {
        const msg = (error.message || "").toString();
        if (error.status === 404 || /bucket not found/i.test(msg)) {
          toast.error(`Storage bucket '${STORAGE_BUCKET}' not found. Create it under Supabase -> Storage and enable public access.`);
        } else if (/row-level security|violates row-level security/i.test(msg)) {
          toast.error("Product image upload is blocked by Supabase storage policies. Apply the new migration, then try again.");
        } else {
          toast.error(msg || "Image upload failed");
        }
        return;
      }

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      setForm((current) => {
        const nextGallery = current.gallery_images.includes(data.publicUrl)
          ? current.gallery_images
          : [...current.gallery_images, data.publicUrl];
        return { ...current, image: data.publicUrl, gallery_images: nextGallery };
      });
      setProductImageFile(null);
      toast.success("Product image uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Image upload failed");
    } finally {
      setUploadingProductImage(false);
    }
  };

  const handleGalleryImageUpload = async () => {
    if (galleryImageFiles.length === 0) {
      toast.error("Select gallery images first");
      return;
    }

    setUploadingProductImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of galleryImageFiles) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeSlug = (form.slug || form.name || "product")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        const path = `products/${safeSlug || "product"}-gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
        const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
        });

        if (error) throw error;

        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      setForm((current) => ({
        ...current,
        gallery_images: Array.from(new Set([...current.gallery_images, ...uploadedUrls])),
      }));
      setGalleryImageFiles([]);
      toast.success("Gallery images uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Gallery upload failed");
    } finally {
      setUploadingProductImage(false);
    }
  };

  if (loading) return <Layout><div className="container py-20 text-center">Loading...</div></Layout>;
  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button variant={tab === "orders" ? "default" : "outline"} onClick={() => setTab("orders")} className="gap-2">
              <ClipboardList className="h-4 w-4" /> Orders
            </Button>
            <Button variant={tab === "messages" ? "default" : "outline"} onClick={() => setTab("messages")} className="gap-2">
              <MessagesSquare className="h-4 w-4" /> Messages
            </Button>
            <Button variant={tab === "products" ? "default" : "outline"} onClick={() => setTab("products")} className="gap-2">
              <ShoppingBag className="h-4 w-4" /> Products
            </Button>
            <Button variant={tab === "payment" ? "default" : "outline"} onClick={() => setTab("payment")} className="gap-2">
              <QrCodeIcon className="h-4 w-4" /> Payment QR
            </Button>
          </div>
        </div>

        {tab === "orders" && <OrderManagement />}

        {tab === "messages" && <ContactMessages />}

        {tab === "payment" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-semibold">Payment QR</h2>
            <p className="mb-4 text-sm text-muted-foreground">Upload / replace the payment QR code that customers will scan to pay.</p>

            <div className="mb-4 flex items-center gap-4">
              <div className="h-36 w-36 overflow-hidden rounded-md border bg-muted p-2">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="Payment QR" className="h-full w-full object-contain" onError={handleQrImageError} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No QR uploaded</div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    if (!file) {
                      setQrFile(null);
                      return;
                    }
                    if (!file.type.startsWith("image/")) {
                      toast.error("Please select an image file");
                      e.target.value = "";
                      setQrFile(null);
                      return;
                    }
                    if (file.size > MAX_QR_SIZE_BYTES) {
                      toast.error("QR image must be smaller than 5 MB");
                      e.target.value = "";
                      setQrFile(null);
                      return;
                    }
                    setQrFile(file);
                  }}
                />
                {qrFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {qrFile.name}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button onClick={async () => {
                    if (!qrFile) { toast.error("Select an image first"); return; }
                    setUploadingQr(true);
                      try {
                        const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(QR_PATH, qrFile, {
                          upsert: true,
                          cacheControl: "0",
                          contentType: qrFile.type,
                        });
                        if (error) {
                          console.error("Supabase upload error:", error);
                          const msg = (error.message || "").toString();
                          if (error.status === 404 || /bucket not found/i.test(msg)) {
                            toast.error(`Storage bucket '${STORAGE_BUCKET}' not found. Create it under Supabase -> Storage and enable public access.`);
                          } else if (error.status === 403 || /access denied/i.test(msg)) {
                            toast.error("Upload forbidden: check your Supabase storage policies and keys (403)");
                          } else {
                            toast.error(`Upload failed (${error.status || "?"}): ${msg}`);
                          }
                        } else {
                          try {
                            setQrUrl(getQrPublicUrl());
                            setQrFile(null);
                            toast.success("QR uploaded");
                          } catch (gerr) {
                            console.error("getPublicUrl error:", gerr);
                            toast.success("Uploaded, but failed to read public URL. Check storage settings.");
                          }
                        }
                      } catch (err: any) {
                        console.error("Unexpected upload error:", err);
                        toast.error(err?.message || "Upload failed");
                      } finally { setUploadingQr(false); }
                  }} disabled={uploadingQr}>
                    {uploadingQr ? "Uploading..." : "Upload QR"}
                  </Button>
                  <Button variant="outline" onClick={() => { setQrFile(null); fetchQr(); }}>Reset</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "products" && (
        <div>
          <div className="mb-4 flex justify-end">
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
                <div className="space-y-3">
                  <select value={imageOptions.includes(form.image) ? form.image : ""} onChange={e => setForm({ ...form, image: e.target.value || form.image })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Keep current / uploaded image</option>
                    {imageOptions.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <div className="flex items-start gap-4">
                    <div className="h-28 w-28 overflow-hidden rounded-md border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentProductImage} alt={form.name || "Product image preview"} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        disabled={uploadingProductImage}
                        onChange={e => {
                          const file = e.target.files?.[0] ?? null;
                          if (!file) {
                            setProductImageFile(null);
                            return;
                          }
                          if (!file.type.startsWith("image/")) {
                            toast.error("Please select an image file");
                            e.target.value = "";
                            setProductImageFile(null);
                            return;
                          }
                          if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
                            toast.error("Product image must be smaller than 5 MB");
                            e.target.value = "";
                            setProductImageFile(null);
                            return;
                          }
                          setProductImageFile(file);
                        }}
                      />
                      {productImageFile && <p className="text-xs text-muted-foreground">Selected: {productImageFile.name}</p>}
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleProductImageUpload} disabled={uploadingProductImage || !productImageFile}>
                          {uploadingProductImage ? "Uploading..." : "Upload Image"}
                        </Button>
                        {!imageOptions.includes(form.image) && form.image && (
                          <Button type="button" variant="ghost" onClick={() => setForm({ ...form, image: emptyProduct.image })}>
                            Use Default Image
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground break-all">
                        Current image value: {form.image}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-md border border-dashed border-border p-3">
                    <p className="mb-2 text-sm font-medium">Gallery Images</p>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        multiple
                        disabled={uploadingProductImage}
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          const validFiles = files.filter(file => file.type.startsWith("image/") && file.size <= MAX_PRODUCT_IMAGE_SIZE_BYTES);
                          if (validFiles.length !== files.length) {
                            toast.error("Only image files under 5 MB are allowed");
                          }
                          setGalleryImageFiles(validFiles);
                        }}
                      />
                      {galleryImageFiles.length > 0 && (
                        <p className="text-xs text-muted-foreground">Selected: {galleryImageFiles.map(file => file.name).join(", ")}</p>
                      )}
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleGalleryImageUpload} disabled={uploadingProductImage || galleryImageFiles.length === 0}>
                          {uploadingProductImage ? "Uploading..." : "Upload Gallery Images"}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setGalleryImageFiles([])} disabled={galleryImageFiles.length === 0}>
                          Clear
                        </Button>
                      </div>
                      {form.gallery_images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 pt-2 md:grid-cols-4">
                          {form.gallery_images.map((galleryImage) => (
                            <div key={galleryImage} className="space-y-2">
                              <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={galleryImage} alt="Gallery preview" className="h-full w-full object-cover" />
                              </div>
                              <div className="flex flex-col gap-1">
                                {form.image !== galleryImage && (
                                  <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, image: galleryImage })}>
                                    Set Primary
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setForm((current) => {
                                    const nextGallery = current.gallery_images.filter((img) => img !== galleryImage);
                                    const nextPrimary = current.image === galleryImage ? (nextGallery[0] || emptyProduct.image) : current.image;
                                    return { ...current, image: nextPrimary, gallery_images: nextGallery };
                                  })}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.show_ingredients}
                    onChange={e => setForm({ ...form, show_ingredients: e.target.checked })}
                  />
                  Show Ingredients
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.show_usage_instructions}
                    onChange={e => setForm({ ...form, show_usage_instructions: e.target.checked })}
                  />
                  Show How to Use
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.show_rating_summary}
                    onChange={e => setForm({ ...form, show_rating_summary: e.target.checked })}
                  />
                  Show Rating
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
                <label className="mb-1 block text-sm font-medium">
                  Ingredients
                  {!form.show_ingredients && <span className="ml-2 text-xs font-normal text-muted-foreground">Hidden on product page</span>}
                </label>
                <textarea value={form.ingredients} onChange={e => setForm({ ...form, ingredients: e.target.value })}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Benefits (one per line)</label>
                <textarea value={benefitsText} onChange={e => setBenefitsText(e.target.value)}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Usage Instructions
                  {!form.show_usage_instructions && <span className="ml-2 text-xs font-normal text-muted-foreground">Hidden on product page</span>}
                </label>
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
        )}
      </div>
    </Layout>
  );
};

export default Admin;
