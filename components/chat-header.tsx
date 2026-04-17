"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { ChevronLeft, MoreVertical, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";

interface ChatHeaderProps {
  roomId: string;
  onMenuToggle?: () => void;
}

export default function ChatHeader({ roomId, onMenuToggle }: ChatHeaderProps) {
  const supabase = createClient();
  const router = useRouter();
  const [roomName, setRoomName] = useState("Chat");
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const { data: room } = await supabase
          .from("rooms")
          .select("room_name")
          .eq("id", roomId)
          .single();

        if (room) {
          setRoomName(room.room_name);
        }

        // Count members (room subscriptions)
        const { data: subs } = await supabase
          .from("room_subs")
          .select("*", { count: "exact" })
          .eq("room_id", roomId);

        setMemberCount(subs?.length || 0);
      } catch (error) {
        console.error("Error fetching room info:", error);
      }
    };

    fetchRoomInfo();
  }, [roomId, supabase]);

  const handleLeaveRoom = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user?.id) {
        await supabase
          .from("room_subs")
          .delete()
          .eq("room_id", roomId)
          .eq("subscribed_by", user.user.id);

        router.push("/protected");
      }
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  return (
    <header className="flex items-center justify-between bg-card border-b border-border px-4 py-3 sticky top-0 z-10 pl-16 sm:pl-6">
      <div className="flex items-center gap-3 flex-1">
        {/* <button
          onClick={() => router.push("/protected")}
          className="md:hidden p-2 hover:bg-secondary rounded-lg transition"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button> */}

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-foreground truncate">{roomName}</h1>
          <p className="text-xs text-muted-foreground">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-background backdrop-blur-lg"
        >
          <DropdownMenuItem
            onClick={handleLeaveRoom}
            className="text-destructive"
          >
            Leave Group
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive min-[564px]:hidden">
            <LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
