import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Contact = () => {
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name")?.toString().trim() || "",
      email: formData.get("email")?.toString().trim() || "",
      subject: formData.get("subject")?.toString().trim() || "",
      message: formData.get("message")?.toString().trim() || "",
    };

    try {
      const { error } = await supabase.from("contact_messages").insert(payload);
      if (error) throw error;

      toast.success("Message sent! The admin can now review it in the dashboard.");
      form.reset();
    } catch (err: any) {
      toast.error(err?.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container">
          <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Contact Us</h1>
          <p className="mt-2 text-muted-foreground">We'd love to hear from you</p>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div>
              <div className="space-y-6">
                {[
                  { icon: Phone, label: "Phone", value: "+91 99894 61148" },
                  { icon: Mail, label: "Email", value: "tennetisridevi1807@gmail.com" },
                  // { icon: MapPin, label: "Address", value: "123 Spice Lane, Kochi, Kerala, India - 682001" },
                  { icon: Clock, label: "Hours", value: "Mon–Sat: 9AM – 6PM IST" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2.5">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="Your name" maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="your@email.com" maxLength={255} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" required placeholder="How can we help?" maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" required placeholder="Tell us more..." rows={5} maxLength={2000} />
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
