"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
}

export default function ClientRoomChat({ roomId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => createClient(), []);

  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // 1. Fetch current user once on mount
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profile")
          .select("username")
          .eq("email", user.email)
          .single();
        console.log(profile);
        if (profile) setCurrentUser(profile?.username || null);
        else setCurrentUser(user?.email || null);
      }
    };
    getUser();
  }, [supabase]);

  // 2. Optimized Fetch Messages
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (!error) setMessages(data || []);
  }, [roomId, supabase]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 3. Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Realtime Subscription Logic
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    let isActive = true;

    console.log("Setting up realtime connection for room:", roomId);

    const setupRealtime = () => {
      // Create a unique channel name
      const channel = supabase.channel(`room-${roomId}-${Date.now()}`, {
        config: {
          broadcast: { ack: false, self: true },
          presence: { key: "" },
        },
      });

      // Handle channel events
      channel
        .on("system", { event: "*" }, (payload) => {
          console.log("System event:", payload);
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            console.log("New message via realtime:", payload);
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((msg) => msg.id === payload.new.id)) {
                return prev;
              }
              return [...prev, payload.new];
            });
          },
        )
        .subscribe((status, err) => {
          console.log(`Realtime status for ${roomId}:`, status, err);

          if (!isActive) return;

          if (status === "SUBSCRIBED") {
            console.log("✅ Successfully connected to room:", roomId);
            setIsConnected(true);
          } else if (status === "CHANNEL_ERROR") {
            console.error("❌ Channel error:", err);
            setIsConnected(false);

            // Try to reconnect after delay
            if (isActive) {
              retryTimeout = setTimeout(() => {
                console.log("Attempting to reconnect...");
                setupRealtime();
              }, 5000);
            }
          } else if (status === "TIMED_OUT") {
            console.log("⏰ Connection timeout");
            setIsConnected(false);

            // Try to reconnect after delay
            if (isActive) {
              retryTimeout = setTimeout(() => {
                console.log("Attempting to reconnect after timeout...");
                setupRealtime();
              }, 5000);
            }
          } else if (status === "CLOSED") {
            console.log("🔌 Connection closed");
            setIsConnected(false);
          }
        });

      // Return cleanup function for this specific channel attempt
      return channel;
    };

    // Start the connection
    const channel = setupRealtime();

    // Cleanup function
    return () => {
      console.log("Cleaning up realtime connection for room:", roomId);
      isActive = false;
      clearTimeout(retryTimeout);

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomId, supabase]);

  // 5. Optimized Send Message
  const handleSendMessage = async (e?: React.ChangeEvent) => {
    e?.preventDefault();
    console.log(inputRef.current?.value);

    const message = inputRef.current?.value;
    console.log(message?.trim(), isSending, currentUser);

    if (!message?.trim() || isSending || !currentUser) return;

    console.log(inputRef.current?.value);

    setIsSending(true);
    const content = message.trim();
    if (inputRef.current) inputRef.current.value = "";

    try {
      const { error, data } = await supabase.from("messages").insert({
        room_id: roomId,
        content: content,
        username: currentUser,
      });
      console.log("data is ", data);

      if (error) throw error;
    } catch (error) {
      console.error("Error sending:", error);
      // Optional: restore text if failed
      if (inputRef.current) inputRef.current.value = content;
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <ChatHeader roomId={roomId} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar ">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm italic">
              No messages yet...
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.username === currentUser;
            return (
              <div
                key={message.id}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1`}
              >
                <div
                  className={`flex max-w-[80%] gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar (Only show for others) */}
                  {!isMe && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold border shadow-sm">
                      {message.username?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <div
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    {/* Name Label */}
                    <span className="text-[11px] font-medium text-muted-foreground mb-1 px-1">
                      {isMe ? "You" : message.username}
                    </span>

                    {/* Bubble */}
                    <div
                      className={`px-4 py-2 rounded-2xl shadow-sm border ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none border-primary"
                          : "bg-card text-card-foreground rounded-tl-none border-border"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t">
        <form
          onSubmit={handleSendMessage}
          className="flex gap-2 max-w-5xl mx-auto items-center"
        >
          <Input
            placeholder="Type your message..."
            className="flex-1 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
            ref={inputRef}
            disabled={isSending || !isConnected}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !isConnected}
            className="rounded-full shadow-md transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-1.5 mt-2 transition-opacity">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
          />
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            {isConnected ? "Server Live" : "Connecting..."}
          </p>
        </div>
      </div>
    </div>
  );
}
