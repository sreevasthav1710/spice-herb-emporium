import { useState, useEffect } from "react";
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
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const STORAGE_BUCKET = import.meta.env.VITE_PAYMENT_BUCKET || "public";
  const QR_PATH = "payment/qr.png";
  const FALLBACK_QR_URL = `/payment/qr.jpeg?t=${Date.now()}`;
  const MAX_SCREENSHOT_SIZE_BYTES = 5 * 1024 * 1024;
  const handleQrImageError = () => {
    setQrUrl((currentUrl) => (currentUrl === FALLBACK_QR_URL ? currentUrl : FALLBACK_QR_URL));
  };

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(QR_PATH);
        setQrUrl(data.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : FALLBACK_QR_URL);
      } catch (err) {
        setQrUrl(FALLBACK_QR_URL);
      }
    };
    fetchQr();
  }, []);

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
    if (!screenshotUrl) {
      toast.error("Please upload your payment screenshot");
      return;
    }
    if (uploadingScreenshot) {
      toast.error("Please wait for the screenshot upload to finish");
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
          screenshot_url: screenshotUrl || null,
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
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="Payment QR" className="h-full w-full object-contain" onError={handleQrImageError} />
                ) : (
                  <div className="text-center">
                    <QrCode className="mx-auto h-20 w-20 text-muted-foreground/50" />
                    <p className="mt-2 text-xs text-muted-foreground">QR Code will be provided by admin</p>
                  </div>
                )}
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
                <label className="mb-1 block text-sm font-medium text-foreground">Upload payment screenshot *</label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingScreenshot}
                  onChange={async (e) => {
                    const file = e.target.files?.[0] ?? null;
                    setScreenshotFile(file);
                    setScreenshotUrl(null);
                    if (!file) return;
                    if (!user) { toast.error("You must be signed in to upload"); return; }
                    if (!file.type.startsWith("image/")) {
                      toast.error("Please choose an image file");
                      e.target.value = "";
                      setScreenshotFile(null);
                      return;
                    }
                    if (file.size > MAX_SCREENSHOT_SIZE_BYTES) {
                      toast.error("Screenshot must be smaller than 5 MB");
                      e.target.value = "";
                      setScreenshotFile(null);
                      return;
                    }
                    setUploadingScreenshot(true);
                    try {
                      const path = `payment/screenshots/${user.id}_${Date.now()}_${file.name}`;
                      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
                        contentType: file.type,
                        cacheControl: "3600",
                      });
                      if (error) {
                        const msg = (error.message || "").toString();
                        if (error.status === 404 || /bucket not found/i.test(msg)) {
                          toast.error(`Storage bucket '${STORAGE_BUCKET}' not found. Create it under Supabase -> Storage and enable public access.`);
                        } else if (/row-level security|violates row-level security/i.test(msg)) {
                          toast.error("Screenshot upload is blocked by Supabase storage policies. Apply the new migration, then try again.");
                        } else {
                          toast.error(msg || "Upload failed");
                        }
                      } else {
                        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
                        setScreenshotUrl(data.publicUrl || null);
                        toast.success("Screenshot uploaded");
                      }
                    } catch (err: any) {
                      console.error("upload screenshot error", err);
                      toast.error(err?.message || "Upload failed");
                    } finally { setUploadingScreenshot(false); }
                  }}
                />
                {uploadingScreenshot && (
                  <p className="mt-2 text-xs text-muted-foreground">Uploading screenshot...</p>
                )}
                {screenshotFile && !uploadingScreenshot && (
                  <p className="mt-2 text-xs text-muted-foreground">Selected: {screenshotFile.name}</p>
                )}
                {screenshotUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={screenshotUrl} alt="screenshot" className="mt-2 h-28 w-28 rounded-md object-contain" />
                )}
                {!screenshotUrl && !uploadingScreenshot && (
                  <p className="mt-2 text-xs text-destructive">A payment screenshot is required before placing the order.</p>
                )}
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
              disabled={submitting || uploadingScreenshot || !transactionId.trim() || !screenshotUrl}
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
