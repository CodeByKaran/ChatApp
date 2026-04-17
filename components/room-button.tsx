"use client";
import React, { useRef } from "react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
import { Input } from "./ui/input";

const RoomButton = () => {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rooms, setRooms] = React.useState<any[]>([]);

  const handleCreateRoom = async (roomName: string) => {
    // Logic to create a new chat room
    console.log("Create Room button clicked");
    const { error, data } = await supabase
      .from("rooms")
      .insert({ room_name: roomName })
      .select()
      .single();
    if (error) {
      console.error("Error creating room:", error.message);
    } else {
      console.log("Room created successfully:", data);
      router.push(`/protected/${data.id}`); // Navigate to the newly created room page
    }

    const { error: insertError } = await supabase.from("room_subs").insert({
      room_id: data?.id,
      room_name: roomName || "Unnamed Room",
    });
    if (error || insertError) {
      console.error(
        "Error joining room:",
        error?.message || insertError?.message,
      );
    } else {
      // router.push(`/protected/${data?.id}`);
      console.log("room created and joined");
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    const isAlreadyJoined = rooms.some((room) => room.room_id === roomId);
    if (isAlreadyJoined) {
      console.warn("Already joined this room:", roomId);
      router.push(`/protected/${roomId}`);
      return;
    }
    // Logic to join an existing chat room
    console.log("Join Room button clicked with ID:", roomId);
    const { data: room, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();
    console.log("room name", room);

    const { error: insertError } = await supabase.from("room_subs").insert({
      room_id: roomId,
      room_name: room?.room_name || "Unnamed Room",
    });
    if (error || insertError) {
      console.error(
        "Error joining room:",
        error?.message || insertError?.message,
      );
    } else {
      router.push(`/protected/${roomId}`);
    }
  };

  const fetchRooms = async () => {
    const session = await supabase.auth.getSession();
    const userId = session.data?.session?.user.id;
    const { data, error } = await supabase
      .from("room_subs")
      .select("*")
      .eq("subscribed_by", userId);
    if (error) {
      console.error("Error fetching rooms:", error.message);
    } else {
      console.log("Subscribed rooms:", data);
      setRooms(data || []);
    }
  };

  React.useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className=" flex items-center justify-center bg-transparent backdrop-blur-lg border border-border rounded-lg w-[436px] max-[460px]:w-[75%]">
      <div className="flex items-center flex-col gap-4 py-6 px-12  w-full">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Create Room</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-background backdrop-blur-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Create a new chat room and share the room ID with your friends
                to let them join the conversation.
                <Input
                  placeholder="Room Name"
                  className="mt-2"
                  ref={inputRef}
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  handleCreateRoom(inputRef.current?.value || "My Room")
                }
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Join Room</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-background backdrop-blur-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Join an existing chat room by entering the room ID provided by
                your friend.
                <Input placeholder="Room ID" className="mt-2" ref={inputRef} />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleJoinRoom(inputRef.current?.value || "")}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div>
          <h2>Rooms</h2>
          <div className="flex flex-col gap-2 mt-2">
            {/* List of rooms will go here */}
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <div key={room.id} className="text-sm">
                  <p
                    className="underline cursor-pointer"
                    onClick={() => router.push(`/protected/${room.room_id}`)}
                  >
                    {room.room_name} - {room.room_id}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No rooms available. Create or join a room to start chatting!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomButton;
