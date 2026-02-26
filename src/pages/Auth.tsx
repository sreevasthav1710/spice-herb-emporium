import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        if (!name.trim() || !mobile.trim()) {
          toast.error("Name and mobile number are required");
          setSubmitting(false);
          return;
        }
        await signUp(email, password, name);
        // Update profile with additional fields
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          await supabase.from("profiles").update({
            mobile,
            address_line1: addressLine1,
            address_line2: addressLine2,
            city,
            state,
            pincode,
          }).eq("user_id", newUser.id);
        }
        toast.success("Account created successfully!");
        navigate("/");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container flex justify-center py-12 md:py-20">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
          <div className="mb-6 flex flex-col items-center">
            <Leaf className="h-8 w-8 text-primary" />
            <h1 className="mt-2 font-serif text-2xl font-bold text-foreground">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp ? "Join SpiceRoot today" : "Sign in to your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Full Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Mobile Number *</label>
                  <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 9876543210" required />
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Email *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Password *</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
            </div>

            {isSignUp && (
              <div className="space-y-3 rounded-lg border border-border bg-secondary/50 p-4">
                <p className="text-sm font-medium text-foreground">Delivery Address</p>
                <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Address Line 1" />
                <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Address Line 2 (optional)" />
                <div className="grid grid-cols-2 gap-3">
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                </div>
                <Input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" />
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-primary hover:underline">
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
