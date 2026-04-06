import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Order = {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  transaction_id: string | null;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_verification: { label: "Pending Verification", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-800" },
  processing: { label: "Processing", color: "bg-indigo-100 text-indigo-800" },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-orange-100 text-orange-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
};

const MyOrders = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_price, created_at, transaction_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setOrders(data as Order[]);
      setFetching(false);
    };
    fetch();
  }, [user]);

  if (loading || fetching) return <Layout><div className="container py-20 text-center text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <h1 className="font-serif text-3xl font-bold text-foreground">My Orders</h1>

        {orders.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <Package className="h-16 w-16 text-muted-foreground/30" />
            <p className="mt-4 text-lg text-muted-foreground">No orders yet</p>
            <Link to="/products" className="mt-4 text-sm font-medium text-primary hover:underline">Start Shopping</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map((o) => {
              const st = statusLabels[o.status] || { label: o.status, color: "bg-muted text-muted-foreground" };
              return (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground">₹{o.total_price}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyOrders;
