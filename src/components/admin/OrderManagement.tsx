import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type OrderItem = {
  id: string;
  product_name: string;
  weight: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  user_id: string;
  status: string;
  total_price: number;
  shipping: number;
  transaction_id: string | null;
  admin_note: string | null;
  created_at: string;
  profile?: { name: string; email: string; mobile: string; address_line1: string | null; city: string | null; state: string | null; pincode: string | null } | null;
  items?: OrderItem[];
};

const STATUS_OPTIONS = [
  "pending_verification",
  "approved",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "rejected",
];

const statusLabels: Record<string, string> = {
  pending_verification: "⏳ Pending Verification",
  approved: "✅ Approved",
  processing: "📦 Processing",
  shipped: "🚚 Shipped",
  out_for_delivery: "🏍️ Out for Delivery",
  delivered: "✔️ Delivered",
  rejected: "❌ Rejected",
};

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const fetchOrders = async () => {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!ordersData) return;

    // Fetch items and profiles for all orders
    const orderIds = ordersData.map((o) => o.id);
    const userIds = [...new Set(ordersData.map((o) => o.user_id))];

    const { data: items } = await supabase.from("order_items").select("*").in("order_id", orderIds);
    const { data: profiles } = await supabase.from("profiles").select("name, email, mobile, address_line1, city, state, pincode, user_id").in("user_id", userIds);

    const enriched: Order[] = ordersData.map((o) => ({
      ...o,
      items: items?.filter((i) => i.order_id === o.id) || [],
      profile: profiles?.find((p) => p.user_id === o.user_id) || null,
    })) as Order[];

    setOrders(enriched);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const note = noteInputs[orderId] || null;
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, admin_note: note })
      .eq("id", orderId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Order updated to: ${statusLabels[newStatus] || newStatus}`);
      fetchOrders();
    }
  };

  const pendingCount = orders.filter((o) => o.status === "pending_verification").length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Orders {pendingCount > 0 && <span className="ml-2 rounded-full bg-destructive px-2.5 py-0.5 text-xs text-destructive-foreground">{pendingCount} pending</span>}
        </h2>
        <Button size="sm" variant="outline" onClick={fetchOrders}>Refresh</Button>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const isExpanded = expanded === o.id;
            return (
              <div key={o.id} className="rounded-xl border border-border bg-card">
                <button
                  onClick={() => setExpanded(isExpanded ? null : o.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">#{o.id.slice(0, 8).toUpperCase()}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {statusLabels[o.status] || o.status}
                      </span>
                      <span className="text-sm font-bold text-primary">₹{o.total_price}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {o.profile?.name || "Unknown"} • {new Date(o.created_at).toLocaleDateString("en-IN")}
                      {o.transaction_id && <> • TXN: <span className="font-mono">{o.transaction_id}</span></>}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-4">
                    {/* Customer Info */}
                    {o.profile && (
                      <div className="mb-4 rounded-lg bg-secondary/50 p-3 text-sm">
                        <p className="font-medium text-foreground">{o.profile.name}</p>
                        <p className="text-muted-foreground">{o.profile.email} • {o.profile.mobile}</p>
                        {o.profile.address_line1 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[o.profile.address_line1, o.profile.city, o.profile.state, o.profile.pincode].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Items */}
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Items</p>
                      {o.items?.map((item) => (
                        <div key={item.id} className="flex justify-between py-1 text-sm">
                          <span>{item.product_name} ({item.weight}) × {item.quantity}</span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                      <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold">
                        <span>Total (incl. ₹{o.shipping} shipping)</span>
                        <span>₹{o.total_price}</span>
                      </div>
                    </div>

                    {/* Transaction ID */}
                    {o.transaction_id && (
                      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">Transaction ID</p>
                        <p className="font-mono text-sm font-semibold text-foreground">{o.transaction_id}</p>
                      </div>
                    )}

                    {/* Admin Note & Status Update */}
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Admin Note (optional)</label>
                        <Input
                          value={noteInputs[o.id] || o.admin_note || ""}
                          onChange={(e) => setNoteInputs({ ...noteInputs, [o.id]: e.target.value })}
                          placeholder="Add a note for the customer..."
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Update Status</label>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map((st) => (
                            <Button
                              key={st}
                              size="sm"
                              variant={o.status === st ? "default" : "outline"}
                              className={`text-xs ${st === "rejected" ? "border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground" : ""}`}
                              onClick={() => updateStatus(o.id, st)}
                              disabled={o.status === st}
                            >
                              {statusLabels[st]}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
