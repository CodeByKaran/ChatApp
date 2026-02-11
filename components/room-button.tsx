import React from "react";
import { Button } from "./ui/button";

const RoomButton = () => {
  return (
    <div className="max-h-32 flex items-center justify-center bg-transparent backdrop-blur-lg border border-border rounded-lg w-[436px] max-[460px]:w-[75%]">
      <div className="flex items-center flex-col gap-4 py-6 px-12  w-full">
        <Button className="w-full bg-green-600 hover:bg-green-600/50 ">
          Create Room
        </Button>
        <Button variant="destructive" className="w-full">
          Join Room
        </Button>
      </div>
    </div>
  );
};

export default RoomButton;
