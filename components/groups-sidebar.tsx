"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, LogIn, Search, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Room {
  id: string;
  room_id: string;
  room_name: string;
  created_at: string;
}

export default function GroupsSidebar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const currentRoomId = pathname?.split("/").pop();

  const fetchRooms = async () => {
    try {
      const session = await supabase.auth.getSession();
      const userId = session.data?.session?.user.id;

      if (userId) {
        const { data, error } = await supabase
          .from("room_subs")
          .select("*")
          .eq("subscribed_by", userId);

        if (!error) {
          setRooms(data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [supabase]);

  const handleCreateRoom = async (roomName: string) => {
    try {
      const { error, data } = await supabase
        .from("rooms")
        .insert({ room_name: roomName })
        .select()
        .single();

      if (error) throw error;

      const { error: insertError } = await supabase.from("room_subs").insert({
        room_id: data?.id,
        room_name: roomName || "Unnamed Room",
      });

      if (insertError) throw insertError;

      setDialogOpen(false);
      inputRef.current!.value = "";
      fetchRooms();
      router.push(`/protected/${data.id}`);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      const isAlreadyJoined = rooms.some((room) => room.room_id === roomId);
      if (isAlreadyJoined) {
        router.push(`/protected/${roomId}`);
        return;
      }

      const { data: room, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error) throw error;

      const { error: insertError } = await supabase.from("room_subs").insert({
        room_id: roomId,
        room_name: room?.room_name || "Unnamed Room",
      });

      if (insertError) throw insertError;

      setDialogOpen(false);
      inputRef.current!.value = "";
      fetchRooms();
      router.push(`/protected/${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.room_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="hidden md:flex flex-col w-72 bg-card border-r border-border h-screen sticky top-0 p-4 gap-4 overflow-hidden">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Groups</h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="flex-1 gap-2" variant="default">
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background backdrop-blur-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Create New Group</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter a name for your new chat group. You can share the group
                  ID with friends to let them join.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                placeholder="Group Name"
                ref={inputRef}
                className="mt-2"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    handleCreateRoom(inputRef.current?.value || "My Group")
                  }
                >
                  Create
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex-1 gap-2">
                <LogIn className="w-4 h-4" />
                Join
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background backdrop-blur-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Join Group</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter the group ID provided by your friend to join their chat
                  group.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                placeholder="Group ID"
                ref={inputRef}
                className="mt-2"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleJoinRoom(inputRef.current?.value || "")}
                >
                  Join
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              Loading groups...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              {searchTerm
                ? "No groups match your search"
                : "No groups yet. Create or join one to start!"}
            </div>
          ) : (
            filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => router.push(`/protected/${room.room_id}`)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  currentRoomId === room.room_id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-secondary text-foreground"
                }`}
              >
                <p className="font-medium text-sm truncate">{room.room_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  ID: {room.room_id}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
