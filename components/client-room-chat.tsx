"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import ChatHeader from "./chat-header";
import { Send } from "lucide-react";

interface Props {
  roomId: string;
}

interface Message {
  id: string;
  content: string;
  username: string;
  created_at: string;
  isSending?: boolean;
}

export default function ClientRoomChat({ roomId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  }, [roomId, supabase]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    let isActive = true;

    const setupRealtime = () => {
      const channel = supabase.channel(`room-${roomId}-${Date.now()}`, {
        config: {
          broadcast: { ack: false, self: true },
          presence: { key: "" },
        },
      });

      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === payload.new.id)) {
                return prev;
              }
              return [...prev, payload.new];
            });
          }
        )
        .subscribe((status, err) => {
          if (!isActive) return;

          if (status === "SUBSCRIBED") {
            setIsConnected(true);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setIsConnected(false);

            if (isActive) {
              retryTimeout = setTimeout(() => {
                setupRealtime();
              }, 5000);
            }
          } else if (status === "CLOSED") {
            setIsConnected(false);
          }
        });

      return channel;
    };

    const channel = setupRealtime();

    return () => {
      isActive = false;
      clearTimeout(retryTimeout);

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomId, supabase]);

  const handleSendMessage = async () => {
    const message = inputRef.current?.value;
    if (!message?.trim()) return;

    setIsSending(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      const userEmail = user.user?.email;

      const { data } = await supabase
        .from("profile")
        .select("username")
        .eq("email", userEmail)
        .single();

      await supabase
        .from("messages")
        .insert({
          room_id: roomId,
          content: message.trim(),
          username: data?.username,
        })
        .select()
        .single();

      inputRef.current!.value = "";
    } catch (error) {
      console.error("Error sending:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ChatHeader roomId={roomId} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/95 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="flex gap-3 mb-4 animate-in fade-in"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {message.username?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground">
                    {message.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-foreground break-words bg-card/50 rounded-lg p-2.5 border border-border/50">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            placeholder="Type a message..."
            className="flex-1"
            ref={inputRef}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isSending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {isConnected ? (
            <span className="text-green-600">Connected</span>
          ) : (
            <span className="text-destructive">Reconnecting...</span>
          )}
        </p>
      </div>
    </div>
  );
}
