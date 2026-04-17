import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RoomUtils from "./room-utils";

const RoomMessageButton = () => {
  return (
    <div className="flex flex-col ">
      <RoomUtils />
      <div>
        <Input
          placeholder="Type your message here..."
          className="mt-4 w-full"
        />
        <Button className="mt-4" onClick={() => console.log("Send message")}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default RoomMessageButton;
