"use client";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import RoomUtils from "./room-utils";

interface Props {
  roomId: string;
}

export default function ClientRoomChat({ roomId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      console.log("messages ", data);

      setMessages(data || []);
    }
  }, [roomId, supabase]);

  // Separate effect for fetching messages on room change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Separate effect for realtime subscription
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

  const handleSendMessage = async () => {
    const message = inputRef.current?.value;
    if (!message?.trim()) return;

    const { data: user } = await supabase.auth.getUser();

    const userEmail = user.user?.email;

    const { data } = await supabase
      .from("profile")
      .select("username")
      .eq("email", userEmail)
      .single();

    // Optimistically add message
    // const tempId = Date.now();
    // setMessages((prev) => [
    //   ...prev,
    //   {
    //     id: tempId,
    //     content: message.trim(),
    //     created_at: new Date().toISOString(),
    //     room_id: roomId,
    //     isSending: true,
    //   },
    // ]);

    const { error } = await supabase
      .from("messages")
      .insert({
        room_id: roomId,
        content: message.trim(),
        username: data?.username,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending:", error);
      // Remove optimistic message on error
      // setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } else {
      inputRef.current!.value = "";
    }
  };

  return (
    <div className="text-center p-8 max-w-2xl mx-auto bg-background/80 backdrop-blur-lg rounded-lg border">
      <p className="mb-4">
        Room ID: <strong>{roomId}</strong>
        <span
          className={`ml-2 px-2 py-1 rounded text-xs ${
            isConnected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isConnected ? "🟢 Live" : "🔴 Disconnected"}
        </span>
      </p>
      <RoomUtils />

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Type your message..."
          className="flex-1"
          ref={inputRef}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <Button onClick={handleSendMessage}>Send</Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto p-4 rounded border">
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">No messages yet. Be the first!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg shadow-sm border-l-4 ${
                message.isSending
                  ? "border-yellow-500 opacity-50"
                  : "border-blue-500"
              }`}
            >
              <small className="text-xs text-gray-500">
                {message.username}
              </small>
              <p>{message.content}</p>
              <small className="text-gray-500">
                {new Date(message.created_at).toLocaleTimeString()}
                {message.isSending && " (sending...)"}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
