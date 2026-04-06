import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Send, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const shipping = totalPrice >= 499 ? 0 : 49;
  const total = totalPrice + shipping;

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const handlePlaceOrder = async () => {
    if (!transactionId.trim()) {
      toast.error("Please enter your Transaction ID");
      return;
    }

    setSubmitting(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_price: total,
          shipping,
          status: "pending_verification",
          transaction_id: transactionId.trim(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        variant_id: item.variant.id,
        product_name: item.product.name,
        weight: item.variant.weight,
        price: item.variant.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
      toast.success("Order placed! We'll verify your payment shortly.");
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <button onClick={() => navigate("/cart")} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </button>

        <h1 className="font-serif text-3xl font-bold text-foreground">Checkout</h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          {/* Payment QR Section */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-semibold text-foreground flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Pay via UPI / Scanner
            </h2>

            <div className="mb-6 flex flex-col items-center rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-8">
              <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-muted">
                <div className="text-center">
                  <QrCode className="mx-auto h-20 w-20 text-muted-foreground/50" />
                  <p className="mt-2 text-xs text-muted-foreground">QR Code will be provided by admin</p>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Scan this QR code using any UPI app (GPay, PhonePe, Paytm, etc.)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Amount to Pay</label>
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-secondary/50 px-3 text-lg font-bold text-primary">
                  ₹{total}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Transaction ID / UTR Number *</label>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter your payment transaction ID"
                  className="text-base"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  After payment, enter the Transaction ID shown in your UPI app
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-xl font-semibold text-foreground">Order Summary</h2>
              <div className="mt-4 divide-y divide-border">
                {items.map((item) => (
                  <div key={item.variant.id} className="flex justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.variant.weight} × {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">₹{item.variant.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={submitting || !transactionId.trim()}
              className="mt-6 w-full gap-2"
              size="lg"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Placing Order..." : "Place Order"}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Your order will be verified by our team and you'll see the status update shortly.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
