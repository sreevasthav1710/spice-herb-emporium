import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type PendingOrder = {
  id: string;
  created_at: string;
};

const sessionKeyForOrder = (orderId: string) => `order-feedback-dismissed:${orderId}`;

const OrderFeedbackPrompt = () => {
  const { user, isAdmin, loading } = useAuth();
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [suggestion, setSuggestion] = useState("");

  const formattedOrderDate = useMemo(() => {
    if (!pendingOrder) return "";
    return new Date(pendingOrder.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [pendingOrder]);

  const loadPendingFeedbackOrder = async () => {
    if (!user || isAdmin) return;

    const { data: deliveredOrders, error: ordersError } = await supabase
      .from("orders")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("status", "delivered")
      .order("updated_at", { ascending: false });

    if (ordersError) return;
    if (!deliveredOrders || deliveredOrders.length === 0) {
      setPendingOrder(null);
      setOpen(false);
      return;
    }

    const deliveredOrderIds = deliveredOrders.map((order) => order.id);
    const { data: feedbackRows, error: feedbackError } = await supabase
      .from("order_feedback")
      .select("order_id")
      .in("order_id", deliveredOrderIds);

    if (feedbackError) return;

    const reviewedOrderIds = new Set((feedbackRows || []).map((row) => row.order_id));
    const nextPendingOrder = deliveredOrders.find((order) => {
      if (reviewedOrderIds.has(order.id)) return false;
      return sessionStorage.getItem(sessionKeyForOrder(order.id)) !== "true";
    });

    setPendingOrder(nextPendingOrder || null);
    setOpen(Boolean(nextPendingOrder));
  };

  useEffect(() => {
    if (loading || !user || isAdmin) return;
    loadPendingFeedbackOrder();
  }, [loading, user, isAdmin]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && pendingOrder) {
      sessionStorage.setItem(sessionKeyForOrder(pendingOrder.id), "true");
    }
  };

  const handleSubmit = async () => {
    if (!user || !pendingOrder) return;
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("order_feedback").insert({
        order_id: pendingOrder.id,
        user_id: user.id,
        rating,
        review: review.trim() || null,
        suggestion: suggestion.trim() || null,
      });

      if (error) throw error;

      toast.success("Thanks for sharing your feedback");
      setRating(0);
      setReview("");
      setSuggestion("");
      setPendingOrder(null);
      setOpen(false);
      await loadPendingFeedbackOrder();
    } catch (error: any) {
      toast.error(error?.message || "Could not submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || isAdmin || !pendingOrder) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Rate Your Delivered Order</DialogTitle>
          <DialogDescription>
            Your order placed on {formattedOrderDate} has been delivered. Share a quick rating and any review or suggestion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Your Rating</p>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    className="rounded-md p-1 transition-transform hover:scale-110"
                    aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                  >
                    <Star className={`h-7 w-7 ${starValue <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Review</p>
            <Textarea
              value={review}
              onChange={(event) => setReview(event.target.value)}
              placeholder="Tell us what you liked about your order"
              rows={4}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Suggestions</p>
            <Textarea
              value={suggestion}
              onChange={(event) => setSuggestion(event.target.value)}
              placeholder="Anything we can improve?"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Later
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderFeedbackPrompt;
