"use client";
import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";

const RoomUtils = () => {
  const handleLeaveRoom = () => {
    console.log("Leave Room clicked");
    // Implement logic to leave the room, e.g., update database, notify other users, etc.
  };

  const handleDeleteRoom = () => {
    console.log("Delete Room clicked");
    // Implement logic to delete the room, e.g., remove from database, notify other users, etc.
  };
  return (
    <div className="flex gap-4 my-5">
      <Link
        href="/protected"
        className="rounded-lg p-2 border border-foreground backdrop-blur-xl hover:underline transition"
      >
        Back to Rooms
      </Link>

      {/* <Button variant="destructive" onClick={handleLeaveRoom}>
        Leave Room
      </Button>
      <Button variant="destructive" onClick={handleDeleteRoom}>
        Delete Room
      </Button> */}
    </div>
  );
};

export default RoomUtils;
