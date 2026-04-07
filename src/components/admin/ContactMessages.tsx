import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Mail, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type ContactMessage = Tables<"contact_messages">;

const ContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const toggleRead = async (message: ContactMessage) => {
    setUpdatingId(message.id);

    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: !message.is_read })
      .eq("id", message.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(message.is_read ? "Marked as unread" : "Marked as read");
      setMessages((current) =>
        current.map((entry) =>
          entry.id === message.id ? { ...entry, is_read: !message.is_read } : entry,
        ),
      );
    }

    setUpdatingId(null);
  };

  const unreadCount = messages.filter((message) => !message.is_read).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Contact Messages
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">
              {unreadCount} unread
            </span>
          )}
        </h2>
        <Button size="sm" variant="outline" onClick={fetchMessages} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No customer messages yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const isExpanded = expanded === message.id;

            return (
              <div
                key={message.id}
                className={`rounded-xl border bg-card ${
                  message.is_read ? "border-border" : "border-primary/40"
                }`}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : message.id)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{message.name}</span>
                      {!message.is_read && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          New
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{message.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {message.email} · {new Date(message.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-4">
                    <div className="mb-4 rounded-lg bg-secondary/50 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Mail className="h-4 w-4 text-primary" />
                        {message.email}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {message.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={message.is_read ? "outline" : "default"}
                        onClick={() => toggleRead(message)}
                        disabled={updatingId === message.id}
                      >
                        {updatingId === message.id
                          ? "Saving..."
                          : message.is_read
                            ? "Mark Unread"
                            : "Mark Read"}
                      </Button>
                      <a
                        href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                      >
                        Reply by Email
                      </a>
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

export default ContactMessages;
