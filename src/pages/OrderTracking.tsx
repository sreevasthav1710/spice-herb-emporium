import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, Package, Truck, MapPin, XCircle, ArrowLeft, Download } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { downloadInvoice } from "@/lib/invoice";

type OrderItem = {
  id: string;
  product_name: string;
  weight: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  status: string;
  total_price: number;
  shipping: number;
  transaction_id: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type Profile = {
  name: string;
  email: string;
  mobile: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
};

const STAGES = [
  { key: "pending_verification", label: "Payment Verification", icon: Clock, description: "We're verifying your payment" },
  { key: "approved", label: "Order Approved", icon: CheckCircle2, description: "Payment verified, order confirmed" },
  { key: "processing", label: "Processing", icon: Package, description: "Your order is being prepared" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "Your order is on the way" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin, description: "Your order will arrive today" },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, description: "Order delivered successfully" },
];

const getStageIndex = (status: string) => {
  if (status === "rejected") return -1;
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
};

const OrderTracking = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!id || !user) return;
    const { data: o } = await supabase.from("orders").select("*").eq("id", id).single();
    const { data: oi } = await supabase.from("order_items").select("*").eq("order_id", id);
    const { data: p } = await supabase
      .from("profiles")
      .select("name, email, mobile, address_line1, address_line2, city, state, pincode")
      .eq("user_id", user.id)
      .maybeSingle();

    if (o) setOrder(o as Order);
    if (oi) setItems(oi);
    if (p) setProfile(p as Profile);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();

    const channel = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (payload) => {
        setOrder(payload.new as Order);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  if (loading) return <Layout><div className="container py-20 text-center text-muted-foreground">Loading order...</div></Layout>;
  if (!order) return <Layout><div className="container py-20 text-center text-muted-foreground">Order not found</div></Layout>;

  const isRejected = order.status === "rejected";
  const currentStageIdx = getStageIndex(order.status);

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <Link to="/my-orders" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> My Orders
        </Link>

        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Order Status</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order #{order.id.slice(0, 8).toUpperCase()} • Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div className="mt-4">
            <Button variant="outline" className="gap-2" onClick={() => downloadInvoice({ order, items, profile })}>
              <Download className="h-4 w-4" /> Download Invoice
            </Button>
          </div>
        </div>

        {isRejected && (
          <div className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-3 font-serif text-xl font-bold text-destructive">Order Rejected</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.admin_note || "Your payment could not be verified. Please contact support."}
            </p>
          </div>
        )}

        {!isRejected && (
          <div className="mb-10 rounded-xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-6 font-serif text-lg font-semibold text-foreground">Tracking Progress</h2>
            <div className="relative">
              {STAGES.map((stage, i) => {
                const isCompleted = i <= currentStageIdx;
                const isCurrent = i === currentStageIdx;
                const Icon = stage.icon;

                return (
                  <div key={stage.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        isCompleted
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className={`my-1 h-12 w-0.5 ${i < currentStageIdx ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="pb-8">
                      <p className={`text-sm font-semibold ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                        {stage.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{stage.description}</p>
                      {isCurrent && (
                        <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.admin_note && !isRejected && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">Admin Note</p>
            <p className="mt-1 text-sm text-muted-foreground">{order.admin_note}</p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">Order Details</h2>
          <div className="mt-4 divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">{item.weight} x {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold">Rs. {item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? "Free" : `Rs. ${order.shipping}`}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Total</span><span>Rs. {order.total_price}</span></div>
            {order.transaction_id && (
              <div className="flex justify-between pt-2 text-xs"><span className="text-muted-foreground">Transaction ID</span><span className="font-mono">{order.transaction_id}</span></div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button variant="outline" asChild><Link to="/products">Continue Shopping</Link></Button>
        </div>
      </div>
    </Layout>
  );
};

export default OrderTracking;
