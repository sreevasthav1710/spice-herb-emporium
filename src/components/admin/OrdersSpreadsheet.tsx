import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Save } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Stages that count as a confirmed/approved order.
const APPROVED_STATUSES = ["approved", "processing", "shipped", "out_for_delivery", "delivered"];

type Product = {
  id: string;
  name: string;
  category: string;
};

type OrderItem = {
  order_id: string;
  product_name: string;
  weight: string;
  quantity: number;
  variant_id: string;
};

type Profile = {
  user_id: string;
  name: string | null;
  mobile: string | null;
};

type Order = {
  id: string;
  user_id: string;
  status: string;
  total_price: number;
  shipping: number;
  created_at: string;
};

type Override = {
  order_id: string;
  name_override: string | null;
  phone_override: string | null;
  amount_override: number | null;
  product_qty_overrides: Record<string, string>;
};

type Row = {
  orderId: string;
  sno: number;
  name: string;
  phone: string;
  productQty: Record<string, string>; // product_id -> "500g" etc.
  amount: number;
  createdAt: string;
};

const computeAutoQty = (
  productName: string,
  items: OrderItem[]
): string => {
  // Find items whose product_name matches (case-insensitive, name appears in either)
  const matches = items.filter((i) => {
    const a = i.product_name.toLowerCase();
    const b = productName.toLowerCase();
    return a === b || a.includes(b) || b.includes(a);
  });
  if (matches.length === 0) return "";
  return matches
    .map((m) => (m.quantity > 1 ? `${m.quantity} × ${m.weight}` : m.weight))
    .join(", ");
};

const OrdersSpreadsheet = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: prods }, { data: ordersData }] = await Promise.all([
        supabase.from("products").select("id, name, category").order("category").order("name"),
        supabase.from("orders").select("*").in("status", APPROVED_STATUSES).order("created_at"),
      ]);

      const productList = (prods || []) as Product[];
      const orders = (ordersData || []) as Order[];
      setProducts(productList);

      if (orders.length === 0) {
        setRows([]);
        return;
      }

      const orderIds = orders.map((o) => o.id);
      const userIds = [...new Set(orders.map((o) => o.user_id))];

      const [{ data: itemsData }, { data: profilesData }, { data: overridesData }] = await Promise.all([
        supabase.from("order_items").select("order_id, product_name, weight, quantity, variant_id").in("order_id", orderIds),
        supabase.from("profiles").select("user_id, name, mobile").in("user_id", userIds),
        supabase.from("order_spreadsheet_overrides").select("*").in("order_id", orderIds),
      ]);

      const items = (itemsData || []) as OrderItem[];
      const profiles = (profilesData || []) as Profile[];
      const overrides = (overridesData || []) as Override[];

      const overrideMap = new Map(overrides.map((o) => [o.order_id, o]));
      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

      const built: Row[] = orders.map((o, idx) => {
        const ov = overrideMap.get(o.id);
        const profile = profileMap.get(o.user_id);
        const orderItems = items.filter((i) => i.order_id === o.id);

        const productQty: Record<string, string> = {};
        for (const p of productList) {
          productQty[p.id] = ov?.product_qty_overrides?.[p.id] ?? computeAutoQty(p.name, orderItems);
        }

        return {
          orderId: o.id,
          sno: idx + 1,
          name: ov?.name_override ?? profile?.name ?? "",
          phone: ov?.phone_override ?? profile?.mobile ?? "",
          productQty,
          amount: ov?.amount_override ?? o.total_price,
          createdAt: o.created_at,
        };
      });

      setRows(built);
      setDirty(new Set());
    } catch (err: any) {
      toast.error(err?.message || "Failed to load spreadsheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, Product[]>();
    for (const p of products) {
      const key = p.category || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries());
  }, [products]);

  const updateRow = (orderId: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.orderId === orderId ? { ...r, ...patch } : r)));
    setDirty((prev) => new Set(prev).add(orderId));
  };

  const updateProductQty = (orderId: string, productId: string, value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.orderId === orderId ? { ...r, productQty: { ...r.productQty, [productId]: value } } : r
      )
    );
    setDirty((prev) => new Set(prev).add(orderId));
  };

  const saveAll = async () => {
    if (dirty.size === 0) {
      toast.info("No changes to save");
      return;
    }
    const payloads = rows
      .filter((r) => dirty.has(r.orderId))
      .map((r) => ({
        order_id: r.orderId,
        name_override: r.name || null,
        phone_override: r.phone || null,
        amount_override: Number.isFinite(r.amount) ? Math.round(r.amount) : null,
        product_qty_overrides: r.productQty,
      }));

    const { error } = await supabase
      .from("order_spreadsheet_overrides")
      .upsert(payloads, { onConflict: "order_id" });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Saved ${payloads.length} row(s)`);
      setDirty(new Set());
    }
  };

  const exportXlsx = () => {
    // Build sheet matching the user's template: grouped headers (category) + sub-headers (product name)
    const headerTop: (string | number)[] = ["S.NO", "Name", "Phone"];
    const headerSub: (string | number)[] = ["", "", ""];
    for (const [cat, prods] of groupedProducts) {
      headerTop.push(cat);
      headerSub.push(prods[0]?.name ?? "");
      for (let i = 1; i < prods.length; i++) {
        headerTop.push("");
        headerSub.push(prods[i].name);
      }
    }
    headerTop.push("Amount");
    headerSub.push("");

    const data: (string | number)[][] = [headerTop, headerSub];
    for (const r of rows) {
      const line: (string | number)[] = [r.sno, r.name, r.phone];
      for (const [, prods] of groupedProducts) {
        for (const p of prods) {
          line.push(r.productQty[p.id] ?? "");
        }
      }
      line.push(r.amount);
      data.push(line);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Merge category headers across their product columns
    const merges: XLSX.Range[] = [];
    let col = 3;
    for (const [, prods] of groupedProducts) {
      if (prods.length > 1) {
        merges.push({ s: { r: 0, c: col }, e: { r: 0, c: col + prods.length - 1 } });
      }
      col += prods.length;
    }
    ws["!merges"] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    const filename = `Orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success("Downloaded");
  };

  const totalCols = 3 + products.length + 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground">Orders Spreadsheet</h2>
          <p className="text-xs text-muted-foreground">
            Auto-populated from approved orders. Edits here are saved as overrides — original orders are untouched.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchAll} disabled={loading} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={saveAll} disabled={dirty.size === 0} className="gap-2">
            <Save className="h-4 w-4" /> Save{dirty.size > 0 ? ` (${dirty.size})` : ""}
          </Button>
          <Button size="sm" onClick={exportXlsx} className="gap-2">
            <Download className="h-4 w-4" /> Download .xlsx
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-secondary">
              <th rowSpan={2} className="sticky left-0 z-10 border border-border bg-secondary px-2 py-2 text-left font-semibold">S.NO</th>
              <th rowSpan={2} className="border border-border px-2 py-2 text-left font-semibold">Name</th>
              <th rowSpan={2} className="border border-border px-2 py-2 text-left font-semibold">Phone</th>
              {groupedProducts.map(([cat, prods]) => (
                <th key={cat} colSpan={prods.length} className="border border-border px-2 py-2 text-center font-semibold">
                  {cat}
                </th>
              ))}
              <th rowSpan={2} className="border border-border px-2 py-2 text-right font-semibold">Amount</th>
            </tr>
            <tr className="bg-secondary/60">
              {groupedProducts.flatMap(([cat, prods]) =>
                prods.map((p) => (
                  <th key={p.id} className="border border-border px-2 py-1 text-center text-[11px] font-medium text-muted-foreground" title={p.name}>
                    {p.name.length > 22 ? p.name.slice(0, 20) + "…" : p.name}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {loading ? "Loading..." : "No approved orders yet."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.orderId} className={dirty.has(r.orderId) ? "bg-primary/5" : ""}>
                  <td className="sticky left-0 z-[1] border border-border bg-card px-2 py-1 text-center font-medium">{r.sno}</td>
                  <td className="border border-border p-0">
                    <input
                      value={r.name}
                      onChange={(e) => updateRow(r.orderId, { name: e.target.value })}
                      className="w-full bg-transparent px-2 py-1 outline-none focus:bg-accent/30"
                    />
                  </td>
                  <td className="border border-border p-0">
                    <input
                      value={r.phone}
                      onChange={(e) => updateRow(r.orderId, { phone: e.target.value })}
                      className="w-full bg-transparent px-2 py-1 outline-none focus:bg-accent/30"
                    />
                  </td>
                  {groupedProducts.flatMap(([, prods]) =>
                    prods.map((p) => (
                      <td key={p.id} className="border border-border p-0">
                        <input
                          value={r.productQty[p.id] ?? ""}
                          onChange={(e) => updateProductQty(r.orderId, p.id, e.target.value)}
                          placeholder="—"
                          className="w-24 bg-transparent px-2 py-1 text-center text-xs outline-none focus:bg-accent/30"
                        />
                      </td>
                    ))
                  )}
                  <td className="border border-border p-0">
                    <input
                      type="number"
                      value={r.amount}
                      onChange={(e) => updateRow(r.orderId, { amount: Number(e.target.value) })}
                      className="w-24 bg-transparent px-2 py-1 text-right font-semibold outline-none focus:bg-accent/30"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersSpreadsheet;
